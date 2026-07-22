import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/ids';
import { commonDao, transaction } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import { ACTIVITY_ACTIONS } from '../constants/activityActions';
import { logger } from '../utils/logger';
import { assertSafeUpload } from './uploadSecurity.service';
import { buildUserKey, assertKeyBelongsToUser } from '../utils/s3Keys';
import { DEFAULT_STORAGE_QUOTA_BYTES, SHARE_LINK_TTL_SECONDS, EVENT_CLUSTER_GAP_MS, UPLOAD_SECURITY_SCAN_BYTES } from '../config/constants';
import { HttpStatus } from '../utils/httpStatus';
import {
  putObjectDirect,
  getDownloadPresignedUrl,
  getInlinePresignedUrl,
  getShareUrl,
  createMultipartUpload,
  getUploadPartPresignedUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  getObjectPrefixBytes,
  getObjectContent,
  deleteObject,
} from '../utils/s3';
import { PREVIEW_TEXT_MAX_BYTES, PREVIEW_URL_TTL_SECONDS } from '../config/constants';
import { getRequestUserAgent, getRequestIp } from '../utils/context';
import { detectDeviceType, getMobileDeviceLabel } from '../utils/deviceDetect';
import { publishUploadQueue } from '../utils/uploadEvents';

// HTML sanitizer to prevent XSS in stored/rendered names
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

async function assertQuotaAvailable(userId: string, additionalBytes: number): Promise<void> {
  const [user, usageRows] = await Promise.all([
    commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: ['storage_quota_bytes'] }),
    commonDao.rawQuery(
      `SELECT COALESCE(SUM(size), 0) AS total_bytes FROM ${TABLES.STORAGE_ITEMS} WHERE user_id = $1 AND is_deleted = false AND type = 'file'`,
      [userId]
    ),
  ]);
  const quota = Number(user?.storage_quota_bytes) || DEFAULT_STORAGE_QUOTA_BYTES;
  const used = Number(usageRows[0]?.total_bytes) || 0;

  if (used + additionalBytes > quota) {
    throw new AppError(HttpStatus.PAYLOAD_TOO_LARGE, 'This upload would exceed your storage quota', 'QUOTA_EXCEEDED');
  }
}

async function assertParentFolderOwned(userId: string, parentId: string | null | undefined): Promise<void> {
  if (!parentId) return;
  const parent = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id: parentId, is_deleted: false });
  if (!parent || parent.user_id !== userId || parent.type !== 'folder') {
    throw new AppError(HttpStatus.NOT_FOUND, 'Parent folder not found', 'VALIDATION_ERROR');
  }
}

// --- Listing ------------------------------------------------------------------
export interface ListItemsQuery {
  parentId?: string;
  isTrash: boolean;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  dateFrom?: string;
  dateTo?: string;
  mimeCategory?: string;
  tag?: string;
}

const MIME_CATEGORY_PREFIXES: Record<string, string[]> = {
  images: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  archives: ['application/zip', 'application/x-tar', 'application/x-rar', 'application/x-7z', 'application/gzip', 'application/x-bzip2'],
  diagrams: ['application/excalidraw', 'application/drawio', 'application/x-drawio'],
  pdf: ['application/pdf'],
  word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml'],
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml'],
  powerpoint: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml'],
  text: ['text/plain', 'text/csv', 'text/markdown'],
  code: ['text/javascript', 'text/html', 'text/css', 'application/json', 'application/xml', 'text/x-'],
};

const ALLOWED_SORT_FIELDS = new Set(['name', 'size', 'created_at', 'updated_at', 'type']);

