import { QueryResultRow } from 'pg';
import * as db from '../utils/db';
import * as qb from './queryBuilder';
import { logger } from '../utils/logger';
import { getRequestIp } from '../utils/context';
import { TABLES } from './migrations';

interface Executor {
  query(text: string, values?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
}

const _exec = async (executor: Executor, text: string, values: any[]) => {
  const result = await executor.query(text, values);
  return result;
};

const _buildDaoMethods = (executor: Executor) => ({
  // SELECT 
  async getOneDataByCond<T = any>(table: string, conditions: Record<string, any>, options: qb.QueryOptions = {}): Promise<T | null> {
    const { text, values } = qb.buildSelect(table, conditions, { ...options, limit: 1 });
    const result = await _exec(executor, text, values);
    return (result.rows[0] as T) || null;
  },

  async getAllDataByCond<T = any>(table: string, conditions: Record<string, any> = {}, options: qb.QueryOptions = {}): Promise<T[]> {
    const { text, values } = qb.buildSelect(table, conditions, options);
    const result = await _exec(executor, text, values);
    return result.rows as T[];
  },

  async countData(table: string, conditions: Record<string, any> = {}, countCol = '*'): Promise<number> {
    const { text, values } = qb.buildCount(table, conditions, countCol);
    const result = await _exec(executor, text, values);
    return parseInt(result.rows[0].count, 10);
  },

  async getAllWithCount<T = any>(table: string, conditions: Record<string, any> = {}, options: qb.QueryOptions = {}): Promise<{ rows: T[]; total: number }> {
    const self = _buildDaoMethods(executor);
    const [rows, total] = await Promise.all([
      self.getAllDataByCond<T>(table, conditions, options),
      self.countData(table, conditions),
    ]);
    return { rows, total };
  },

  // JOIN SELECT
  async getAllJoin<T = any>(table: string, alias: string, options: qb.JoinSelectOptions = {}): Promise<T[]> {
    const { text, values } = qb.buildJoinSelect(table, alias, options);
    const result = await _exec(executor, text, values);
    return result.rows as T[];
  },

  async getOneJoin<T = any>(table: string, alias: string, options: qb.JoinSelectOptions = {}): Promise<T | null> {
    const { text, values } = qb.buildJoinSelect(table, alias, { ...options, limit: 1 });
    const result = await _exec(executor, text, values);
    return (result.rows[0] as T) || null;
  },

  // INSERT
  async addData<T = any>(table: string, data: Record<string, any>, options: qb.QueryOptions = {}): Promise<T> {
    // Every activity_logs row gets the requesting client's IP automatically (from
    // the AsyncLocalStorage request context — see requestLogger.ts) rather than
    // requiring each of the ~30 call sites across the codebase to remember to pass
    // it — a security/audit trail with holes because one call site forgot is worse
    // than this one shared insertion point doing it uniformly. Callers can still
    // override by passing ip_address explicitly.
    const finalData = (table === TABLES.ACTIVITY_LOGS && data.ip_address === undefined)
      ? { ...data, ip_address: getRequestIp() || null }
      : data;
    const { text, values } = qb.buildInsert(table, finalData, options);
    const result = await _exec(executor, text, values);
    return result.rows[0] as T;
  },

  async bulkInsertData<T = any>(table: string, rows: Array<Record<string, any>>, options: qb.QueryOptions = {}): Promise<T[]> {
    const { text, values } = qb.buildBulkInsert(table, rows, options);
    const result = await _exec(executor, text, values);
    return result.rows as T[];
  },

  async upsertData<T = any>(table: string, data: Record<string, any>, conflictKeys: string[], options: qb.QueryOptions = {}): Promise<T | null> {
    const { text, values } = qb.buildUpsert(table, data, conflictKeys, options);
    const result = await _exec(executor, text, values);
    return (result.rows[0] as T) || null;
  },

  // UPDATE 
  async updateData<T = any>(table: string, data: Record<string, any>, conditions: Record<string, any>, options: qb.QueryOptions = {}): Promise<T | null> {
    const { text, values } = qb.buildUpdate(table, data, conditions, options);
    const result = await _exec(executor, text, values);
    return (result.rows[0] as T) || null;
  },

  // DELETE 
  async deleteDataByCond<T = any>(table: string, conditions: Record<string, any>, options: qb.QueryOptions = {}): Promise<T | null> {
    const { text, values } = qb.buildDelete(table, conditions, options);
    const result = await _exec(executor, text, values);
    return (result.rows[0] as T) || null;
  },

  async bulkDeleteData(table: string, conditions: Record<string, any>, options: qb.QueryOptions = {}): Promise<number | any[]> {
    const { text, values } = qb.buildDelete(table, conditions, options);
    const result = await _exec(executor, text, values);
    return options.returning ? result.rows : (result.rowCount ?? 0);
  },

  // RAW 
  async rawQuery<T = any>(text: string, values: any[] = []): Promise<T[]> {
    const result = await _exec(executor, text, values);
    return result.rows as T[];
  },
});

const poolExecutor: Executor = {
  query: async (text: string, values?: any[]) => {
    return await db.query(text, values);
  }
};

export const commonDao = _buildDaoMethods(poolExecutor);

export const transaction = async <T>(fn: (trx: ReturnType<typeof _buildDaoMethods>) => Promise<T>): Promise<T> => {
  await db.ensureDbInitialized();
  if (!db.pool) throw new Error('Database pool is offline.');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const queryWrapper: Executor = {
      query: async (text: string, values?: any[]) => {
        const { getTransactionId } = require('../utils/context');
        const txId = getTransactionId();
        const commentedSql = txId ? `/* TxID: ${txId} */ ${text}` : text;
        return await client.query(commentedSql, values);
      }
    };
    const trx = _buildDaoMethods(queryWrapper);
    const result = await fn(trx);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
