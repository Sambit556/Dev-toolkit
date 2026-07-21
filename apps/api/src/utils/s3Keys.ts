import { AppError } from '../middleware/errorHandler';
import { HttpStatus } from './httpStatus';

// Every object this app ever writes lives under one of these category prefixes,
// each namespaced by owner. There is one shared S3 bucket (see the README for
// why per-user physical buckets aren't practical), but no code path may ever
// touch a key outside the calling user's own namespace — this is the single
// choke point that guarantees that.
export type S3KeyCategory = 'uploads' | 'notes' | 'avatars';

export function buildUserKey(category: S3KeyCategory, userId: string, fileName: string): string {
  return `${category}/${userId}/${fileName}`;
}

export function assertKeyBelongsToUser(key: string, userId: string): void {
  const categories: S3KeyCategory[] = ['uploads', 'notes', 'avatars'];
  const ownsKey = categories.some((c) => key.startsWith(`${c}/${userId}/`));
  if (!ownsKey) {
    throw new AppError(HttpStatus.FORBIDDEN, 'Storage key does not belong to this user', 'FORBIDDEN');
  }
}