export async function listItems(userId: string, query: ListItemsQuery) {
  const sortField = ALLOWED_SORT_FIELDS.has(query.sortBy) ? query.sortBy : 'created_at';

  const conditions: Record<string, any> = { user_id: userId };
  if (query.isTrash) {
    conditions.is_deleted = true;
  } else {
    conditions.is_deleted = false;
    if (query.parentId) conditions.parent_id = query.parentId;
    else if (!query.search) conditions.parent_id = null;
  }
  if (query.search && !query.isTrash) {
    conditions.name = { $ilike: `%${query.search}%` };
  }

  const extraClauses: string[] = [];
  const extraParams: any[] = [];
  let paramIdx = 3; // $1=user_id, $2=is_deleted

  if (query.dateFrom) {
    extraClauses.push(`created_at >= $${paramIdx++}`);
    extraParams.push(query.dateFrom);
  }
  if (query.dateTo) {
    extraClauses.push(`created_at <= $${paramIdx++}`);
    extraParams.push(query.dateTo);
  }
  if (query.mimeCategory && query.mimeCategory !== 'all') {
    const categories = query.mimeCategory.split(',');
    const allPrefixes: string[] = [];
    for (const cat of categories) {
      const prefixes = MIME_CATEGORY_PREFIXES[cat.trim()];
      if (prefixes) allPrefixes.push(...prefixes);
    }
    if (allPrefixes.length > 0) {
      const mimeClauses = allPrefixes.map(() => `mime_type ILIKE $${paramIdx++}`);
      extraClauses.push(`(${mimeClauses.join(' OR ')})`);
      extraParams.push(...allPrefixes.map((p) => `${p}%`));
    }
  }
  if (query.tag) {
    extraClauses.push(`$${paramIdx++} = ANY(tags)`);
    extraParams.push(query.tag);
  }

  if (extraClauses.length === 0) {
    return commonDao.getAllDataByCond(TABLES.STORAGE_ITEMS, conditions, {
      orderBy: [
        { col: 'type', dir: 'DESC' },
        { col: sortField, dir: query.sortOrder },
      ],
    });
  }

  const baseConditions = [`user_id = $1`, `is_deleted = $2`];
  if (query.parentId && !query.search && !query.isTrash) {
    baseConditions.push(`parent_id = $${paramIdx++}`);
    extraParams.push(query.parentId);
  } else if (!query.parentId && !query.search && !query.isTrash) {
    baseConditions.push(`parent_id IS NULL`);
  }
  if (query.search && !query.isTrash) {
    baseConditions.push(`name ILIKE $${paramIdx++}`);
    extraParams.push(`%${query.search}%`);
  }

  const whereClause = [...baseConditions, ...extraClauses].join(' AND ');
  const rawSql = `SELECT * FROM ${TABLES.STORAGE_ITEMS} WHERE ${whereClause} ORDER BY type DESC, ${sortField} ${query.sortOrder}`;
  return commonDao.rawQuery(rawSql, [userId, query.isTrash, ...extraParams]);
}

// --- Folders --------------------------------------------------------------
export async function createFolder(userId: string, name: string, parentId?: string | null) {
  const nameSanitized = escapeHtml(name);
  await assertParentFolderOwned(userId, parentId);

  const folder = await commonDao.addData<any>(TABLES.STORAGE_ITEMS, {
    user_id: userId,
    parent_id: parentId || null,
    type: 'folder',
    name: nameSanitized,
    mime_type: 'application/x-directory',
    is_deleted: false,
  });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.CREATE_FOLDER, resource: folder.id });
  return folder;
}

export async function renameItem(userId: string, id: string, name: string) {
  const nameSanitized = escapeHtml(name);
  const item = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id });
  if (!item || item.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Item not found', 'VALIDATION_ERROR');
  }

  const updated = await commonDao.updateData<any>(TABLES.STORAGE_ITEMS, { name: nameSanitized }, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.RENAME, resource: id });
  return updated;
}

export async function deleteFolder(userId: string, id: string) {
  const folder = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id });
  if (!folder || folder.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Folder not found', 'VALIDATION_ERROR');
  }

  if (folder.is_deleted) {
    await transaction(async (trx) => {
      await trx.deleteDataByCond(TABLES.STORAGE_ITEMS, { id });
    });
    logger.info('Folder permanently deleted', { folderId: id });
  } else {
    await transaction(async (trx) => {
      await trx.updateData(TABLES.STORAGE_ITEMS, { is_deleted: true }, { id });
      await trx.rawQuery(
        `WITH RECURSIVE descendants AS (
          SELECT id FROM ${TABLES.STORAGE_ITEMS} WHERE parent_id = $1
          UNION ALL
          SELECT s.id FROM ${TABLES.STORAGE_ITEMS} s
          INNER JOIN descendants d ON s.parent_id = d.id
        )
        UPDATE ${TABLES.STORAGE_ITEMS} SET is_deleted = true WHERE id IN (SELECT id FROM descendants)`,
        [id]
      );
    });
    logger.info('Folder moved to trash', { folderId: id });
  }

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: userId,
    action: folder.is_deleted ? ACTIVITY_ACTIONS.PERMANENT_DELETE_FOLDER : ACTIVITY_ACTIONS.TRASH_FOLDER,
    resource: id,
  });

  return { permanentlyDeleted: !!folder.is_deleted };
}

