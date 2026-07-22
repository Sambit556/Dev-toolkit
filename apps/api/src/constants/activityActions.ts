// Central catalogue of `activity_logs.action` values. Kept as constants instead of
// scattering literal strings across routes/services so a rename or audit is one edit.
export const ACTIVITY_ACTIONS = {
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout',
  LOGOUT_ALL: 'logout_all',
  GOOGLE_LOGIN: 'google_login',
  GOOGLE_REGISTER: 'google_register',
  GOOGLE_ACCOUNT_LINKED: 'google_account_linked',
  REQUEST_PASSWORD_RESET: 'request_password_reset',
  RESET_PASSWORD_COMPLETED: 'reset_password_completed',
  PASSWORD_CHANGE: 'password_change',
  REQUEST_SUPERADMIN_PASSWORD_OTP: 'request_superadmin_password_otp',
  SUPERADMIN_PASSWORD_CHANGE_OTP: 'superadmin_password_change_otp',
  SECURITY_ALERT_TOKEN_REUSE: 'security_alert_token_reuse',

  CREATE_FOLDER: 'create_folder',
  RENAME: 'rename',
  TRASH_FOLDER: 'trash_folder',
  PERMANENT_DELETE_FOLDER: 'permanent_delete_folder',
  CREATE_NOTE: 'create_note',
  UPDATE_NOTE: 'update_note',
  TRASH_NOTE: 'trash_note',
  PERMANENT_DELETE_NOTE: 'permanent_delete_note',
  COMPLETE_UPLOAD: 'complete_upload',
  DOWNLOAD_FILE: 'download_file',
  PREVIEW_FILE: 'preview_file',
  TRASH_FILE: 'trash_file',
  PERMANENT_DELETE_FILE: 'permanent_delete_file',
  MOVE_ITEM: 'move_item',
  SHARE_FILE: 'share_file',
  TAG_ITEM: 'tag_item',
  RESTORE_ITEM: 'restore_item',
  UPLOAD_REJECTED_SECURITY_SCAN: 'upload_rejected_security_scan',

  ADMIN_DEACTIVATE_USER: 'admin_deactivate_user',
  ADMIN_ACTIVATE_USER: 'admin_activate_user',
  ADMIN_DELETE_USER: 'admin_delete_user',
  ADMIN_UPDATE_USER_QUOTA: 'admin_update_user_quota',
  ADMIN_CHANGE_USER_PASSWORD: 'admin_change_user_password',

  PROFILE_UPDATE_NAME: 'profile_update_name',
  PROFILE_UPLOAD_AVATAR: 'profile_upload_avatar',
  PROFILE_DELETE_AVATAR: 'profile_delete_avatar',
  SELF_DEACTIVATE_ACCOUNT: 'self_deactivate_account',
} as const;

export type ActivityAction = typeof ACTIVITY_ACTIONS[keyof typeof ACTIVITY_ACTIONS];

export const ROLES = {
  USER: 'user',
  SUPERADMIN: 'superadmin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
