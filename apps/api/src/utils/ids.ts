import { v4 as uuidv4 } from 'uuid';

// Single place for ID generation and verification — every resource ID in this
// API (users, storage items, upload sessions, refresh tokens, activity logs)
// is a v4 UUID, generated and validated only through here.
export function generateId(): string {
  return uuidv4();
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | undefined | null): id is string {
  return typeof id === 'string' && UUID_V4_REGEX.test(id);
}