// --- Notes ------------------------------------------------------------------
export async function createNote(userId: string, name: string, content: string, parentId?: string | null) {
  const nameSanitized = escapeHtml(name);
  await assertParentFolderOwned(userId, parentId);

  const noteContent = content || '';
  assertSafeUpload({ fileName: nameSanitized, mimeType: 'text/plain', contentPrefix: Buffer.from(noteContent.slice(0, 4096), 'utf8') });
  await assertQuotaAvailable(userId, Buffer.byteLength(noteContent));

  const noteId = generateId();
  const s3Key = buildUserKey('notes', userId, `${noteId}.txt`);
  await putObjectDirect(s3Key, noteContent, 'text/plain');

  const note = await commonDao.addData<any>(TABLES.STORAGE_ITEMS, {
    user_id: userId,
    parent_id: parentId || null,
    type: 'file',
    name: nameSanitized,
    mime_type: 'text/plain',
    size: Buffer.byteLength(noteContent),
    s3_key: s3Key,
    is_deleted: false,
  });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.CREATE_NOTE, resource: note.id });
  return note;
}

export async function updateNote(userId: string, id: string, content: string, name?: string, mimeType?: string) {
  const note = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!note || note.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Note not found', 'VALIDATION_ERROR');
  }
  if (!note.s3_key) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Missing S3 key for this file resource', 'VALIDATION_ERROR');
  }

  const noteContent = content || '';
  const finalMimeType = mimeType || note.mime_type || 'text/plain';
  assertSafeUpload({ fileName: note.name, mimeType: finalMimeType, contentPrefix: Buffer.from(noteContent.slice(0, 4096), 'utf8') });

  await putObjectDirect(note.s3_key, noteContent, finalMimeType);

  const nameSanitized = name ? escapeHtml(name) : undefined;
  const updateData: Record<string, any> = { size: Buffer.byteLength(noteContent) };
  if (nameSanitized) updateData.name = nameSanitized;

  const updated = await commonDao.updateData<any>(TABLES.STORAGE_ITEMS, updateData, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.UPDATE_NOTE, resource: id });
  return updated;
}

export async function getNote(userId: string, id: string) {
  const note = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!note || note.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Note not found', 'VALIDATION_ERROR');
  }
  if (!note.s3_key) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Missing S3 key for note', 'VALIDATION_ERROR');
  }
  const content = await getObjectContent(note.s3_key);
  return { item: note, content };
}

export async function deleteNote(userId: string, id: string) {
  const note = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id });
  if (!note || note.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Note not found', 'VALIDATION_ERROR');
  }

  if (note.is_deleted) {
    await commonDao.deleteDataByCond(TABLES.STORAGE_ITEMS, { id });
    logger.info('Note permanently deleted', { noteId: id });
  } else {
    await commonDao.updateData(TABLES.STORAGE_ITEMS, { is_deleted: true }, { id });
    logger.info('Note soft-deleted to trash', { noteId: id });
  }

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: userId,
    action: note.is_deleted ? ACTIVITY_ACTIONS.PERMANENT_DELETE_NOTE : ACTIVITY_ACTIONS.TRASH_NOTE,
    resource: id,
  });

  return { permanentlyDeleted: !!note.is_deleted };
}

// --- Multipart file upload ----------------------------------------------------
// Pushes a fresh upload queue snapshot to any open SSE stream (see
// GET /upload/stream) for this user — called after every upload_sessions mutation
// below so the Upload Queue view updates in real time instead of polling.
async function notifyUploadQueueChanged(userId: string): Promise<void> {
  try {
    const data = await getUploadQueue(userId);
    publishUploadQueue(userId, data);
  } catch (err: any) {
    logger.error('Failed to broadcast upload queue update', { userId, error: err.message });
  }
}

export async function startUpload(
  userId: string,
  name: string,
  mimeType: string | undefined,
  parentId: string | null | undefined,
  size?: number,
  opts?: { source?: 'desktop' | 'mobile'; totalParts?: number }
) {
  const nameSanitized = escapeHtml(name);
  assertSafeUpload({ fileName: nameSanitized, mimeType });
  await assertParentFolderOwned(userId, parentId);
  if (typeof size === 'number') {
    await assertQuotaAvailable(userId, size);
  }

  const fileId = generateId();
  const cleanMime = mimeType || 'application/octet-stream';
  const s3Key = buildUserKey('uploads', userId, `${fileId}-${nameSanitized}`);

  const uploadId = await createMultipartUpload(s3Key, cleanMime);

  const session = await commonDao.addData<any>(TABLES.UPLOAD_SESSIONS, {
    user_id: userId,
    upload_id: uploadId,
    s3_key: s3Key,
    status: 'uploading',
    parts_uploaded: '[]',
    source: opts?.source || 'desktop',
    file_name: nameSanitized,
    file_size: typeof size === 'number' ? size : null,
    total_parts: opts?.totalParts ?? null,
  });

  logger.info('Multipart upload started', { uploadId, s3Key, userId, source: opts?.source || 'desktop' });
  void notifyUploadQueueChanged(userId);
  return { sessionId: session.id, uploadId, s3Key };
}

