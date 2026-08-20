import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { ROLES } from '../constants/activityActions';
import { AppError } from '../middleware/errorHandler';
import * as emailService from '../services/email.service';
import { SendEmailSchema, SendBatchEmailSchema, UpdateScheduledEmailSchema } from '../validators/email.validators';
import { HttpStatus } from '../utils/httpStatus';
import { deliverInboundToTempMail } from './tempmail';

const router = Router();

// All email dispatch operations require authentication
router.use(requireAuth);

/**
 * @openapi
 * /api/emails:
 *   get:
 *     summary: List recent transactional emails via Resend (Superadmin only)
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bypassCache = req.query.fresh === 'true';
    const emailList = await emailService.listEmails(bypassCache);
    res.json({ success: true, data: emailList });
  } catch (err: any) {
    next(new AppError(HttpStatus.BAD_REQUEST, err.message || 'Failed to list emails from Resend', 'RESEND_ERROR'));
  }
});

/**
 * @openapi
 * /api/emails/{id}:
 *   get:
 *     summary: Get details of a single email from Resend (Superadmin only)
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = await emailService.getEmailById(req.params.id);
    res.json({ success: true, data: email });
  } catch (err: any) {
    next(new AppError(HttpStatus.NOT_FOUND, err.message || 'Email not found in Resend', 'NOT_FOUND'));
  }
});

/**
 * @openapi
 * /api/emails/send:
 *   post:
 *     summary: Send a single transactional email via Resend
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = SendEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid email payload', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }

    // Direct loopback delivery for @devkits.space addresses
    deliverInboundToTempMail(
      parseResult.data.to,
      (req as any).user?.email || 'sender@devkits.space',
      parseResult.data.subject,
      parseResult.data.html,
      parseResult.data.text
    );

    const data = await emailService.sendSingleEmail(parseResult.data);
    res.json({ success: true, data, message: 'Email sent successfully via Resend' });
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    next(new AppError(HttpStatus.BAD_REQUEST, err.message || 'Failed to send email via Resend', 'RESEND_ERROR'));
  }
});

/**
 * @openapi
 * /api/emails/batch:
 *   post:
 *     summary: Send batch emails via Resend
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = SendBatchEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid batch email payload', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }

    // Direct loopback delivery for batch emails
    for (const item of parseResult.data.emails) {
      deliverInboundToTempMail(
        item.to,
        (req as any).user?.email || 'sender@devkits.space',
        item.subject,
        item.html,
        item.text
      );
    }

    const data = await emailService.sendBatchEmails(parseResult.data.emails);
    res.json({ success: true, data, message: 'Batch emails dispatched successfully via Resend' });
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    next(new AppError(HttpStatus.BAD_REQUEST, err.message || 'Failed to send batch emails via Resend', 'RESEND_ERROR'));
  }
});

/**
 * @openapi
 * /api/emails/{id}/schedule:
 *   patch:
 *     summary: Reschedule a scheduled email via Resend
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/schedule', requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UpdateScheduledEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid schedule update payload', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }

    const data = await emailService.updateScheduledEmail(req.params.id, parseResult.data.scheduledAt);
    res.json({ success: true, data, message: 'Email schedule updated successfully' });
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    next(new AppError(HttpStatus.BAD_REQUEST, err.message || 'Failed to update email schedule', 'RESEND_ERROR'));
  }
});

/**
 * @openapi
 * /api/emails/{id}/cancel:
 *   delete:
 *     summary: Cancel a scheduled email before dispatch via Resend
 *     tags: [Emails]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id/cancel', requireRole(ROLES.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await emailService.cancelScheduledEmail(req.params.id);
    res.json({ success: true, data, message: 'Scheduled email cancelled successfully' });
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    next(new AppError(HttpStatus.BAD_REQUEST, err.message || 'Failed to cancel scheduled email', 'RESEND_ERROR'));
  }
});

export default router;
