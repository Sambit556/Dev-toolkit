import { requireMobileAuth } from '../middleware/mobileAuth';
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { s3Client, isS3Healthy, ensureS3Initialized } from '../utils/s3';
import * as storageService from '../services/storage.service';
import { subscribeUploadQueue } from '../utils/uploadEvents';
import { HttpStatus } from '../utils/httpStatus';
import {
  CreateFolderSchema,
  RenameSchema,
  DeleteItemSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  UploadStartSchema,
  UploadPartSchema,
  UploadCompleteSchema,
  UploadCancelSchema,
  UploadSessionIdSchema,
  MoveItemSchema,
  TagSchema,
  isValidUuid,
} from '../validators/storage.validators';

const router = Router();

// Middleware to ensure S3 is online before running storage APIs
async function requireS3(req: Request, res: Response, next: NextFunction) {
  await ensureS3Initialized();
  if (!isS3Healthy || !s3Client) {
    return next(new AppError(HttpStatus.SERVICE_UNAVAILABLE, 'S3 storage service is offline or misconfigured', 'S3_SERVICE_UNAVAILABLE'));
  }
  next();
}

function getUser(req: Request) {
  return (req as any).user;
}

function requireValidUuid(id: string | undefined, label = 'ID') {
  if (!id || !isValidUuid(id)) {
    throw new AppError(HttpStatus.BAD_REQUEST, `Invalid ${label} format`, 'VALIDATION_ERROR');
  }
}

/**
 * @openapi
 * /api/storage:
 *   get:
 *     summary: List files and folders
 *     description: Always scoped to the caller's own items — every result is filtered by `user_id`, there is no way to list another user's storage.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: trash
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, size, created_at, updated_at, type] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: mimeCategory
 *         schema: { type: string, enum: [images, video, audio, documents, archives, all] }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *     responses:
 *       200: { description: Matching items }
 *       401: { description: Missing or invalid access token }
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUser(req);
    const parentId = req.query.parentId as string;
    if (parentId) requireValidUuid(parentId, 'parent folder ID');

    const items = await storageService.listItems(user.id, {
      parentId,
      isTrash: req.query.trash === 'true',
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'created_at',
      sortOrder: (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC',
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      mimeCategory: req.query.mimeCategory as string,
      tag: req.query.tag as string,
    });

    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/folder:
 *   post:
 *     summary: Create a folder
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200: { description: Folder created }
 *       404: { description: Parent folder not found or not owned by caller }
 *   patch:
 *     summary: Rename a file or folder
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, name]
 *             properties:
 *               id: { type: string, format: uuid }
 *               name: { type: string }
 *     responses:
 *       200: { description: Renamed }
 *       404: { description: Item not found or not owned by caller }
 *   delete:
 *     summary: Move a folder to trash, or permanently delete it if already trashed
 *     description: Recursively trashes/deletes every descendant.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Trashed or permanently deleted }
 *       404: { description: Folder not found or not owned by caller }
 */
router.post('/folder', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = CreateFolderSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid folder parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const folder = await storageService.createFolder(getUser(req).id, parseResult.data.name, parseResult.data.parentId);
    res.json({ success: true, data: folder });
  } catch (err) {
    next(err);
  }
});

