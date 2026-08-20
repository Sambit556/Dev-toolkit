import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { HttpStatus } from '../utils/httpStatus';
import { logger } from '../utils/logger';

export interface TempEmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  createdAt: string;
  read: boolean;
  size: number;
}

export interface TempMailbox {
  address: string;
  token: string;
  ownerEmail?: string;
  createdAt: string;
  expiresAt: string;
  messages: TempEmailMessage[];
}

// In-memory store of active disposable mailboxes: address -> TempMailbox
const mailboxStore = new Map<string, TempMailbox>();

// Helper: Purge expired mailboxes
const purgeExpiredMailboxes = () => {
  const now = new Date().toISOString();
  for (const [addr, box] of mailboxStore.entries()) {
    if (box.expiresAt < now) {
      mailboxStore.delete(addr);
    }
  }
};

// Periodic auto-clean every 5 minutes
setInterval(purgeExpiredMailboxes, 5 * 60 * 1000);

export const DOMAIN = 'devkits.space';

export function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase();
}

/**
 * Get or create mailbox with user-isolation support
 */
export function getOrCreateMailbox(requestedAddr?: string, ownerEmail?: string, forceNew = false): TempMailbox {
  purgeExpiredMailboxes();
  const cleanOwner = ownerEmail ? normalizeAddress(ownerEmail) : undefined;

  // If user has an existing active mailbox and did not ask for a custom/new one, return theirs
  if (cleanOwner && !requestedAddr && !forceNew) {
    for (const box of mailboxStore.values()) {
      if (box.ownerEmail === cleanOwner && new Date(box.expiresAt) > new Date()) {
        return box;
      }
    }
  }

  // If specific address requested
  if (requestedAddr) {
    const clean = normalizeAddress(requestedAddr);
    const existing = mailboxStore.get(clean);
    if (existing && new Date(existing.expiresAt) > new Date()) {
      if (cleanOwner) existing.ownerEmail = cleanOwner;
      return existing;
    }
  }

  // Generate unique address prefixed by user prefix or dev_
  const userPrefix = cleanOwner 
    ? cleanOwner.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 10) 
    : 'dev';
  const randomStr = crypto.randomBytes(3).toString('hex');
  const address = requestedAddr 
    ? normalizeAddress(requestedAddr) 
    : `${userPrefix}_${randomStr}@${DOMAIN}`;

  const token = crypto.randomBytes(16).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const mailbox: TempMailbox = {
    address,
    token,
    ownerEmail: cleanOwner,
    createdAt,
    expiresAt,
    messages: [],
  };

  mailboxStore.set(address, mailbox);
  return mailbox;
}

/**
 * Deliver incoming email into active temporary mailbox
 */
export function deliverInboundToTempMail(
  to: string | string[],
  from: string,
  subject: string,
  html?: string,
  text?: string,
  headers?: Record<string, string>
): boolean {
  const toList = Array.isArray(to) ? to : [to];
  let delivered = false;

  for (const rawTo of toList) {
    if (!rawTo) continue;
    const cleanTo = normalizeAddress(rawTo);
    
    // Check if recipient is a @devkits.space address or matches an existing mailbox
    if (cleanTo.endsWith(`@${DOMAIN}`) || mailboxStore.has(cleanTo)) {
      const mailbox = getOrCreateMailbox(cleanTo);
      const newMsg: TempEmailMessage = {
        id: 'msg_' + crypto.randomBytes(6).toString('hex'),
        from: from || 'unknown@sender.com',
        to: mailbox.address,
        subject: subject || '(No Subject)',
        html: html || (text ? `<pre style="font-family: sans-serif; padding: 16px;">${text}</pre>` : '<p>No content</p>'),
        text: text || (html ? html.replace(/<[^>]*>?/gm, '').trim() : ''),
        headers: headers || {
          'delivered-to': mailbox.address,
          'message-id': `<${crypto.randomBytes(8).toString('hex')}@devkits.space>`,
        },
        createdAt: new Date().toISOString(),
        read: false,
        size: Buffer.byteLength((html || text || ''), 'utf8'),
      };

      mailbox.messages.unshift(newMsg);
      delivered = true;
      logger.info(`Delivered inbound temp mail to ${mailbox.address} from ${from}`);
    }
  }

  return delivered;
}

const router = Router();

