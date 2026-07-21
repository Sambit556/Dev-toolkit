import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  transactionId: string;
  ip?: string;
  userAgent?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getTransactionId(): string | undefined {
  return contextStorage.getStore()?.transactionId;
}

// Populated once per request by requestLogger.ts — lets any service function down
// the call stack (activity-log writes, device-type detection) read the requesting
// client's IP/User-Agent without needing it threaded through every function
// signature between the route handler and wherever it's actually used.
export function getRequestIp(): string | undefined {
  return contextStorage.getStore()?.ip;
}

export function getRequestUserAgent(): string | undefined {
  return contextStorage.getStore()?.userAgent;
}
