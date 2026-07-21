import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from './logger';
import { getTransactionId } from './context';
import { getEnv } from './env';
import { createContainers } from '../repositories/migrations';
import { AppError } from '../middleware/errorHandler';
import { HttpStatus } from './httpStatus';

const databaseUrl = getEnv('DATABASE_URL');
const dbHost = getEnv('DB_HOST');
const dbPort = getEnv('DB_PORT') ? parseInt(getEnv('DB_PORT')!, 10) : 5432;
const dbUser = getEnv('DB_USER');
const dbPassword = getEnv('DB_PASSWORD');
const dbName = getEnv('DB_NAME');
const sslEnabled = getEnv('SSL_DB_ENABLED') === "true";
const sslRejectUnauthorized = getEnv('SSL_DB_REJECT_UNAUTHORIZED') === "true";

export let pool: Pool | null = null;
export let isDbHealthy = false;
export let dbErrorDetails = '';

let poolConfig: any = null;

if (dbHost && dbUser && dbName) {
  poolConfig = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    max: getEnv('DB_POOL_MAX') ? parseInt(getEnv('DB_POOL_MAX')!, 10) : 20,
    idleTimeoutMillis: getEnv('DB_IDLE_TIMEOUT') ? parseInt(getEnv('DB_IDLE_TIMEOUT')!, 10) : 30000,
    connectionTimeoutMillis: getEnv('DB_CONNECTION_TIMEOUT') ? parseInt(getEnv('DB_CONNECTION_TIMEOUT')!, 10) : 5000,
    ssl: sslEnabled ? {
      rejectUnauthorized: sslRejectUnauthorized,
    } : false,
  };
  logger.info('Database pool configuration generated', {
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    database: poolConfig.database,
    sslEnabled,
    ssl: poolConfig.ssl,
  });
} else if (databaseUrl) {
  poolConfig = {
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

if (poolConfig) {
  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    logger.error('Unexpected database client error', { error: err.message, stack: err.stack });
    isDbHealthy = false;
    dbErrorDetails = err.message;
  });
} else {
  dbErrorDetails = 'Database environment variables are not fully configured.';
  logger.warn(`${dbErrorDetails} Database is disabled.`);
}

// Exponential backoff sleep utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function initDb(): Promise<void> {
  if (!pool) {
    logger.error('Cannot initialize database: Pool is not created because database environment variables are missing.');
    return;
  }

  let retries = 5;
  let delay = 1000;
  let client: PoolClient | null = null;

  while (retries > 0) {
    try {
      logger.info(`Attempting to connect to PostgreSQL database (retries left: ${retries})...`);
      client = await pool.connect();
      logger.info('Connected to PostgreSQL successfully.');
      break;
    } catch (err: any) {
      retries--;
      logger.warn(`Database connection failed: ${err.message}. Retrying in ${delay}ms...`, {
        error: err.message,
      });
      if (retries === 0) {
        logger.error('Failed to connect to database after all retries. Running in degraded state.');
        isDbHealthy = false;
        dbErrorDetails = `Failed to connect to database: ${err.message}`;
        return;
      }
      await sleep(delay);
      delay *= 2;
    }
  }

  if (!client) return;

  try {
    // Run migrations and default user seed
    await createContainers(client);
    isDbHealthy = true;
    dbErrorDetails = '';
  } catch (err: any) {
    logger.error('Database migration/initialization failed', { error: err.message, stack: err.stack });
    isDbHealthy = false;
    dbErrorDetails = `Schema initialization error: ${err.message}`;
  } finally {
    client.release();
  }
}

// The backend defers connecting to the DB until something explicitly triggers it
// (see POST /health/api) rather than connecting eagerly at boot. That's fine for a
// cold start, but `isDbHealthy` is in-memory state — it's wiped by any process
// restart (e.g. ts-node-dev --respawn on every file save in dev), and nothing was
// re-triggering it afterwards. An already-logged-in session would then get a hard
// DB_OFFLINE on its very next request until someone manually replayed the trigger.
// Self-heal instead: lazily (re)connect on first real use if we're not already healthy.
let lazyInitPromise: Promise<void> | null = null;
export async function ensureDbInitialized(): Promise<void> {
  if (isDbHealthy || !pool) return;
  if (!lazyInitPromise) {
    lazyInitPromise = initDb().finally(() => {
      lazyInitPromise = null;
    });
  }
  await lazyInitPromise;
}

// Wrapper for query execution with transaction ID tracking
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await ensureDbInitialized();

  if (!pool || !isDbHealthy) {
    throw new AppError(
      HttpStatus.SERVICE_UNAVAILABLE,
      `Service is offline (${dbErrorDetails})`,
      'DB_OFFLINE'
    );
  }

  const transactionId = getTransactionId();
  // Inject transaction ID as query comment for tracing in Postgres logs
  const commentedQuery = transactionId ? `/* TxID: ${transactionId} */ ${text}` : text;

  try {
    return await pool.query(commentedQuery, params);
  } catch (err: any) {
    logger.error('Database query execution error', {
      query: text,
      params,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

// Transaction helper block
export async function runInTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  await ensureDbInitialized();

  if (!pool || !isDbHealthy) {
    throw new Error(`Database transaction failed: database is offline (${dbErrorDetails})`);
  }

  const client = await pool.connect();
  const transactionId = getTransactionId();

  try {
    await client.query(transactionId ? `/* TxID: ${transactionId} */ BEGIN` : 'BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err: any) {
    logger.warn('Transaction aborted, rolling back changes', { error: err.message });
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    logger.info('Closing database connection pool...');
    await pool.end();
    logger.info('Database connection pool closed.');
  }
}