/**
 * POST /api/tempmail/generate
 * Creates or retrieves an isolated disposable email inbox for the current user
 */
router.post('/generate', (req: Request, res: Response) => {
  try {
    const customName = req.body?.customName?.trim();
    const ownerEmail = req.body?.ownerEmail?.trim() || (req as any).user?.email;
    const forceNew = req.body?.forceNew === true;
    let targetAddress: string | undefined;

    if (customName) {
      const sanitized = customName.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase().slice(0, 30);
      if (sanitized) {
        targetAddress = sanitized.includes('@') ? sanitized : `${sanitized}@${DOMAIN}`;
      }
    }

    const mailbox = getOrCreateMailbox(targetAddress, ownerEmail, forceNew);

    res.json({
      success: true,
      data: {
        address: mailbox.address,
        token: mailbox.token,
        ownerEmail: mailbox.ownerEmail,
        createdAt: mailbox.createdAt,
        expiresAt: mailbox.expiresAt,
        messageCount: mailbox.messages.length,
      },
    });
  } catch (err: any) {
    logger.error('Error generating temp mailbox', { error: err.message });
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to generate temporary email' });
  }
});

/**
 * GET /api/tempmail/inbox/:address
 * Fetches all incoming messages for a mailbox
 */
router.get('/inbox/:address', (req: Request, res: Response) => {
  const address = normalizeAddress(req.params.address);
  const mailbox = mailboxStore.get(address);

  if (!mailbox || new Date(mailbox.expiresAt) <= new Date()) {
    // If expired or missing, auto-create a clean one for smooth user experience
    const newBox = getOrCreateMailbox(address);
    return res.json({
      success: true,
      data: {
        address: newBox.address,
        expiresAt: newBox.expiresAt,
        messages: [],
      },
    });
  }

  res.json({
    success: true,
    data: {
      address: mailbox.address,
      expiresAt: mailbox.expiresAt,
      messages: mailbox.messages.map((m) => ({
        id: m.id,
        from: m.from,
        to: m.to,
        subject: m.subject,
        preview: m.text?.slice(0, 120) || 'No text snippet',
        createdAt: m.createdAt,
        read: m.read,
        size: m.size,
      })),
    },
  });
});

/**
 * POST /api/tempmail/extend/:address
 * Extends the expiration of a mailbox by 1 hour
 */
router.post('/extend/:address', (req: Request, res: Response) => {
  const address = normalizeAddress(req.params.address);
  const mailbox = mailboxStore.get(address);

  if (!mailbox) {
    const newBox = getOrCreateMailbox(address);
    return res.json({ success: true, data: { expiresAt: newBox.expiresAt } });
  }

  mailbox.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  res.json({
    success: true,
    data: {
      address: mailbox.address,
      expiresAt: mailbox.expiresAt,
    },
  });
});

/**
 * GET /api/tempmail/message/:id
 * Fetches full HTML and text details of a specific message
 */
router.get('/message/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  for (const box of mailboxStore.values()) {
    const msg = box.messages.find((m) => m.id === id);
    if (msg) {
      msg.read = true;
      return res.json({
        success: true,
        data: msg,
      });
    }
  }

  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    message: 'Message not found or expired',
  });
});

/**
 * DELETE /api/tempmail/message/:id
 * Deletes a single message from the inbox
 */
router.delete('/message/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  for (const box of mailboxStore.values()) {
    const index = box.messages.findIndex((m) => m.id === id);
    if (index !== -1) {
      box.messages.splice(index, 1);
      return res.json({ success: true, message: 'Message deleted' });
    }
  }

  res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Message not found' });
});

/**
 * DELETE /api/tempmail/inbox/:address
 * Clears all messages from a mailbox
 */
router.delete('/inbox/:address', (req: Request, res: Response) => {
  const address = normalizeAddress(req.params.address);
  const mailbox = mailboxStore.get(address);

  if (mailbox) {
    mailbox.messages = [];
  }

  res.json({ success: true, message: 'Inbox cleared' });
});

/**
 * POST /api/tempmail/simulate
 * Simulates receiving a realistic incoming email (OTP, Welcome, Alert, Invoice)
 */
