import winston from 'winston';
import { contextStorage } from './context';

const { combine, timestamp, printf, colorize, json } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

// Custom format to inject transactionId from AsyncLocalStorage context
const addTransactionId = winston.format((info) => {
  const store = contextStorage.getStore();
  if (store?.transactionId) {
    info.transactionId = store.transactionId;
  }
  return info;
});

const devFormat = combine(
  addTransactionId(),
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const transactionStr = meta.transactionId ? ` [TxID: ${meta.transactionId}]` : '';
    const cleanMeta = { ...meta };
    delete cleanMeta.transactionId;
    const metaStr = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : '';
    return `${ts} [${level}]${transactionStr} ${message}${metaStr}`;
  }),
);

const prodFormat = combine(
  addTransactionId(),
  timestamp(),
  json(),
);

const defaultLogLevel = isProd ? 'error' : 'debug';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || defaultLogLevel,
  format: isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
  ],
});

