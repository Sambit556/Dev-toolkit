import { AppError } from '../middleware/errorHandler';
import { hashPassword } from './password.service';
import { commonDao } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import { ACTIVITY_ACTIONS, ROLES } from '../constants/activityActions';
import { DEFAULT_STORAGE_QUOTA_BYTES } from '../config/constants';
import { logger } from '../utils/logger';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { s3Client, s3BucketName, getDownloadPresignedUrl } from '../utils/s3';
import { HttpStatus } from '../utils/httpStatus';
import { AVATAR_URL_TTL_SECONDS } from '../config/constants';
import { sendAccountDeletedEmail, sendPasswordChangedEmail } from './email.service';
import { revokeUserSessions } from '../utils/session';

/**
 * One aggregated query for every user's usage stats — deliberately not "list
 * users, then N per-user usage queries in a loop" (the classic admin-dashboard
 * N+1). The join + GROUP BY computes everything the dashboard needs in a single
 * round trip regardless of how many users exist.
 */
export async function listUsersWithUsage() {
  const rows = await commonDao.rawQuery<any>(
    `SELECT
      u.id, u.email, u.name, u.role, u.is_active, u.storage_quota_bytes,
      u.mobile_number, u.avatar_s3_key,
      u.created_at, u.last_login,
      COALESCE(SUM(s.size) FILTER (WHERE s.type = 'file' AND s.is_deleted = false), 0) AS used_bytes,
      COUNT(*) FILTER (WHERE s.type = 'file' AND s.is_deleted = false) AS file_count,
      COUNT(*) FILTER (WHERE s.type = 'folder' AND s.is_deleted = false) AS folder_count
    FROM ${TABLES.USERS} u
    LEFT JOIN ${TABLES.STORAGE_ITEMS} s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at ASC`
  );

  return Promise.all(
    rows.map(async (row) => {
      const quota = Number(row.storage_quota_bytes) || DEFAULT_STORAGE_QUOTA_BYTES;
      const used = Number(row.used_bytes) || 0;
      // Presigning is a local HMAC computation, not an AWS round trip — cheap even
      // fanned out across every row here, unlike a real per-user S3 API call would be.
      const avatarUrl = row.avatar_s3_key ? await getDownloadPresignedUrl(row.avatar_s3_key, AVATAR_URL_TTL_SECONDS) : null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        mobileNumber: row.mobile_number || '',
        avatarUrl,
        role: row.role,
        isActive: row.is_active,
        createdAt: row.created_at,
        lastLogin: row.last_login,
        usedBytes: used,
        quotaBytes: quota,
        percentUsed: quota > 0 ? Math.min(100, (used / quota) * 100) : 0,
        fileCount: Number(row.file_count) || 0,
        folderCount: Number(row.folder_count) || 0,
      };
    })
  );
}

async function getTargetUser(userId: string) {
  const user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { id: userId });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
  }
  return user;
}

function assertNotSuperAdmin(user: any) {
  if (user.role === ROLES.SUPERADMIN) {
    // The database trigger (protect_superadmin_account) would also reject this,
    // but checking here first gives a clean 403 instead of a raw SQL exception.
    throw new AppError(HttpStatus.FORBIDDEN, 'The superadmin account cannot be modified through this action', 'FORBIDDEN');
  }
}

// Never return password_hash (or other sensitive columns) from an admin mutation —
// `RETURNING *` would otherwise ship other users' bcrypt hashes to the browser.
const SAFE_USER_FIELDS = ['id', 'email', 'name', 'role', 'is_active', 'storage_quota_bytes', 'created_at', 'last_login'];