router.post('/simulate', (req: Request, res: Response) => {
  try {
    const { address, type = 'otp', customFrom, customSubject, customBody } = req.body;
    if (!address) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Recipient address required' });
    }

    const clean = normalizeAddress(address);
    const mailbox = getOrCreateMailbox(clean);

    let from = customFrom || 'security@github.com';
    let subject = customSubject || 'Your GitHub verification code: 849201';
    let html = customBody || `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 20px;"><h2 style="color: #2563eb;">Verification Code</h2><p>Here is your one-time password:</p><h1 style="letter-spacing: 4px; color: #1e293b;">849201</h1><p style="color: #64748b; font-size: 12px;">Expires in 10 minutes.</p></body></html>`;
    let text = 'Verification code: 849201. Use this code to complete sign-in.';

    if (type === 'welcome') {
      from = customFrom || 'team@resend.com';
      subject = customSubject || 'Welcome to DevKits Cloud Workspace 🚀';
      html = `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc;"><h2 style="color: #38bdf8;">Welcome aboard!</h2><p>Your developer suite is now operational with full S3 storage isolation.</p><a href="https://devkits.space" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Open DevKits</a></body></html>`;
      text = 'Welcome aboard! Your developer suite is now operational with full S3 storage isolation.';
    } else if (type === 'invoice') {
      from = customFrom || 'billing@stripe.com';
      subject = customSubject || 'Receipt for your DevKits Pro plan ($29.00)';
      html = `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 24px;"><h2 style="color: #059669;">Payment Confirmed</h2><p>Amount: <strong>$29.00 USD</strong></p><p>Status: <strong>Paid</strong></p><p>Thank you for your business!</p></body></html>`;
      text = 'Payment Confirmed: $29.00 USD paid successfully.';
    } else if (type === 'alert') {
      from = customFrom || 'no-reply@aws.amazon.com';
      subject = customSubject || '⚠️ AWS Security Notification: IAM Role Assumed';
      html = `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 24px; background: #fff;"><h2 style="color: #dc2626;">Security Alert</h2><p>A new session was authenticated for role <code>DevKitsStorageAdmin</code> from IP 198.51.100.42.</p></body></html>`;
      text = 'Security Alert: A new session was authenticated for role DevKitsStorageAdmin from IP 198.51.100.42.';
    }

    const newMsg: TempEmailMessage = {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      from,
      to: mailbox.address,
      subject,
      html,
      text,
      headers: {
        'x-sender-ip': '198.51.100.24',
        'message-id': `<${crypto.randomBytes(8).toString('hex')}@devkits.space>`,
        'delivered-to': mailbox.address,
      },
      createdAt: new Date().toISOString(),
      read: false,
      size: Buffer.byteLength(html, 'utf8'),
    };

    mailbox.messages.unshift(newMsg);

    res.json({
      success: true,
      data: newMsg,
    });
  } catch (err: any) {
    logger.error('Error simulating incoming temp mail', { error: err.message });
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to simulate email' });
  }
});

/**
 * POST /api/tempmail/inbound
 * Public webhook endpoint for real inbound emails from Resend, SendGrid, Cloudflare, or custom SMTP
 */
router.post('/inbound', (req: Request, res: Response) => {
  try {
    const body = req.body;
    let to: string = '';
    let from: string = 'unknown@sender.com';
    let subject: string = '(No Subject)';
    let html: string = '';
    let text: string = '';

    if (body.data) {
      // Resend webhook format
      to = body.data.to || (Array.isArray(body.data.to) ? body.data.to[0] : '');
      from = body.data.from || from;
      subject = body.data.subject || subject;
      html = body.data.html || '';
      text = body.data.text || '';
    } else {
      // Standard / SendGrid / Cloudflare format
      to = body.to || body.recipient || (Array.isArray(body.to) ? body.to[0] : '');
      from = body.from || body.sender || from;
      subject = body.subject || subject;
      html = body.html || body.body || '';
      text = body.text || body.plain || '';
    }

    if (!to) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Missing recipient' });
    }

    const delivered = deliverInboundToTempMail(
      to,
      from,
      subject,
      html,
      text,
      req.headers as Record<string, string>
    );

    res.json({
      success: true,
      delivered,
      message: delivered ? 'Inbound message received and delivered to temp inbox' : 'Mailbox expired or not found',
    });
  } catch (err: any) {
    logger.error('Inbound webhook error', { error: err.message });
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Inbound processing error' });
  }
});

export default router;