router.patch('/folder', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = RenameSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid rename parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const updated = await storageService.renameItem(getUser(req).id, parseResult.data.id, parseResult.data.name);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/folder', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.query.id as string) || (req.body?.id as string);
    const parseResult = DeleteItemSchema.safeParse({ id: rawId });
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid delete parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { permanentlyDeleted } = await storageService.deleteFolder(getUser(req).id, parseResult.data.id);
    res.json({ success: true, message: permanentlyDeleted ? 'Folder permanently deleted' : 'Folder moved to trash' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/text:
 *   post:
 *     summary: Create a text note (stored as a small S3 object)
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, content]
 *             properties:
 *               name: { type: string }
 *               content: { type: string, description: 'Max 10MB' }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200: { description: Note created }
 *       400: { description: Rejected by filename/content security scan }
 *       413: { description: Would exceed storage quota }
 *   put:
 *     summary: Overwrite an existing note's content and/or name
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, content]
 *             properties:
 *               id: { type: string, format: uuid }
 *               content: { type: string }
 *               name: { type: string }
 *     responses:
 *       200: { description: Note updated }
 *       404: { description: Note not found or not owned by caller }
 */
router.post('/text', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = CreateNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid note parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { name, content, parentId } = parseResult.data;
    const note = await storageService.createNote(getUser(req).id, name, content, parentId);
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

router.put('/text', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UpdateNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid update parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { id, content, name, mimeType } = parseResult.data;
    const updated = await storageService.updateNote(getUser(req).id, id, content, name, mimeType);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/text/{id}:
 *   get:
 *     summary: Get a note and its presigned download URL
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Note + downloadUrl }
 *       404: { description: Note not found or not owned by caller }
 *   delete:
 *     summary: Trash a note, or permanently delete it if already trashed
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Trashed or permanently deleted }
 *       404: { description: Note not found or not owned by caller }
 */
router.get('/text/:id', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'note ID');
    const data = await storageService.getNote(getUser(req).id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/text/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'note ID');
    const { permanentlyDeleted } = await storageService.deleteNote(getUser(req).id, req.params.id);
    res.json({ success: true, message: permanentlyDeleted ? 'Note permanently deleted' : 'Note moved to trash' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/start:
 *   post:
 *     summary: Begin a multipart upload (supports files up to 1TB)
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               mimeType: { type: string }
 *               parentId: { type: string, format: uuid, nullable: true }
 *               size: { type: integer, description: Used for an early quota check when known }
 *     responses:
 *       200: { description: "sessionId, uploadId, s3Key" }
 *       400: { description: Rejected by filename/MIME security check }
 *       413: { description: Would exceed storage quota }
 */
router.post('/upload/start', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadStartSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid upload start parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { name, mimeType, parentId, size, totalParts } = parseResult.data;
    const data = await storageService.startUpload(getUser(req).id, name, mimeType, parentId, size, { source: 'desktop', totalParts });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/part:
 *   post:
 *     summary: Get a presigned URL for one multipart chunk
 *     description: The S3 key actually presigned is always the session's own recorded key — a client-supplied key that doesn't match is rejected (403), regardless of whether the caller owns the uploadId.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uploadId, s3Key, partNumber]
 *             properties:
 *               uploadId: { type: string }
 *               s3Key: { type: string }
 *               partNumber: { type: integer, minimum: 1, maximum: 10000 }
 *     responses:
 *       200: { description: Presigned PUT URL for this part }
 *       403: { description: s3Key does not match this upload session }
 *       404: { description: No active upload session for this uploadId }
 */
router.post('/upload/part', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadPartSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid part parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { uploadId, s3Key, partNumber } = parseResult.data;
    const url = await storageService.getUploadPartUrl(getUser(req).id, uploadId, s3Key, partNumber);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/complete:
 *   post:
 *     summary: Finalize a multipart upload
 *     description: Runs a post-upload security scan (magic bytes, embedded scripts, executable signatures) on a byte-range read from S3 before the file is ever listed; a failed scan deletes the object.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uploadId, s3Key, parts, name, size]
 *             properties:
 *               uploadId: { type: string }
 *               s3Key: { type: string }
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties: { ETag: { type: string }, PartNumber: { type: integer } }
 *               name: { type: string }
 *               mimeType: { type: string }
 *               size: { type: integer }
 *               parentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200: { description: Created storage item }
 *       400: { description: Rejected by post-upload security scan }
 *       403: { description: s3Key does not match this upload session }
 *       413: { description: Would exceed storage quota }
 */
router.post('/upload/complete', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadCompleteSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid complete parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const dbItem = await storageService.completeUpload(getUser(req).id, parseResult.data);
    res.json({ success: true, data: dbItem });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/cancel:
 *   post:
 *     summary: Abort an in-progress multipart upload
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uploadId, s3Key]
 *             properties:
 *               uploadId: { type: string }
 *               s3Key: { type: string }
 *     responses:
 *       200: { description: Upload cancelled }
 *       403: { description: s3Key does not match this upload session }
 *       404: { description: No active upload session for this uploadId }
 */
router.post('/upload/cancel', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadCancelSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid cancel parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    await storageService.cancelUpload(getUser(req).id, parseResult.data.uploadId, parseResult.data.s3Key);
    res.json({ success: true, message: 'Upload cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/active:
 *   get:
 *     summary: List the caller's recent upload sessions (any device, any status) for the Upload Queue view
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Array of upload sessions with progress, status, and source ('desktop' | 'mobile')" }
 */
router.get('/upload/active', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await storageService.getUploadQueue(getUser(req).id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/stream:
 *   get:
 *     summary: Server-Sent Events stream of the caller's upload queue — pushes a fresh snapshot whenever an upload session changes
 *     description: Same payload shape as GET /upload/active, delivered as `data:` frames instead of being polled. Replaces the Upload Queue tab's old fixed-interval poll so an idle queue produces no repeated requests.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "text/event-stream of { success: true, data: [...] } frames" }
 */
router.get('/upload/stream', requireAuth, async (req: Request, res: Response) => {
  const userId = getUser(req).id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Nginx-specific: disable proxy buffering so frames aren't held back before delivery.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify({ success: true, data })}\n\n`);
  };

  try {
    send(await storageService.getUploadQueue(userId));
  } catch (err) {
    // Initial snapshot failed to load; the client still gets updates once something changes.
  }

  const unsubscribe = subscribeUploadQueue(userId, send);
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

/**
 * @openapi
 * /api/storage/upload/pause:
 *   post:
 *     summary: Remotely pause an in-progress upload session (e.g. one running on a scanned mobile-link device)
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [uploadId], properties: { uploadId: { type: string } } }
 *     responses:
 *       200: { description: Upload paused }
 *       404: { description: No active upload session for this uploadId }
 */
router.post('/upload/pause', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadSessionIdSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid pause parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    await storageService.pauseUploadSession(getUser(req).id, parseResult.data.uploadId);
    res.json({ success: true, message: 'Upload paused' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/upload/resume:
 *   post:
 *     summary: Resume a remotely paused upload session
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [uploadId], properties: { uploadId: { type: string } } }
 *     responses:
 *       200: { description: Upload resumed }
 *       404: { description: No paused upload session for this uploadId }
 */
router.post('/upload/resume', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadSessionIdSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid resume parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    await storageService.resumeUploadSession(getUser(req).id, parseResult.data.uploadId);
    res.json({ success: true, message: 'Upload resumed' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/download/{id}:
 *   get:
 *     summary: Get a presigned download URL for a file
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: downloadUrl }
 *       404: { description: File not found or not owned by caller }
 */
router.get('/download/:id', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'file ID');
    const downloadUrl = await storageService.getDownloadUrl(getUser(req).id, req.params.id);
    res.json({ success: true, data: { downloadUrl } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/preview/{id}:
 *   get:
 *     summary: In-app preview for a file (image/video/audio/pdf/text/code), or "unsupported" for anything else
 *     description: Never returns a raw-HTML-render or iframe-of-file-content path — media types get a short-lived inline-disposition presigned URL (img/video/audio/canvas-PDF), text/code types return content directly for a read-only code-editor render. Anything outside that explicit allowlist responds 200 with kind:"unsupported" (no preview available is an expected outcome, not an error), and the frontend falls back to the ordinary download endpoint above.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "{ kind: 'media' | 'text' | 'unsupported', ... }" }
 *       404: { description: File not found or not owned by caller }
 */
router.get('/preview/:id', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'file ID');
    const data = await storageService.getFilePreview(getUser(req).id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/file/{id}:
 *   delete:
 *     summary: Trash a file, or permanently delete it (and its S3 object) if already trashed
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Trashed or permanently deleted }
 *       404: { description: File not found or not owned by caller }
 */
router.delete('/file/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'file ID');
    const { permanentlyDeleted } = await storageService.deleteFile(getUser(req).id, req.params.id);
    res.json({ success: true, message: permanentlyDeleted ? 'File permanently deleted' : 'File moved to trash' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/usage:
 *   get:
 *     summary: Get the caller's storage usage broken down by MIME category
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "used, max, percent, files, folders, categories[]" }
 */
router.get('/usage', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await storageService.getUsage(getUser(req).id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/events:
 *   get:
 *     summary: Get the caller's uploads auto-clustered into a Year > Month > Event tree
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "years[] tree + totalEvents" }
 */
router.get('/events', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await storageService.getEventsTree(getUser(req).id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/move:
 *   patch:
 *     summary: Move a file or folder to a new parent
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, format: uuid }
 *               newParentId: { type: string, format: uuid, nullable: true, description: 'null moves it to root' }
 *     responses:
 *       200: { description: Moved }
 *       404: { description: Item or target folder not found / not owned by caller }
 */
router.patch('/move', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = MoveItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid move parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const updated = await storageService.moveItem(getUser(req).id, parseResult.data.id, parseResult.data.newParentId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/share/{id}:
 *   post:
 *     summary: Generate a 10-minute presigned public download link for a file
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: "shareUrl, expiresIn (seconds), fileName" }
 *       404: { description: File not found or not owned by caller }
 */
router.post('/share/:id', requireAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id, 'file ID');
    const data = await storageService.shareFile(getUser(req).id, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/storage/tag:
 *   patch:
 *     summary: Set the tags on a file or folder
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, tags]
 *             properties:
 *               id: { type: string, format: uuid }
 *               tags: { type: array, items: { type: string }, maxItems: 20 }
 *     responses:
 *       200: { description: Updated item }
 *       404: { description: Item not found or not owned by caller }
 */
router.patch('/tag', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = TagSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid tag parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const updated = await storageService.tagItem(getUser(req).id, parseResult.data.id, parseResult.data.tags);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/restore', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.body?.id;
    const parseResult = DeleteItemSchema.safeParse({ id: rawId });
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid restore parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const updated = await storageService.restoreItem(getUser(req).id, parseResult.data.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/mobile-links/create', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folderId } = req.body;
    const data = await storageService.createMobileLink(getUser(req).id, folderId || null);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/mobile-links', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await storageService.getActiveMobileLinks(getUser(req).id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/mobile-links/revoke/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await storageService.revokeMobileLink(getUser(req).id, req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/storage/mobile/connect:
 *   post:
 *     summary: Announce that a device has opened a scanned mobile-upload link
 *     description: Called by the /m/[token] page on load, before any file is picked — requireMobileAuth's verifyMobileToken call already records device/IP/connected_at/last_seen_at as a side effect, so this route just needs to succeed for that to happen.
 *     tags: [Storage]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Connection recorded }
 */
router.post('/mobile/connect', requireMobileAuth, async (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/mobile/upload/start', requireMobileAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadStartSchema.safeParse(req.body);
    if (!parseResult.success) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid upload start parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    const { name, mimeType, size, totalParts } = parseResult.data;
    const folderId = (req as any).mobileSession.folderId;
    const data = await storageService.startUpload(getUser(req).id, name, mimeType, folderId, size, { source: 'mobile', totalParts });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/mobile/upload/part', requireMobileAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadPartSchema.safeParse(req.body);
    if (!parseResult.success) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid part parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    const { uploadId, s3Key, partNumber } = parseResult.data;
    const url = await storageService.getUploadPartUrl(getUser(req).id, uploadId, s3Key, partNumber);
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
});

router.post('/mobile/upload/complete', requireMobileAuth, requireS3, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadCompleteSchema.safeParse(req.body);
    if (!parseResult.success) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid complete parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    const folderId = (req as any).mobileSession.folderId;
    const data = await storageService.completeUpload(getUser(req).id, { ...parseResult.data, parentId: folderId });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Lets the phone pause/resume its own upload (not just react to a desktop-issued
// pause) — same session-status flip the desktop's /upload/pause|resume use, just
// authenticated via the mobile-link bearer token instead of a full user session.
router.post('/mobile/upload/pause', requireMobileAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadSessionIdSchema.safeParse(req.body);
    if (!parseResult.success) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid pause parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    await storageService.pauseUploadSession(getUser(req).id, parseResult.data.uploadId);
    res.json({ success: true, message: 'Upload paused' });
  } catch (err) { next(err); }
});

router.post('/mobile/upload/resume', requireMobileAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UploadSessionIdSchema.safeParse(req.body);
    if (!parseResult.success) throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid resume parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    await storageService.resumeUploadSession(getUser(req).id, parseResult.data.uploadId);
    res.json({ success: true, message: 'Upload resumed' });
  } catch (err) { next(err); }
});


export default router;


