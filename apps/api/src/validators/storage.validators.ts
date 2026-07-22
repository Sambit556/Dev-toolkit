import { z } from 'zod';

export { isValidUuid } from '../utils/ids';

// Path traversal validation helper
export function isSafeName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  return !name.includes('/') && !name.includes('\\') && name !== '.' && name !== '..';
}

export const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid folder name (no path characters allowed)'),
  parentId: z.string().uuid('Invalid parent ID format').nullable().optional(),
});

export const RenameSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid item name (no path characters allowed)'),
});

export const DeleteItemSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
});

export const CreateNoteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid note name (no path characters allowed)'),
  content: z.string().max(10 * 1024 * 1024, 'Content size too large (max 10MB)'),
  parentId: z.string().uuid('Invalid parent ID format').nullable().optional(),
});

export const UpdateNoteSchema = z.object({
  id: z.string().uuid('Invalid note ID format'),
  content: z.string().max(10 * 1024 * 1024, 'Content size too large (max 10MB)'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid note name (no path characters allowed)').optional(),
  mimeType: z.string().optional(),
});

export const UploadStartSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid file name (no path characters allowed)'),
  mimeType: z.string().max(100, 'mimeType too long').optional(),
  parentId: z.string().uuid('Invalid parent ID format').nullable().optional(),
  size: z.number().int().nonnegative().optional(),
  // Total S3 multipart parts the client intends to upload — used to compute a
  // server-visible progress percentage for uploads another device (desktop) polls for.
  totalParts: z.number().int().positive().max(10000).optional(),
});

export const UploadPartSchema = z.object({
  uploadId: z.string().min(1, 'uploadId is required').max(255),
  s3Key: z.string().min(1, 's3Key is required').max(1024).refine((key) => !key.includes('..'), 'Path traversal disallowed'),
  partNumber: z.union([z.number().int().min(1).max(10000), z.string().regex(/^\d+$/).transform(Number)]),
});

export const UploadCompleteSchema = z.object({
  uploadId: z.string().min(1, 'uploadId is required').max(255),
  s3Key: z.string().min(1, 's3Key is required').max(1024).refine((key) => !key.includes('..'), 'Path traversal disallowed'),
  parts: z.array(z.object({
    ETag: z.string().min(1, 'ETag is required'),
    PartNumber: z.number().int().min(1).max(10000),
  })),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').refine(isSafeName, 'Invalid file name'),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().nonnegative(),
  parentId: z.string().uuid('Invalid parent ID format').nullable().optional(),
});

export const UploadCancelSchema = z.object({
  uploadId: z.string().min(1, 'uploadId is required').max(255),
  s3Key: z.string().min(1, 's3Key is required').max(1024).refine((key) => !key.includes('..'), 'Path traversal disallowed'),
});

export const UploadSessionIdSchema = z.object({
  uploadId: z.string().min(1, 'uploadId is required').max(255),
});

export const MoveItemSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
  newParentId: z.string().uuid('Invalid new parent ID').nullable().optional(),
});

export const TagSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
  tags: z.array(z.string().max(50)).max(20),
});
