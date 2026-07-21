import { AppError } from '../middleware/errorHandler';
import { commonDao, transaction } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import { ACTIVITY_ACTIONS, ROLES } from '../constants/activityActions';
import { logger } from '../utils/logger';
import { generateId } from '../utils/ids';
import { buildUserKey, assertKeyBelongsToUser } from '../utils/s3Keys';
import { AVATAR_MAX_BYTES, AVATAR_URL_TTL_SECONDS } from '../config/constants';
import { assertValidProfileImage } from './uploadSecurity.service';
import { escapeHtml } from './storage.service';
import { putBinaryObject, deleteObject, getDownloadPresignedUrl } from '../utils/s3';
import { revokeUserSessions } from '../utils/session';
import { sendAccountDeactivatedEmail } from './email.service';
import { getRequestIp, getRequestUserAgent } from '../utils/context';
import { detectDeviceType } from '../utils/deviceDetect';
import { HttpStatus } from '../utils/httpStatus';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

// Never expose password_hash or other sensitive columns to the client.
const SAFE_PROFILE_FIELDS = ['id', 'email', 'name', 'role', 'is_active', 'avatar_s3_key', 'mobile_number', 'created_at', 'last_login'];

export async function getProfile(userId: string) {
  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: SAFE_PROFILE_FIELDS });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
  }

  // Isolated by construction: this presigned URL is only ever generated for the
  // authenticated caller's *own* avatar_s3_key — there is no endpoint anywhere
  // that accepts another user's id and returns their avatar.
  const avatarUrl = user.avatar_s3_key ? await getDownloadPresignedUrl(user.avatar_s3_key, AVATAR_URL_TTL_SECONDS) : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    mobileNumber: user.mobile_number || '',
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    lastLogin: user.last_login,
    avatarUrl,
  };
}

export async function updateName(userId: string, name: string) {
  const nameSanitized = escapeHtml(name.trim());
  const updated = await commonDao.updateData<any>(TABLES.USERS, { name: nameSanitized }, { id: userId }, { returning: SAFE_PROFILE_FIELDS });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.PROFILE_UPDATE_NAME, resource: userId });
  return updated;
}

export async function uploadAvatar(userId: string, buffer: Buffer, declaredMimeType: string) {
  // Execution/RCE protection is checked first, inside assertValidProfileImage,
  // before anything is written to S3 or the database.
  assertValidProfileImage({ buffer, declaredMimeType, maxBytes: AVATAR_MAX_BYTES });

  const normalizedMime = declaredMimeType.toLowerCase().split(';')[0].trim();
  const ext = EXTENSION_BY_MIME[normalizedMime] || 'bin';
  const newKey = buildUserKey('avatars', userId, `${generateId()}.${ext}`);
  assertKeyBelongsToUser(newKey, userId);

  const existing = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: ['avatar_s3_key'] });

  await putBinaryObject(newKey, buffer, normalizedMime);

  const updated = await commonDao.updateData<any>(TABLES.USERS, { avatar_s3_key: newKey }, { id: userId }, { returning: SAFE_PROFILE_FIELDS });

  // Clean up the previous avatar object now that the new one is live.
  if (existing?.avatar_s3_key) {
    await deleteObject(existing.avatar_s3_key).catch((err: any) =>
      logger.error('Failed to delete previous avatar object', { userId, key: existing.avatar_s3_key, error: err.message })
    );
  }

  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.PROFILE_UPLOAD_AVATAR, resource: userId });

  const avatarUrl = await getDownloadPresignedUrl(newKey, AVATAR_URL_TTL_SECONDS);
  return { ...updated, avatarUrl };
}

// Self-service and reversible only — the only way back in afterwards is a superadmin
// flipping the existing Active/Inactive toggle in the admin panel (same as an
// admin-initiated deactivation today). No self-service permanent delete exists here
// by design; that stays a superadmin-only action (admin.service.ts deleteUserAndData).
export async function deactivateOwnAccount(userId: string, role: string, email: string, name?: string): Promise<void> {
  if (role === ROLES.SUPERADMIN) {
    // The protect_superadmin_account DB trigger would also reject this, but checking
    // here first gives a clean 403 instead of a raw SQL exception bubbling up.
    throw new AppError(HttpStatus.FORBIDDEN, 'The superadmin account cannot be deactivated', 'FORBIDDEN');
  }

  await transaction(async (trx) => {
    await trx.updateData(TABLES.USERS, { is_active: false }, { id: userId });
    await trx.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: userId });
    await trx.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.SELF_DEACTIVATE_ACCOUNT, resource: userId });
  });

  // Kills every currently active session immediately, not just future logins —
  // mirrors the same revoke-everything pattern changePassword() uses in auth.service.ts.
  await revokeUserSessions(userId);
  logger.warn('User self-deactivated their account; all sessions revoked', { userId });

  const dbUser = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: ['country'] });
  sendAccountDeactivatedEmail(email, name || email, {
    ip: getRequestIp(),
    country: dbUser?.country,
    deviceType: detectDeviceType(getRequestUserAgent()),
  });
}

export async function deleteAvatar(userId: string) {
  const existing = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId }, { fields: ['avatar_s3_key'] });
  if (!existing?.avatar_s3_key) return;

  assertKeyBelongsToUser(existing.avatar_s3_key, userId);
  await deleteObject(existing.avatar_s3_key).catch((err: any) =>
    logger.error('Failed to delete avatar object', { userId, key: existing.avatar_s3_key, error: err.message })
  );
  await commonDao.updateData(TABLES.USERS, { avatar_s3_key: null }, { id: userId });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: userId, action: ACTIVITY_ACTIONS.PROFILE_DELETE_AVATAR, resource: userId });
}