export async function getUploadPartUrl(userId: string, uploadId: string, requestedS3Key: string, partNumber: number) {
  const session = await commonDao.getOneDataByCond<any>(TABLES.UPLOAD_SESSIONS, {
    upload_id: uploadId,
    user_id: userId,
    status: { $in: ['uploading', 'paused'] },
  });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Active upload session not found', 'VALIDATION_ERROR');
  }
  // Another device (the desktop Upload Queue) can pause a session it doesn't own the
  // in-flight fetch for — the uploading client must poll-retry rather than treat this
  // as fatal, since the file bytes only ever live in that client's memory.
  if (session.status === 'paused') {
    throw new AppError(HttpStatus.CONFLICT, 'Upload is paused', 'UPLOAD_PAUSED');
  }
  // Broken Access Control guard: the S3 key actually used is always the one this
  // session was created with — a client-supplied key is never trusted, even if it
  // superficially "belongs" to an uploadId/session the caller does legitimately own.
  if (requestedS3Key !== session.s3_key) {
    logger.warn('Rejected upload/part request with mismatched s3Key', { userId, uploadId, requestedS3Key, sessionS3Key: session.s3_key });
    throw new AppError(HttpStatus.FORBIDDEN, 'S3 key does not match this upload session', 'FORBIDDEN');
  }
  assertKeyBelongsToUser(session.s3_key, userId);

  await commonDao.rawQuery(
    `UPDATE ${TABLES.UPLOAD_SESSIONS} SET parts_requested = GREATEST(parts_requested, $1) WHERE upload_id = $2 AND user_id = $3`,
    [partNumber, uploadId, userId]
  );
  void notifyUploadQueueChanged(userId);

  return getUploadPartPresignedUrl(session.s3_key, uploadId, partNumber);
}

// --- Remote (cross-device) upload control ---------------------------------------
// Lets the desktop Upload Queue pause/resume/observe an upload that's actually being
// driven by another device's browser (a scanned mobile-link session) — the uploading
// client polls upload/part, which reflects the state change on its very next request.
export async function pauseUploadSession(userId: string, uploadId: string) {
  const session = await commonDao.getOneDataByCond<any>(TABLES.UPLOAD_SESSIONS, { upload_id: uploadId, user_id: userId, status: 'uploading' });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Active upload session not found', 'VALIDATION_ERROR');
  }
  await commonDao.updateData(TABLES.UPLOAD_SESSIONS, { status: 'paused' }, { upload_id: uploadId });
  void notifyUploadQueueChanged(userId);
}

export async function resumeUploadSession(userId: string, uploadId: string) {
  const session = await commonDao.getOneDataByCond<any>(TABLES.UPLOAD_SESSIONS, { upload_id: uploadId, user_id: userId, status: 'paused' });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Paused upload session not found', 'VALIDATION_ERROR');
  }
  await commonDao.updateData(TABLES.UPLOAD_SESSIONS, { status: 'uploading' }, { upload_id: uploadId });
  void notifyUploadQueueChanged(userId);
}

export async function getUploadQueue(userId: string) {
  const rows = await commonDao.getAllDataByCond<any>(
    TABLES.UPLOAD_SESSIONS,
    { user_id: userId },
    { orderBy: 'updated_at', orderDir: 'DESC', limit: 50 }
  );
  return rows.map((r) => ({
    uploadId: r.upload_id,
    s3Key: r.s3_key,
    name: r.file_name,
    size: r.file_size !== null && r.file_size !== undefined ? Number(r.file_size) : null,
    totalParts: r.total_parts,
    partsRequested: r.parts_requested,
    status: r.status,
    source: r.source,
    updatedAt: r.updated_at,
  }));
}

