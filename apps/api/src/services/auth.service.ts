import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/ids';
import { commonDao, transaction } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import {
  setSession, getSession, revokeSession, revokeUserSessions,
  setPasswordChangeOtp, getPasswordChangeOtp, recordFailedPasswordChangeOtpAttempt, clearPasswordChangeOtp,
} from '../utils/session';
import { logger } from '../utils/logger';
import { ACTIVITY_ACTIONS, ROLES } from '../constants/activityActions';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS, WEB_APP_ORIGIN, PASSWORD_RESET_TOKEN_TTL_MINUTES } from '../config/constants';
import { hashPassword, verifyPassword } from './password.service';
import { HttpStatus } from '../utils/httpStatus';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from './token.service';
import { sendWelcomeEmail, sendPasswordChangedEmail, sendForgotPasswordEmail, sendPasswordChangeOtpEmail } from './email.service';
import { updateUserGeoAndIp } from './geo.service';
import { getRequestIp, getRequestUserAgent } from '../utils/context';
import { detectDeviceType } from '../utils/deviceDetect';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isSuperAdmin(user: any): boolean {
  return user.role === ROLES.SUPERADMIN;
}

export async function issueSession(user: { id: string; email: string }) {
  const accessTokenId = generateId();
  const tokenFamily = generateId();

  const tokenPayload = { userId: user.id, email: user.email, accessTokenId, tokenFamily };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await setSession(
    accessTokenId,
    {
      userId: user.id,
      email: user.email,
      tokenFamily,
      refreshToken,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
    },
    ACCESS_TOKEN_TTL_SECONDS
  );

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const tokenHash = hashToken(refreshToken);

  await transaction(async (trx) => {
    await trx.addData(TABLES.REFRESH_TOKENS, {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked: false,
    });
  });

  return { accessToken, refreshToken };
}

export async function login(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, isEmail ? { email: identifier } : { mobile_number: identifier });
  if (!user) {
    logger.warn('Authentication failure: User not found', { identifier });
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (user.is_active === false) {
    logger.warn('Authentication failure: Account inactive', { identifier });
    throw new AppError(HttpStatus.FORBIDDEN, 'This account has been deactivated. Contact an administrator.', 'ACCOUNT_INACTIVE');
  }

  if (!user.password_hash) {
    // Registered via Google — verifyPassword would throw on a null hash rather
    // than cleanly returning false, so this must be checked explicitly first.
    throw new AppError(HttpStatus.FORBIDDEN, 'This account uses Google Sign-In. Use "Continue with Google" to log in.', 'OAUTH_ONLY_ACCOUNT');
  }

  const isMatch = await verifyPassword(password, user.password_hash);
  if (!isMatch) {
    logger.warn('Authentication failure: Incorrect password', { identifier });
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const { accessToken, refreshToken } = await issueSession(user);

  await transaction(async (trx) => {
    await trx.updateData(TABLES.USERS, { last_login: new Date() }, { id: user.id });
    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.LOGIN, resource: 'auth' });
  });

  logger.info('User logged in successfully', { userId: user.id, identifier });

  updateUserGeoAndIp(user.id, getRequestIp());

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, mobile_number: user.mobile_number },
  };
}

export async function register(email: string, password: string, name?: string, mobileNumber?: string) {
  const existingUser = await commonDao.getOneDataByCond<any>(TABLES.USERS, { email });
  if (existingUser) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User with this email already exists', 'EMAIL_ALREADY_EXISTS');
  }

  if (mobileNumber) {
    const existingMobile = await commonDao.getOneDataByCond<any>(TABLES.USERS, { mobile_number: mobileNumber });
    if (existingMobile) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'User with this mobile number already exists', 'MOBILE_ALREADY_EXISTS');
    }
  }

  const [localPart] = email.split('@');
  if (localPart && localPart.includes('+')) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email aliases (using +) are not allowed for registration', 'EMAIL_ALIAS_NOT_ALLOWED');
  }

  const passwordHash = await hashPassword(password);

  const user = await commonDao.addData<any>(TABLES.USERS, {
    email,
    password_hash: passwordHash,
    name: name || null,
    mobile_number: mobileNumber || null,
    role: ROLES.USER,
  });

  const { accessToken, refreshToken } = await issueSession(user);

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.REGISTER, resource: 'auth' });

  logger.info('New user registered successfully', { userId: user.id, email: user.email });

  // Fire-and-forget — never blocks or fails registration if email delivery is slow/down.
  sendWelcomeEmail(user.email, user.name || user.email);
  updateUserGeoAndIp(user.id, getRequestIp());

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, mobile_number: user.mobile_number },
  };
}

