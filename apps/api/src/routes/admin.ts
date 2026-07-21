import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ROLES } from '../constants/activityActions';
import * as adminService from '../services/admin.service';
import { isValidUuid } from '../utils/ids';
import { SetActiveSchema, UpdateQuotaSchema, AdminChangePasswordSchema } from '../validators/admin.validators';
import { HttpStatus } from '../utils/httpStatus';

const router = Router();

// Every route in this file is superadmin-only, enforced at the API layer
// (not just hidden in the UI) — requireRole re-checks the caller's *current*
// DB role on every request, so a stale or tampered token can't grant access.
router.use(requireAuth, requireRole(ROLES.SUPERADMIN));

function requireValidUuid(id: string | undefined) {
  if (!id || !isValidUuid(id)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid user ID format', 'VALIDATION_ERROR');
  }
}

/**
 * @openapi
 * /api/backoffice/users:
 *   get:
 *     summary: List every user with aggregated storage usage
 *     description: Superadmin only. One aggregated query for all users (no N+1).
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "users[] with usedBytes, quotaBytes, percentUsed, fileCount, folderCount" }
 *       403: { description: Caller is not a superadmin }
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.listUsersWithUsage();
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/backoffice/users/{id}/active:
 *   patch:
 *     summary: Activate or deactivate a user account
 *     description: Superadmin only. Cannot target the superadmin account itself (blocked at both the API and database-trigger level).
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: "Updated user (safe fields only, no password_hash)" }
 *       403: { description: "Caller is not a superadmin, or target is the superadmin account" }
 *       404: { description: User not found }
 */
router.patch('/users/:id/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id);
    const parseResult = SetActiveSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid request body', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const adminUser = (req as any).user;
    const updated = await adminService.setUserActive(adminUser.id, req.params.id, parseResult.data.isActive);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/backoffice/users/{id}/quota:
 *   patch:
 *     summary: Set a user's storage quota
 *     description: Superadmin only. Cannot target the superadmin account itself.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quotaBytes]
 *             properties:
 *               quotaBytes: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: "Updated user (safe fields only, no password_hash)" }
 *       403: { description: "Caller is not a superadmin, or target is the superadmin account" }
 *       404: { description: User not found }
 */
router.patch('/users/:id/quota', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id);
    const parseResult = UpdateQuotaSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid request body', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const adminUser = (req as any).user;
    const updated = await adminService.updateUserQuota(adminUser.id, req.params.id, parseResult.data.quotaBytes);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/backoffice/users/{id}:
 *   delete:
 *     summary: Delete a user and all of their storage
 *     description: Superadmin only. Deletes the user row (cascades to storage_items/refresh_tokens/activity_logs) and every S3 object under their prefixes via batched DeleteObjects calls. Cannot target the superadmin account or the caller's own account.
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User and all associated storage deleted }
 *       400: { description: Cannot delete your own account }
 *       403: { description: "Caller is not a superadmin, or target is the superadmin account" }
 *       404: { description: User not found }
 */
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id);
    const adminUser = (req as any).user;
    if (req.params.id === adminUser.id) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot delete your own account', 'VALIDATION_ERROR');
    }
    await adminService.deleteUserAndData(adminUser.id, req.params.id);
    res.json({ success: true, message: 'User and all associated storage deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/backoffice/users/{id}/password:
 *   patch:
 *     summary: Superadmin changes a user's password
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireValidUuid(req.params.id);
    const parseResult = AdminChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid request body', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }

    await adminService.adminChangeUserPassword(
      (req as any).user.id,
      req.params.id,
      parseResult.data.newPassword
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;

