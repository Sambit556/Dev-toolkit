import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AVATAR_MAX_BYTES } from '../config/constants';
import * as profileService from '../services/profile.service';
import { UpdateNameSchema } from '../validators/profile.validators';
import { HttpStatus } from '../utils/httpStatus';

const router = Router();

// Memory storage: the whole point is to validate the image (size, magic bytes,
// security scan — see uploadSecurity.service.assertValidProfileImage) *before*
// anything ever touches S3, which only makes sense for small files kept in RAM.
// `limits.fileSize` is enforced by multer itself, ahead of any application code.
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
});

/**
 * @openapi
 * /api/profile:
 *   get:
 *     summary: Get your own profile, including a presigned avatar URL
 *     description: Isolated by construction — this endpoint only ever reads and presigns the caller's own avatar_s3_key; there is no way to fetch another user's profile or avatar through this API.
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile fields + short-lived avatarUrl (null if no avatar set) }
 *       401: { description: Missing or invalid access token }
 */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await profileService.getProfile((req as any).user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/profile/name:
 *   patch:
 *     summary: Update your own display name
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *     responses:
 *       200: { description: Updated profile }
 *       401: { description: Missing or invalid access token }
 */
router.patch('/name', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UpdateNameSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid name', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const data = await profileService.updateName((req as any).user.id, parseResult.data.name);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/profile/avatar:
 *   post:
 *     summary: Upload a profile picture
 *     description: >
 *       Execution/RCE protection is first priority: the file is validated fully in
 *       memory before it ever reaches S3 — size limit (multer, 5MB default),
 *       declared MIME type must be one of JPEG/PNG/GIF/WEBP (SVG is refused
 *       outright — XML, can carry `<script>`), a magic-byte check confirms the
 *       actual bytes match a real image signature (anti-spoofing — a renamed
 *       executable or mismatched extension is rejected), and the same
 *       executable-signature / embedded-script scan used for regular file
 *       uploads also runs here. The previous avatar object is deleted once the
 *       new one is stored.
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Updated profile with new avatarUrl }
 *       400: { description: "Not a valid image, or failed the security scan" }
 *       413: { description: Exceeds the size limit }
 */
router.post('/avatar', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(HttpStatus.PAYLOAD_TOO_LARGE, `Profile picture exceeds the ${(AVATAR_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB size limit`, 'UPLOAD_REJECTED'));
      }
      return next(new AppError(HttpStatus.BAD_REQUEST, err.message, 'UPLOAD_REJECTED'));
    }
    if (err) return next(err);
    next();
  });
}, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'No file uploaded (expected multipart field "avatar")', 'VALIDATION_ERROR');
    }
    const data = await profileService.uploadAvatar((req as any).user.id, file.buffer, file.mimetype);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/profile/avatar:
 *   delete:
 *     summary: Remove your profile picture
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Profile picture removed }
 *       401: { description: Missing or invalid access token }
 */
router.delete('/avatar', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.deleteAvatar((req as any).user.id);
    res.json({ success: true, message: 'Profile picture removed' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/profile/deactivate:
 *   post:
 *     summary: Deactivate your own account (reversible — only a superadmin can reactivate it)
 *     description: Immediately revokes every refresh token and active session for the caller, in addition to flipping is_active — this logs the account out everywhere, not just future logins. The superadmin account is refused (also enforced by a DB trigger).
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Account deactivated; all sessions revoked }
 *       401: { description: Missing or invalid access token }
 *       403: { description: The superadmin account cannot be deactivated }
 */
router.post('/deactivate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    await profileService.deactivateOwnAccount(user.id, user.role, user.email, user.name);
    res.json({ success: true, message: 'Your account has been deactivated. Contact an administrator to reactivate it.' });
  } catch (err) {
    next(err);
  }
});

export default router;