export async function setUserActive(adminUserId: string, targetUserId: string, isActive: boolean) {
  const target = await getTargetUser(targetUserId);
  assertNotSuperAdmin(target);

  const updated = await commonDao.updateData<any>(TABLES.USERS, { is_active: isActive }, { id: targetUserId }, { returning: SAFE_USER_FIELDS });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: adminUserId,
    action: isActive ? ACTIVITY_ACTIONS.ADMIN_ACTIVATE_USER : ACTIVITY_ACTIONS.ADMIN_DEACTIVATE_USER,
    resource: targetUserId,
  });

  logger.info('Admin toggled user active status', { adminUserId, targetUserId, isActive });
  return updated;
}

export async function updateUserQuota(adminUserId: string, targetUserId: string, quotaBytes: number) {
  const target = await getTargetUser(targetUserId);
  assertNotSuperAdmin(target);

  const updated = await commonDao.updateData<any>(TABLES.USERS, { storage_quota_bytes: quotaBytes }, { id: targetUserId }, { returning: SAFE_USER_FIELDS });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: adminUserId,
    action: ACTIVITY_ACTIONS.ADMIN_UPDATE_USER_QUOTA,
    resource: targetUserId,
  });

  logger.info('Admin updated user storage quota', { adminUserId, targetUserId, quotaBytes });
  return updated;
}

/**
 * Deletes every S3 object under a user's storage prefixes using batched
 * DeleteObjects calls (up to 1000 keys per request) rather than one API call
 * per file — the S3-side equivalent of avoiding N+1.
 */
async function deleteAllUserObjects(userId: string): Promise<void> {
  if (!s3Client || !s3BucketName) return;

  for (const prefix of [`uploads/${userId}/`, `notes/${userId}/`]) {
    let continuationToken: string | undefined;
    do {
      const listResp = await s3Client.send(
        new ListObjectsV2Command({ Bucket: s3BucketName, Prefix: prefix, ContinuationToken: continuationToken })
      );
      const keys = (listResp.Contents || []).map((obj) => ({ Key: obj.Key! })).filter((o) => o.Key);
      if (keys.length > 0) {
        await s3Client.send(new DeleteObjectsCommand({ Bucket: s3BucketName, Delete: { Objects: keys, Quiet: true } }));
      }
      continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
    } while (continuationToken);
  }
}

export async function deleteUserAndData(adminUserId: string, targetUserId: string) {
  const target = await getTargetUser(targetUserId);
  assertNotSuperAdmin(target);

  // storage_items/refresh_tokens/activity_logs all cascade-delete via their FK
  // (ON DELETE CASCADE / SET NULL) once the user row itself is removed.
  await deleteAllUserObjects(targetUserId);
  await commonDao.deleteDataByCond(TABLES.USERS, { id: targetUserId });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: adminUserId,
    action: ACTIVITY_ACTIONS.ADMIN_DELETE_USER,
    resource: targetUserId,
  });

  logger.warn('Admin deleted a user account and all associated storage', { adminUserId, targetUserId, email: target.email });

  sendAccountDeletedEmail(target.email, target.name || target.email);
}

export async function adminChangeUserPassword(adminUserId: string, targetUserId: string, newPassword: string) {
  const target = await getTargetUser(targetUserId);
  assertNotSuperAdmin(target);

  const passwordHash = await hashPassword(newPassword);

  await commonDao.updateData(TABLES.USERS, { password_hash: passwordHash }, { id: targetUserId });
  // Same "kill everything now" pattern as the self-service changePassword — a forced
  // reset should invalidate any session an attacker (the reason for the reset) might
  // already hold, not just block future logins with the old password.
  await commonDao.updateData(TABLES.REFRESH_TOKENS, { revoked: true }, { user_id: targetUserId });

  await commonDao.addData(TABLES.ACTIVITY_LOGS, {
    user_id: adminUserId,
    action: ACTIVITY_ACTIONS.ADMIN_CHANGE_USER_PASSWORD,
    resource: targetUserId,
  });

  await revokeUserSessions(targetUserId);
  logger.info('Superadmin changed password for user', { adminUserId, targetUserId });

  sendPasswordChangedEmail(target.email, target.name || target.email);
}