export async function requestPasswordReset(email: string) {
  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { email });
  
  if (!user) {
    logger.info('Password reset request for non-existent user, generating dummy token', { email });
    // Don't return the dummy token, just act like it worked
    return;
  }

  if (isSuperAdmin(user)) {
    logger.warn('Security warning: Attempt to trigger forgot password for super admin blocked', { email });
    return;
  }

  if (user.is_active === false) {
    logger.warn('Security warning: Attempt to trigger forgot password for inactive user blocked', { email });
    // Still don't throw an error to prevent enumeration
    return;
  }

  if (!user.password_hash) {
    logger.info('Password reset request for a Google-only account, ignoring (no password to reset)', { email });
    // Same "act like it worked" non-enumeration behavior as the other guards above.
    return;
  }

  const resetToken = generatePasswordResetToken({ userId: user.id, email: user.email, action: 'password_reset' });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.REQUEST_PASSWORD_RESET, resource: 'auth' });

  // The reset link deep-links straight into the existing reset form (pre-filling email
  // + token) rather than requiring the user to copy-paste — see storage/page.tsx's
  // resetToken/email URL-param handling. The raw token is also included in the email
  // body as a fallback in case the link itself doesn't carry the params through cleanly.
  const resetUrl = `${WEB_APP_ORIGIN}/storage?resetToken=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;
  sendForgotPasswordEmail(user.email, user.name || user.email, resetUrl, resetToken, PASSWORD_RESET_TOKEN_TTL_MINUTES);

  return;
}

export async function completePasswordReset(email: string, token: string, newPassword: string) {
  const decoded = verifyPasswordResetToken(token);

  if (decoded.action !== 'password_reset' || decoded.email !== email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid password reset token context', 'INVALID_RESET_TOKEN');
  }

  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { email });
  if (!user || user.id !== decoded.userId) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User account not found', 'VALIDATION_ERROR');
  }

  if (isSuperAdmin(user)) {
    throw new AppError(HttpStatus.FORBIDDEN, 'Password cannot be reset or modified.', 'FORBIDDEN');
  }

  if (user.is_active === false) {
    throw new AppError(HttpStatus.FORBIDDEN, 'This account has been deactivated. Contact an administrator.', 'ACCOUNT_INACTIVE');
  }

  if (!user.password_hash) {
    throw new AppError(HttpStatus.FORBIDDEN, 'This account uses Google Sign-In and has no password to reset.', 'OAUTH_ONLY_ACCOUNT');
  }

  const newHash = await hashPassword(newPassword);

  await transaction(async (trx) => {
    await trx.updateData(TABLES.USERS, { password_hash: newHash, password_changed_at: new Date() }, { id: user.id });
    await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: user.id });
    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.RESET_PASSWORD_COMPLETED, resource: 'auth' });
  });

  await revokeUserSessions(user.id);

  logger.info('Password reset successfully completed for user', { userId: user.id });
}

export async function refreshSession(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken);
  const currentHash = hashToken(refreshToken);

  const dbToken = await commonDao.getOneDataByCond<any>(TABLES.REFRESH_TOKENS, { token_hash: currentHash });

  if (!dbToken) {
    logger.warn('Refresh failure: Token not found in database', { userId: decoded.userId });
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (dbToken.revoked || new Date(dbToken.expires_at).getTime() < Date.now()) {
    logger.error('Security alert: Refresh token reuse/theft detected! Revoking all sessions for user.', {
      userId: decoded.userId,
      tokenFamily: decoded.tokenFamily,
    });

    await transaction(async (trx) => {
      await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: decoded.userId });
      await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: decoded.userId, action: ACTIVITY_ACTIONS.SECURITY_ALERT_TOKEN_REUSE, resource: 'auth' });
    });

    await revokeUserSessions(decoded.userId);

    throw new AppError(HttpStatus.UNAUTHORIZED, 'Session revoked due to token reuse detection', 'SESSION_REVOKED');
  }

  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: decoded.userId });
  if (!user || user.is_active === false) {
    throw new AppError(HttpStatus.FORBIDDEN, 'This account has been deactivated. Contact an administrator.', 'ACCOUNT_INACTIVE');
  }

  const newAccessTokenId = generateId();
  const tokenPayload = {
    userId: decoded.userId,
    email: decoded.email,
    accessTokenId: newAccessTokenId,
    tokenFamily: decoded.tokenFamily,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const newSessionData = {
    userId: decoded.userId,
    email: decoded.email,
    tokenFamily: decoded.tokenFamily,
    refreshToken: newRefreshToken,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
  };

  const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const newHash = hashToken(newRefreshToken);

  await transaction(async (trx) => {
    await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { token_hash: currentHash });
    await trx.addData(TABLES.REFRESH_TOKENS, {
      user_id: decoded.userId,
      token_hash: newHash,
      expires_at: newExpiresAt,
      revoked: false,
    });
  });

  await revokeSession(decoded.accessTokenId);
  await setSession(newAccessTokenId, newSessionData, ACCESS_TOKEN_TTL_SECONDS);

  logger.info('Tokens rotated successfully', { userId: decoded.userId });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(user: { id: string; accessTokenId: string }) {
  await revokeSession(user.accessTokenId);

  const session = await getSession(user.accessTokenId);
  if (session) {
    const tokenHash = hashToken(session.refreshToken);
    await commonDao.updateData('refresh_tokens', { revoked: true }, { token_hash: tokenHash });
  }

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.LOGOUT, resource: 'auth' });

  logger.info('User logged out successfully from current session', { userId: user.id });
}

export async function logoutAll(userId: string) {
  await revokeUserSessions(userId);
  await commonDao.updateData('refresh_tokens', { revoked: true }, { user_id: userId });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.LOGOUT_ALL, resource: 'auth' });
  logger.info('User logged out from all devices', { userId });
}

export async function changePassword(user: { id: string; role: string; email: string; name?: string }, currentPassword: string, newPassword: string) {
  if (isSuperAdmin(user)) {
    logger.warn('Security alert: Direct attempt to change password for super admin rejected', { userId: user.id });
    throw new AppError(HttpStatus.FORBIDDEN, 'Super Admin password cannot be modified.', 'FORBIDDEN');
  }

  const dbUser = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: user.id }, { fields: ['password_hash', 'country'] });
  if (!dbUser) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found', 'VALIDATION_ERROR');
  }

  const isMatch = await verifyPassword(currentPassword, dbUser.password_hash);
  if (!isMatch) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Incorrect current password', 'INVALID_CREDENTIALS');
  }

  const newHash = await hashPassword(newPassword);

  await transaction(async (trx) => {
    await trx.updateData(TABLES.USERS, { password_hash: newHash, password_changed_at: new Date() }, { id: user.id });
    await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: user.id });
    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.PASSWORD_CHANGE, resource: 'auth' });
  });

  await revokeUserSessions(user.id);

  logger.info('User password changed successfully, all sessions revoked', { userId: user.id });

  sendPasswordChangedEmail(user.email, user.name || user.email, {
    ip: getRequestIp(),
    country: dbUser.country,
    deviceType: detectDeviceType(getRequestUserAgent()),
  });
}

// --- Superadmin password change (OTP-only) ------------------------------------
// The superadmin account is deliberately locked out of the regular
// current-password flow above and the pre-auth forgot/reset-password flow
// (both explicitly reject it) — a compromised session or a public "forgot
// password" form typed with the superadmin's email are both weaker guarantees
// than requiring a live, single-use code delivered to the account's own inbox
// on top of an already-authenticated session. This is the only path by which
// the superadmin's password can ever be changed.
const SUPERADMIN_OTP_TTL_SECONDS = 600; // 10 minutes
const SUPERADMIN_OTP_MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

export async function requestSuperadminPasswordOtp(user: { id: string; role: string; email: string; name?: string }) {
  if (!isSuperAdmin(user)) {
    throw new AppError(HttpStatus.FORBIDDEN, 'OTP-based password change is only available for the superadmin account.', 'FORBIDDEN');
  }

  const otp = generateOtp();
  // Hashed (bcrypt + the same server-side pepper as real passwords) rather than
  // stored raw — even a compromised Redis/memory store never reveals the code.
  const otpHash = await hashPassword(otp);
  await setPasswordChangeOtp(user.id, otpHash, SUPERADMIN_OTP_TTL_SECONDS);

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.REQUEST_SUPERADMIN_PASSWORD_OTP, resource: 'auth' });
  sendPasswordChangeOtpEmail(user.email, user.name || user.email, otp, SUPERADMIN_OTP_TTL_SECONDS / 60);

  logger.info('Superadmin password-change OTP issued', { userId: user.id });
}

export async function changeSuperadminPasswordWithOtp(user: { id: string; role: string; email: string; name?: string }, otp: string, newPassword: string) {
  if (!isSuperAdmin(user)) {
    throw new AppError(HttpStatus.FORBIDDEN, 'OTP-based password change is only available for the superadmin account.', 'FORBIDDEN');
  }

  const record = await getPasswordChangeOtp(user.id);
  if (!record) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'This code has expired or was never requested. Request a new one.', 'OTP_EXPIRED');
  }
  if (record.attempts >= SUPERADMIN_OTP_MAX_ATTEMPTS) {
    await clearPasswordChangeOtp(user.id);
    throw new AppError(HttpStatus.TOO_MANY_REQUESTS, 'Too many incorrect attempts. Request a new code.', 'OTP_LOCKED');
  }

  const isValid = await verifyPassword(otp, record.otpHash);
  if (!isValid) {
    const attempts = await recordFailedPasswordChangeOtpAttempt(user.id);
    const remaining = Math.max(0, SUPERADMIN_OTP_MAX_ATTEMPTS - attempts);
    logger.warn('Security alert: Incorrect superadmin password-change OTP submitted', { userId: user.id, attempts });
    throw new AppError(HttpStatus.UNAUTHORIZED, `Incorrect code. ${remaining} attempt(s) remaining.`, 'INVALID_OTP');
  }

  await clearPasswordChangeOtp(user.id);

  const dbUser = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: user.id }, { fields: ['country'] });
  const newHash = await hashPassword(newPassword);

  await transaction(async (trx) => {
    await trx.updateData(TABLES.USERS, { password_hash: newHash, password_changed_at: new Date() }, { id: user.id });
    await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: user.id });
    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: ACTIVITY_ACTIONS.SUPERADMIN_PASSWORD_CHANGE_OTP, resource: 'auth' });
  });

  await revokeUserSessions(user.id);

  logger.info('Superadmin password changed via OTP, all sessions revoked', { userId: user.id });

  sendPasswordChangedEmail(user.email, user.name || user.email, {
    ip: getRequestIp(),
    country: dbUser?.country,
    deviceType: detectDeviceType(getRequestUserAgent()),
  });
}

export async function updateProfile(userId: string, name?: string, mobileNumber?: string) {
  if (mobileNumber) {
    const existing = await commonDao.getOneDataByCond<any>(TABLES.USERS, { mobile_number: mobileNumber });
    if (existing && existing.id !== userId) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'Mobile number already in use', 'MOBILE_ALREADY_EXISTS');
    }
  }

  const updateData: any = { updated_at: new Date() };
  if (name !== undefined) updateData.name = name;
  if (mobileNumber !== undefined) updateData.mobile_number = mobileNumber === '' ? null : mobileNumber;

  const user = await commonDao.updateData<any>(TABLES.USERS, updateData, { id: userId });
  if (!user) throw new AppError(HttpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');

  return { id: user.id, email: user.email, name: user.name, role: user.role, mobile_number: user.mobile_number };
}

