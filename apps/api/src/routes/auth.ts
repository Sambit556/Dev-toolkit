import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimiter';
import * as authService from '../services/auth.service';
import * as oauthService from '../services/oauth.service';
import { HttpStatus } from '../utils/httpStatus';
import { WEB_APP_ORIGIN } from '../config/constants';
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  RefreshTokenSchema,
  UpdateProfileSchema,
  GoogleCallbackSchema,
  GoogleExchangeSchema,
} from '../validators/auth.validators';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Access + refresh tokens and the user profile }
 *       401: { description: Invalid credentials }
 *       403: { description: Account has been deactivated }
 *       429: { description: Rate limited (IP+email keyed) }
 */
router.post('/login', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid login credentials structure', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { identifier, password } = parseResult.data;
    const data = await authService.login(identifier, password);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new (non-admin) user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       200: { description: Access + refresh tokens and the created user profile }
 *       400: { description: Email already registered or validation failed }
 *       429: { description: Rate limited (IP+email keyed) }
 */
router.post('/register', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid registration parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { email, password, name, mobileNumber } = parseResult.data;
    const data = await authService.register(email, password, name, mobileNumber);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     description: Blocked for the superadmin account by design. The token is returned directly in the response (no email transport configured) — treat it like a secret.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset token generated }
 *       403: { description: Superadmin or deactivated account }
 *       404: { description: No account with this email }
 *       429: { description: Rate limited (IP+email keyed) }
 */
router.post('/forgot-password', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = ForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid email parameter', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    await authService.requestPasswordReset(parseResult.data.email);
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset token has been sent to it.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Complete a password reset using the token from forgot-password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password reset; all sessions revoked }
 *       401: { description: Invalid or expired reset token }
 *       403: { description: Superadmin or deactivated account }
 *       429: { description: Rate limited (IP+email keyed) }
 */
router.post('/reset-password', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = ResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid password reset values', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { email, token, newPassword } = parseResult.data;
    await authService.completePasswordReset(email, token, newPassword);
    res.json({ success: true, message: 'Password reset successfully completed. Please login with your new password.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Rotate an access/refresh token pair
 *     description: Detects refresh-token reuse (theft) and revokes every session for the user if a already-rotated token is presented again.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access + refresh tokens }
 *       401: { description: "Invalid, expired, or reused refresh token" }
 *       403: { description: Account has been deactivated }
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = RefreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }
    const data = await authService.refreshSession(parseResult.data.refreshToken);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out of the current session/device
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 *       401: { description: Missing or invalid access token }
 */
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logout((req as any).user);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/logout-all:
 *   post:
 *     summary: Log out of every device/session
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All sessions revoked }
 *       401: { description: Missing or invalid access token }
 */
router.post('/logout-all', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.logoutAll((req as any).user.id);
    res.json({ success: true, message: 'Logged out of all devices successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change your own password (requires current password)
 *     description: Blocked for the superadmin account by design. Revokes every existing session on success.
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed; all sessions revoked }
 *       401: { description: Incorrect current password }
 *       403: { description: Superadmin account }
 */
router.post('/change-password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid password configuration parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { currentPassword, newPassword } = parseResult.data;
    await authService.changePassword((req as any).user, currentPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully. Logged out of all devices.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/session:
 *   get:
 *     summary: Get the currently authenticated user's session claims
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Current user (id, email, name, role, session ids)" }
 *       401: { description: Missing or invalid access token }
 */
router.get('/session', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, data: { user: (req as any).user } });
});

/**
 * @openapi
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile details
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid profile parameters', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const { name, mobileNumber } = parseResult.data;
    const data = await authService.updateProfile((req as any).user.id, name, mobileNumber);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Start Google Sign-In (redirects to Google's consent screen)
 *     description: A full-page redirect flow, not an embedded SDK/button — keeps the client secret server-side only and needs no CSP script-src/connect-src exceptions for accounts.google.com.
 *     tags: [Auth]
 *     responses:
 *       302: { description: Redirect to Google's OAuth consent screen }
 */
router.get('/google', authRateLimit, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.redirect(oauthService.buildGoogleAuthUrl());
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: Google's OAuth redirect target
 *     description: Never returns JSON (this is a browser redirect target, not an API call) — always redirects back to the frontend, either with a one-time exchange code on success or a fixed short error code on failure. Never echoes Google-supplied or internal error text into the redirect URL.
 *     tags: [Auth]
 *     responses:
 *       302: { description: Redirect to the frontend, with ?oauth_exchange=<code> or ?oauth_error=<code> }
 */
router.get('/google/callback', authRateLimit, async (req: Request, res: Response) => {
  const webUrl = WEB_APP_ORIGIN;
  try {
    if (req.query.error) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Google sign-in was cancelled', 'OAUTH_CANCELLED');
    }
    const parseResult = GoogleCallbackSchema.safeParse(req.query);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid OAuth callback', 'INVALID_OAUTH_CALLBACK');
    }
    const exchangeCode = await oauthService.exchangeGoogleCodeAndIssueExchange(parseResult.data.code, parseResult.data.state);
    res.redirect(`${webUrl}/storage?oauth_exchange=${exchangeCode}`);
  } catch (err) {
    const code = (err instanceof AppError && err.code) ? err.code : 'OAUTH_FAILED';
    res.redirect(`${webUrl}/storage?oauth_error=${encodeURIComponent(code)}`);
  }
});

/**
 * @openapi
 * /api/auth/google/exchange:
 *   post:
 *     summary: Redeem a one-time Google sign-in exchange code for a real session
 *     description: The callback above never puts real tokens in a URL — the frontend lands with a short-lived, single-use exchange code and trades it here for the same { accessToken, refreshToken, user } shape login/register return.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [code], properties: { code: { type: string } } }
 *     responses:
 *       200: { description: Access + refresh tokens and the user profile }
 *       400: { description: Exchange code missing, expired, or already used }
 */
router.post('/google/exchange', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = GoogleExchangeSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid exchange request', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
    }
    const data = await oauthService.consumeGoogleExchange(parseResult.data.code);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
