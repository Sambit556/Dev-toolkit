// SQL Identifier sanitizer to prevent SQL Injection in identifier names
export const sanitizeIdentifier = (name: string): string => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return name;
};

const buildReturning = (returning?: string | string[]): string => {
  if (!returning || returning === '*') return 'RETURNING *';
  if (Array.isArray(returning) && returning.length > 0) {
    return `RETURNING ${returning.map(sanitizeIdentifier).join(', ')}`;
  }
  return 'RETURNING *';
};

const OPERATORS: Record<string, string> = {
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
  $ne: '!=',
  $like: 'LIKE',
  $ilike: 'ILIKE',
};

const parseCondition = (key: string, value: any, values: any[]): string => {
  const col = sanitizeIdentifier(key);

  if (value === null) {
    return `${col} IS NULL`;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const fragments: string[] = [];

    for (const [op, opVal] of Object.entries(value)) {
      if (op === '$isNull') {
        fragments.push(opVal ? `${col} IS NULL` : `${col} IS NOT NULL`);
      } else if (op === '$in') {
        if (!Array.isArray(opVal) || opVal.length === 0) {
          throw new Error(`$in requires a non-empty array for column: ${key}`);
        }
        values.push(opVal);
        fragments.push(`${col} = ANY($${values.length})`);
      } else if (op === '$between') {
        if (!Array.isArray(opVal) || opVal.length !== 2) {
          throw new Error(`$between requires a [min, max] array for column: ${key}`);
        }
        values.push(opVal[0]);
        const lo = values.length;
        values.push(opVal[1]);
        const hi = values.length;
        fragments.push(`${col} BETWEEN $${lo} AND $${hi}`);
      } else if (OPERATORS[op]) {
        values.push(opVal);
        fragments.push(`${col} ${OPERATORS[op]} $${values.length}`);
      } else {
        throw new Error(`Unknown operator: ${op}`);
      }
    }

    return fragments.join(' AND ');
  }

  values.push(value);
  return `${col} = $${values.length}`;
};

export const buildConditionParts = (conditions: Record<string, any> = {}, values: any[]): string[] => {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    if (key === '$or') {
      if (!Array.isArray(value) || value.length === 0) continue;
      const orParts: string[] = [];
      for (const orCond of value) {
        const inner: string[] = [];
        for (const [k, v] of Object.entries(orCond)) {
          inner.push(parseCondition(k, v, values));
        }
        orParts.push(inner.length === 1 ? inner[0] : `(${inner.join(' AND ')})`);
      }
      parts.push(`(${orParts.join(' OR ')})`);
    } else if (key === '$raw') {
      const rawConds = Array.isArray(value) ? value : [value];
      for (const { sql, values: args = [] } of rawConds) {
        let i = 0;
        parts.push(sql.replace(/\?/g, () => {
          values.push(args[i++]);
          return `$${values.length}`;
        }));
      }
    } else {
      parts.push(parseCondition(key, value, values));
    }
  }

  return parts;
};

export const buildWhere = (conditions: Record<string, any> = {}, startValues: any[] = []): { clause: string; values: any[] } => {
  const values = [...startValues];
  const parts = buildConditionParts(conditions, values);
  const clause = parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : '';
  return { clause, values };
};

export interface QueryOptions {
  fields?: string[];
  columns?: string[];
  returning?: string | string[];
  orderBy?: string | Array<{ col?: string; column?: string; dir?: 'ASC' | 'DESC' }>;
  orderDir?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  groupBy?: string | string[];
  having?: string;
  havingValues?: any[];
  distinct?: boolean;
  autoTimestamp?: boolean;
}

export const buildInsert = (table: string, data: Record<string, any>, options: QueryOptions = {}): { text: string; values: any[] } => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const ret = buildReturning(options.returning);

  return {
    text: `INSERT INTO ${sanitizeIdentifier(table)} (${keys.map(sanitizeIdentifier).join(', ')}) VALUES (${placeholders.join(', ')}) ${ret}`,
    values,
  };
};

