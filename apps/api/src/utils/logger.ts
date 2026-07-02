import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${metaStr}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  json(),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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