export async function completeUpload(
  userId: string,
  params: { uploadId: string; s3Key: string; parts: { ETag: string; PartNumber: number }[]; name: string; mimeType?: string; size: number; parentId?: string | null }
) {
  const nameSanitized = escapeHtml(params.name);
  assertSafeUpload({ fileName: nameSanitized, mimeType: params.mimeType });
  await assertParentFolderOwned(userId, params.parentId);
  await assertQuotaAvailable(userId, params.size);

  const session = await commonDao.getOneDataByCond<any>(TABLES.UPLOAD_SESSIONS, { upload_id: params.uploadId, user_id: userId, status: 'uploading' });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Active upload session not found', 'VALIDATION_ERROR');
  }
  // Broken Access Control guard — see getUploadPartUrl: never trust a client-supplied key.
  if (params.s3Key !== session.s3_key) {
    logger.warn('Rejected upload/complete request with mismatched s3Key', { userId, uploadId: params.uploadId, requestedS3Key: params.s3Key, sessionS3Key: session.s3_key });
    throw new AppError(HttpStatus.FORBIDDEN, 'S3 key does not match this upload session', 'FORBIDDEN');
  }
  assertKeyBelongsToUser(session.s3_key, userId);
  const s3Key = session.s3_key;

  const formattedParts = params.parts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber }));
  await completeMultipartUpload(s3Key, params.uploadId, formattedParts);

  // Content is now in S3 — run the post-upload security scan on a byte prefix
  // before it's ever recorded as a real, listable storage item. On rejection,
  // delete the object immediately so nothing malicious lingers in the bucket.
  try {
    const prefix = await getObjectPrefixBytes(s3Key, UPLOAD_SECURITY_SCAN_BYTES);
    assertSafeUpload({ fileName: nameSanitized, mimeType: params.mimeType, contentPrefix: prefix });
  } catch (err) {
    await deleteObject(s3Key).catch((delErr: any) =>
      logger.error('Failed to delete S3 object rejected by security scan', { key: s3Key, error: delErr.message })
    );
    await commonDao.updateData(TABLES.UPLOAD_SESSIONS, { status: 'rejected' }, { upload_id: params.uploadId });
    await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.UPLOAD_REJECTED_SECURITY_SCAN, resource: s3Key });
    void notifyUploadQueueChanged(userId);
    throw err;
  }

  let dbItem: any = null;
  await transaction(async (trx) => {
    await trx.updateData(TABLES.UPLOAD_SESSIONS, { status: 'completed', parts_uploaded: JSON.stringify(formattedParts) }, { upload_id: params.uploadId });

    dbItem = await trx.addData(TABLES.STORAGE_ITEMS, {
      user_id: userId,
      parent_id: params.parentId || null,
      type: 'file',
      name: nameSanitized,
      mime_type: params.mimeType || 'application/octet-stream',
      size: params.size || 0,
      s3_key: s3Key,
      is_deleted: false,
      // Detected from this request's User-Agent (via the async request context —
      // see utils/context.ts), not client-supplied, so it can't be spoofed by
      // whatever the upload request body happens to claim.
      device_type: detectDeviceType(getRequestUserAgent()),
    });

    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.COMPLETE_UPLOAD, resource: dbItem.id });
  });

  logger.info('Multipart upload completed successfully', { uploadId: params.uploadId, fileId: dbItem.id });
  void notifyUploadQueueChanged(userId);
  return dbItem;
}

export async function cancelUpload(userId: string, uploadId: string, requestedS3Key: string) {
  const session = await commonDao.getOneDataByCond<any>(TABLES.UPLOAD_SESSIONS, { upload_id: uploadId, user_id: userId, status: 'uploading' });
  if (!session) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Active upload session not found', 'VALIDATION_ERROR');
  }
  if (requestedS3Key !== session.s3_key) {
    logger.warn('Rejected upload/cancel request with mismatched s3Key', { userId, uploadId, requestedS3Key, sessionS3Key: session.s3_key });
    throw new AppError(HttpStatus.FORBIDDEN, 'S3 key does not match this upload session', 'FORBIDDEN');
  }

  assertKeyBelongsToUser(session.s3_key, userId);
  await abortMultipartUpload(session.s3_key, uploadId);
  await commonDao.updateData(TABLES.UPLOAD_SESSIONS, { status: 'cancelled' }, { upload_id: uploadId });
  void notifyUploadQueueChanged(userId);
  logger.info('Multipart upload aborted and cancelled', { uploadId });
}

// --- Files --------------------------------------------------------------------
export async function getDownloadUrl(userId: string, id: string) {
  const file = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!file || file.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'File not found', 'VALIDATION_ERROR');
  }
  if (file.type !== 'file' || !file.s3_key) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid storage item type', 'VALIDATION_ERROR');
  }

  const downloadUrl = await getDownloadPresignedUrl(file.s3_key, 900, file.name);
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.DOWNLOAD_FILE, resource: id });
  return downloadUrl;
}

// A deliberately narrow, separate allowlist from MIME_CATEGORY_PREFIXES above (which
// is a broad UI-filter grouping) — this one gates what's actually allowed to be
// rendered inline in the browser. Notably excludes image/svg+xml even though it's
// already blocked at upload (uploadSecurity.service.ts) — defense in depth in case a
// legacy row or a future upload-path change ever lets one through. HTML/code content
// is intentionally previewable — but only ever as inert tokenized text (the frontend
// renders it through a read-only code editor, never dangerouslySetInnerHTML/an
// iframe of the raw bytes), which is what actually makes an uploaded <script>-bearing
// .html file harmless, not the upload-time scanner.
const INLINE_MEDIA_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/x-icon', 'video/', 'audio/'];
const INLINE_PDF_MIME = 'application/pdf';
const INLINE_TEXT_MIME_PREFIXES = ['text/', 'application/json', 'application/xml'];