export const buildBulkInsert = (table: string, rows: Array<Record<string, any>>, options: QueryOptions = {}): { text: string; values: any[] } => {
  if (!rows.length) throw new Error('bulkInsert requires at least one row');
  const keys = Object.keys(rows[0]);
  const values: any[] = [];
  const rowPlaceholders: string[] = [];

  for (const row of rows) {
    const ph = keys.map((k) => {
      values.push(row[k]);
      return `$${values.length}`;
    });
    rowPlaceholders.push(`(${ph.join(', ')})`);
  }

  const ret = buildReturning(options.returning);
  return {
    text: `INSERT INTO ${sanitizeIdentifier(table)} (${keys.map(sanitizeIdentifier).join(', ')}) VALUES ${rowPlaceholders.join(', ')} ${ret}`,
    values,
  };
};

export const buildUpsert = (table: string, data: Record<string, any>, conflictKeys: string[], options: QueryOptions = {}): { text: string; values: any[] } => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const conflict = conflictKeys.map(sanitizeIdentifier).join(', ');
  const updateSet = keys
    .filter((k) => !conflictKeys.includes(k))
    .map((k) => `${sanitizeIdentifier(k)} = EXCLUDED.${sanitizeIdentifier(k)}`)
    .join(', ');
  const ret = buildReturning(options.returning);

  let text = `INSERT INTO ${sanitizeIdentifier(table)} (${keys.map(sanitizeIdentifier).join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${conflict})`;
  text += updateSet ? ` DO UPDATE SET ${updateSet} ${ret}` : ` DO NOTHING ${ret}`;

  return { text, values };
};

export const buildSelect = (table: string, conditions: Record<string, any> = {}, options: QueryOptions = {}): { text: string; values: any[] } => {
  const distinct = options.distinct ? 'DISTINCT ' : '';
  const cols = options.fields
    ? options.fields.map(sanitizeIdentifier).join(', ')
    : options.columns
      ? options.columns.map(sanitizeIdentifier).join(', ')
      : '*';

  let text = `SELECT ${distinct}${cols} FROM ${sanitizeIdentifier(table)}`;

  const { clause, values } = buildWhere(conditions);
  text += clause;

  if (options.groupBy) {
    const groups = Array.isArray(options.groupBy) ? options.groupBy : [options.groupBy];
    text += ` GROUP BY ${groups.map(sanitizeIdentifier).join(', ')}`;
  }

  if (options.having) {
    text += ` HAVING ${options.having}`;
    if (options.havingValues) values.push(...options.havingValues);
  }

  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      const parts = options.orderBy.map(
        (o) => `${sanitizeIdentifier(o.col || o.column || '')} ${o.dir === 'DESC' ? 'DESC' : 'ASC'}`
      );
      text += ` ORDER BY ${parts.join(', ')}`;
    } else {
      text += ` ORDER BY ${sanitizeIdentifier(options.orderBy)} ${options.orderDir === 'DESC' ? 'DESC' : 'ASC'}`;
    }
  }

  if (options.limit) text += ` LIMIT ${parseInt(options.limit as any, 10)}`;
  if (options.offset) text += ` OFFSET ${parseInt(options.offset as any, 10)}`;

  return { text, values };
};

export const buildCount = (table: string, conditions: Record<string, any> = {}, countCol = '*'): { text: string; values: any[] } => {
  const target = countCol === '*' ? '*' : sanitizeIdentifier(countCol);
  let text = `SELECT COUNT(${target}) AS count FROM ${sanitizeIdentifier(table)}`;
  const { clause, values } = buildWhere(conditions);
  text += clause;
  return { text, values };
};

export interface JoinOption {
  type?: 'LEFT' | 'RIGHT' | 'INNER' | 'FULL';
  table: string;
  alias?: string;
  onRaw?: string;
  on?: Record<string, any>;
}

export interface JoinSelectOptions extends QueryOptions {
  joins?: JoinOption[];
  conditions?: Record<string, any>;
}

const JOIN_TYPES = ['LEFT', 'RIGHT', 'INNER', 'FULL'];