type FilePreviewResult =
  | { kind: 'media'; previewUrl: string; mimeType: string; name: string; size: number }
  | { kind: 'text'; content: string; mimeType: string; name: string; size: number }
  | { kind: 'unsupported'; mimeType: string; name: string; size: number; reason?: string };

export async function getFilePreview(userId: string, id: string): Promise<FilePreviewResult> {
  const file = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!file || file.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'File not found', 'VALIDATION_ERROR');
  }
  if (file.type !== 'file' || !file.s3_key) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid storage item type', 'VALIDATION_ERROR');
  }

  const mimeType: string = file.mime_type || 'application/octet-stream';
  const size = Number(file.size) || 0;

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.PREVIEW_FILE, resource: id });

  if (mimeType !== 'image/svg+xml' && (INLINE_MEDIA_MIME_PREFIXES.some((p) => mimeType.startsWith(p)) || mimeType === INLINE_PDF_MIME)) {
    const previewUrl = await getInlinePresignedUrl(file.s3_key, PREVIEW_URL_TTL_SECONDS, mimeType);
    return { kind: 'media', previewUrl, mimeType, name: file.name, size };
  }

  if (INLINE_TEXT_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) {
    if (size > PREVIEW_TEXT_MAX_BYTES) {
      return { kind: 'unsupported', mimeType, name: file.name, size, reason: 'FILE_TOO_LARGE_FOR_PREVIEW' };
    }
    const content = await getObjectContent(file.s3_key);
    return { kind: 'text', content, mimeType, name: file.name, size };
  }

  return { kind: 'unsupported', mimeType, name: file.name, size };
}

export async function deleteFile(userId: string, id: string) {
  const file = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id });
  if (!file || file.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'File not found', 'VALIDATION_ERROR');
  }

  if (file.is_deleted) {
    await transaction(async (trx) => {
      await trx.deleteDataByCond(TABLES.STORAGE_ITEMS, { id });
      if (file.s3_key) {
        await deleteObject(file.s3_key).catch((err: any) =>
          logger.error('Failed to delete S3 file object during permanent deletion', { key: file.s3_key, error: err.message })
        );
      }
    });
    logger.info('File permanently deleted', { fileId: id });
  } else {
    await commonDao.updateData(TABLES.STORAGE_ITEMS, { is_deleted: true }, { id });
    logger.info('File moved to trash', { fileId: id });
  }

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: userId,
    action: file.is_deleted ? ACTIVITY_ACTIONS.PERMANENT_DELETE_FILE : ACTIVITY_ACTIONS.TRASH_FILE,
    resource: id,
  });

  return { permanentlyDeleted: !!file.is_deleted };
}

// --- Usage / Events -------------------------------------------------------------
export async function getUsage(userId: string) {
  const [usageRows, userRow] = await Promise.all([
    commonDao.rawQuery(
      `SELECT
        COALESCE(SUM(size), 0) AS total_bytes,
        COUNT(*) FILTER (WHERE type = 'file') AS total_files,
        COUNT(*) FILTER (WHERE type = 'folder') AS total_folders,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'image/%'), 0) AS image_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'video/%'), 0) AS video_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'audio/%'), 0) AS audio_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/zip' OR mime_type ILIKE 'application/x-tar' OR mime_type ILIKE 'application/x-rar' OR mime_type ILIKE 'application/x-7z' OR mime_type ILIKE 'application/gzip' OR mime_type ILIKE 'application/x-bzip2'), 0) AS archive_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/excalidraw%' OR mime_type ILIKE 'application/drawio%'), 0) AS diagram_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/pdf'), 0) AS pdf_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/msword' OR mime_type ILIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml%'), 0) AS word_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/vnd.ms-excel' OR mime_type ILIKE 'application/vnd.openxmlformats-officedocument.spreadsheetml%'), 0) AS excel_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'application/vnd.ms-powerpoint' OR mime_type ILIKE 'application/vnd.openxmlformats-officedocument.presentationml%'), 0) AS powerpoint_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'text/plain' OR mime_type ILIKE 'text/csv' OR mime_type ILIKE 'text/markdown'), 0) AS text_bytes,
        COALESCE(SUM(size) FILTER (WHERE mime_type ILIKE 'text/javascript' OR mime_type ILIKE 'text/html' OR mime_type ILIKE 'text/css' OR mime_type ILIKE 'application/json' OR mime_type ILIKE 'application/xml' OR mime_type ILIKE 'text/x-%'), 0) AS code_bytes
      FROM ${TABLES.STORAGE_ITEMS}
      WHERE user_id = $1 AND is_deleted = false AND type = 'file'`,
      [userId]
    ),
    commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: ['storage_quota_bytes'] }),
  ]);

  const maxBytes = Number(userRow?.storage_quota_bytes) || DEFAULT_STORAGE_QUOTA_BYTES;

  const row = usageRows[0];
  const totalBytes = Number(row.total_bytes);
  const categorized = Number(row.image_bytes) + Number(row.video_bytes) + Number(row.audio_bytes) + Number(row.archive_bytes) + Number(row.diagram_bytes) + Number(row.pdf_bytes) + Number(row.word_bytes) + Number(row.excel_bytes) + Number(row.powerpoint_bytes) + Number(row.text_bytes) + Number(row.code_bytes);
  const otherBytes = Math.max(0, totalBytes - categorized);

  return {
    used: totalBytes,
    max: maxBytes,
    percent: Math.min(100, (totalBytes / maxBytes) * 100).toFixed(2),
    files: Number(row.total_files),
    folders: Number(row.total_folders),
    categories: [
      { key: 'images', label: 'Images', bytes: Number(row.image_bytes), color: '#8b5cf6' },
      { key: 'video', label: 'Video', bytes: Number(row.video_bytes), color: '#3b82f6' },
      { key: 'audio', label: 'Audio', bytes: Number(row.audio_bytes), color: '#f59e0b' },
      { key: 'archives', label: 'Archives', bytes: Number(row.archive_bytes), color: '#ef4444' },
      { key: 'diagrams', label: 'Diagrams', bytes: Number(row.diagram_bytes), color: '#ec4899' },
      { key: 'pdf', label: 'PDF', bytes: Number(row.pdf_bytes), color: '#dc2626' },
      { key: 'word', label: 'Word', bytes: Number(row.word_bytes), color: '#2563eb' },
      { key: 'excel', label: 'Excel', bytes: Number(row.excel_bytes), color: '#16a34a' },
      { key: 'powerpoint', label: 'Slides', bytes: Number(row.powerpoint_bytes), color: '#ea580c' },
      { key: 'text', label: 'Text', bytes: Number(row.text_bytes), color: '#52525b' },
      { key: 'code', label: 'Code', bytes: Number(row.code_bytes), color: '#14b8a6' },
      { key: 'other', label: 'Other', bytes: otherBytes, color: '#64748b' },
    ],
  };
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export async function getEventsTree(userId: string) {
  // Capped well above any realistic per-user upload history — a hard ceiling so a
  // single vault can't force an unbounded scan + synchronous JS clustering pass.
  const rows: any[] = await commonDao.rawQuery(
    `SELECT id, name, mime_type, size, created_at FROM ${TABLES.STORAGE_ITEMS}
     WHERE user_id = $1 AND is_deleted = false AND type = 'file'
     ORDER BY created_at ASC
     LIMIT 20000`,
    [userId]
  );

  const events: { start: string; end: string; count: number; totalBytes: number; sampleName: string }[] = [];
  let current: { start: Date; end: Date; count: number; totalBytes: number; sampleName: string } | null = null;

  for (const row of rows) {
    const createdAt = new Date(row.created_at);
    if (current && createdAt.getTime() - current.end.getTime() <= EVENT_CLUSTER_GAP_MS) {
      current.end = createdAt;
      current.count += 1;
      current.totalBytes += Number(row.size) || 0;
    } else {
      if (current) events.push({ ...current, start: current.start.toISOString(), end: current.end.toISOString() } as any);
      current = { start: createdAt, end: createdAt, count: 1, totalBytes: Number(row.size) || 0, sampleName: row.name };
    }
  }
  if (current) events.push({ ...current, start: current.start.toISOString(), end: current.end.toISOString() } as any);

  const tree: Record<string, Record<string, typeof events>> = {};
  for (const ev of events) {
    const d = new Date(ev.start);
    const year = String(d.getFullYear());
    const month = MONTH_NAMES[d.getMonth()];
    tree[year] = tree[year] || {};
    tree[year][month] = tree[year][month] || [];
    tree[year][month].push(ev);
  }

  const years = Object.keys(tree)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      year,
      months: Object.keys(tree[year])
        .sort((a, b) => MONTH_NAMES.indexOf(b) - MONTH_NAMES.indexOf(a))
        .map((month) => ({
          month,
          events: tree[year][month].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()),
        })),
    }));

  return { years, totalEvents: events.length };
}