export const buildJoinSelect = (table: string, alias: string, options: JoinSelectOptions = {}): { text: string; values: any[] } => {
  const distinct = options.distinct ? 'DISTINCT ' : '';
  const cols = options.fields && options.fields.length ? options.fields.join(', ') : '*';
  const baseAlias = alias ? ` ${sanitizeIdentifier(alias)}` : '';

  let text = `SELECT ${distinct}${cols} FROM ${sanitizeIdentifier(table)}${baseAlias}`;
  const values: any[] = [];

  for (const j of options.joins || []) {
    const joinType = (j.type || 'LEFT').toUpperCase();
    if (!JOIN_TYPES.includes(joinType)) {
      throw new Error(`Unsupported join type: ${j.type}`);
    }
    const joinAlias = j.alias ? ` ${sanitizeIdentifier(j.alias)}` : '';
    const onParts: string[] = [];
    if (j.onRaw) onParts.push(j.onRaw);
    if (j.on) onParts.push(...buildConditionParts(j.on, values));
    if (!onParts.length) throw new Error(`Join on ${j.table} requires onRaw and/or on`);

    text += ` ${joinType} JOIN ${sanitizeIdentifier(j.table)}${joinAlias} ON ${onParts.join(' AND ')}`;
  }

  const whereParts = buildConditionParts(options.conditions || {}, values);
  if (whereParts.length) text += ` WHERE ${whereParts.join(' AND ')}`;

  if (options.groupBy) {
    const groups = Array.isArray(options.groupBy) ? options.groupBy : [options.groupBy];
    text += ` GROUP BY ${groups.map(sanitizeIdentifier).join(', ')}`;
  }

  if (options.having) {
    text += ` HAVING ${options.having}`;
    if (options.havingValues) values.push(...options.havingValues);
  }

  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      const parts = options.orderBy.map(
        (o) => `${sanitizeIdentifier(o.col || o.column || '')} ${o.dir === 'DESC' ? 'DESC' : 'ASC'}`
      );
      text += ` ORDER BY ${parts.join(', ')}`;
    } else {
      text += ` ORDER BY ${sanitizeIdentifier(options.orderBy)} ${options.orderDir === 'DESC' ? 'DESC' : 'ASC'}`;
    }
  }

  if (options.limit) text += ` LIMIT ${parseInt(options.limit as any, 10)}`;
  if (options.offset) text += ` OFFSET ${parseInt(options.offset as any, 10)}`;

  return { text, values };
};

export const buildUpdate = (table: string, data: Record<string, any>, conditions: Record<string, any>, options: QueryOptions = {}): { text: string; values: any[] } => {
  const dataKeys = Object.keys(data);
  const values = [...Object.values(data)];

  const setClause = dataKeys
    .map((k, i) => `${sanitizeIdentifier(k)} = $${i + 1}`)
    .join(', ');

  // Only users/storage_items/upload_sessions have an updated_at column, and a DB
  // trigger (see migrations.ts) already keeps it current on those — appending it
  // here unconditionally broke UPDATEs against any other table (e.g. refresh_tokens,
  // mobile_upload_links) with "column updated_at does not exist". Opt-in only.
  const shouldAutoTimestamp = options.autoTimestamp === true && !dataKeys.includes('updated_at');
  const autoTs = shouldAutoTimestamp ? ', updated_at = NOW()' : '';

  const { clause, values: allValues } = buildWhere(conditions, values);
  const ret = buildReturning(options.returning);

  return {
    text: `UPDATE ${sanitizeIdentifier(table)} SET ${setClause}${autoTs}${clause} ${ret}`,
    values: allValues,
  };
};

export const buildDelete = (table: string, conditions: Record<string, any>, options: QueryOptions = {}): { text: string; values: any[] } => {
  const { clause, values } = buildWhere(conditions);
  const ret = buildReturning(options.returning);

  return {
    text: `DELETE FROM ${sanitizeIdentifier(table)}${clause} ${ret}`,
    values,
  };
};