// --- Move / Share / Tag --------------------------------------------------------
export async function moveItem(userId: string, id: string, newParentId: string | null | undefined) {
  const item = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!item || item.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Item not found', 'VALIDATION_ERROR');
  }

  if (newParentId) {
    const newParent = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id: newParentId, is_deleted: false });
    if (!newParent || newParent.user_id !== userId || newParent.type !== 'folder') {
      throw new AppError(HttpStatus.NOT_FOUND, 'Target folder not found', 'VALIDATION_ERROR');
    }
    if (newParentId === id) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot move an item into itself', 'VALIDATION_ERROR');
    }
  }

  const updated = await commonDao.updateData<any>(TABLES.STORAGE_ITEMS, { parent_id: newParentId ?? null }, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.MOVE_ITEM, resource: id });
  return updated;
}

export async function shareFile(userId: string, id: string) {
  const file = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!file || file.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'File not found', 'VALIDATION_ERROR');
  }
  if (file.type !== 'file' || !file.s3_key) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Cannot share a folder or item without S3 key', 'VALIDATION_ERROR');
  }

  const shareUrl = await getShareUrl(file.s3_key, file.name, SHARE_LINK_TTL_SECONDS);

  await commonDao.updateData(TABLES.STORAGE_ITEMS, { shared_at: new Date().toISOString() }, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.SHARE_FILE, resource: id });

  return { shareUrl, expiresIn: SHARE_LINK_TTL_SECONDS, fileName: file.name };
}

export async function tagItem(userId: string, id: string, tags: string[]) {
  const item = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id, is_deleted: false });
  if (!item || item.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Item not found', 'VALIDATION_ERROR');
  }

  const sanitizedTags = tags.map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''));
  const updated = await commonDao.updateData<any>(TABLES.STORAGE_ITEMS, { tags: sanitizedTags }, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.TAG_ITEM, resource: id });
  return updated;
}

export async function restoreItem(userId: string, id: string) {
  const item = await commonDao.getOneDataByCond<any>(TABLES.STORAGE_ITEMS, { id });
  if (!item || item.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Item not found', 'VALIDATION_ERROR');
  }

  const updated = await commonDao.updateData<any>(TABLES.STORAGE_ITEMS, { is_deleted: false }, { id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.RESTORE_ITEM, resource: id });
  return updated;
}

export async function createMobileLink(userId: string, folderId: string | null) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 120 * 60 * 1000);
  
  const link = await commonDao.addData<any>(TABLES.MOBILE_UPLOAD_LINKS, {
    user_id: userId,
    folder_id: folderId || null,
    token,
    expires_at: expiresAt,
    is_revoked: false
  });
  
  return { token, expiresAt: link.expires_at };
}

export async function getActiveMobileLinks(userId: string) {
  const query = `
    SELECT * FROM ${TABLES.MOBILE_UPLOAD_LINKS}
    WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
    ORDER BY created_at DESC
  `;
  return await commonDao.rawQuery(query, [userId]);
}

export async function revokeMobileLink(userId: string, linkId: string) {
  const link = await commonDao.getOneDataByCond<any>(TABLES.MOBILE_UPLOAD_LINKS, { id: linkId });
  if (!link || link.user_id !== userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Link not found', 'VALIDATION_ERROR');
  }
  
  await commonDao.updateData(TABLES.MOBILE_UPLOAD_LINKS, { is_revoked: true }, { id: linkId });
  return { success: true };
}

export async function verifyMobileToken(token: string) {
  const link = await commonDao.getOneDataByCond<any>(TABLES.MOBILE_UPLOAD_LINKS, { token });
  if (!link) throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid or expired authentication', 'INVALID_TOKEN');
  if (link.is_revoked) throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid or expired authentication', 'TOKEN_REVOKED');
  if (new Date(link.expires_at).getTime() < Date.now()) throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid or expired authentication', 'TOKEN_EXPIRED');

  // Records the IP/device of whatever device actually scans/uses the link (the
  // phone), not the desktop that generated it — fire-and-forget so a slow/failed
  // write never holds up the actual upload this token is authenticating.
  // `connected_at` is set only the first time (the desktop's "device connected"
  // notification fires off this transition); `last_seen_at` refreshes on every
  // request so the Active Scans list can show a live "last seen" time.
  const ip = getRequestIp();
  const { label, type } = getMobileDeviceLabel(getRequestUserAgent());
  commonDao.rawQuery(
    `UPDATE ${TABLES.MOBILE_UPLOAD_LINKS}
     SET ip_address = COALESCE($1, ip_address),
         device_label = $2,
         device_type = $3,
         connected_at = COALESCE(connected_at, NOW()),
         last_seen_at = NOW()
     WHERE token = $4`,
    [ip || null, label, type, token]
  ).catch((err: any) => logger.error('Failed to record mobile upload link device info', { error: err.message }));

  return { userId: link.user_id, folderId: link.folder_id };
}


