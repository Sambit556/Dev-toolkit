import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { commonDao } from '../repositories/commonDao';
import { TABLES } from '../repositories/migrations';
import { ACTIVITY_ACTIONS, ROLES } from '../constants/activityActions';
import { getEnv } from '../utils/env';
import { logger } from '../utils/logger';
import { HttpStatus } from '../utils/httpStatus';
import { OAUTH_EXCHANGE_TTL_SECONDS } from '../config/constants';
import { generateOAuthStateToken, verifyOAuthStateToken } from './token.service';
import { issueSession } from './auth.service';
import { stashOAuthExchange, consumeOAuthExchange } from '../utils/session';
import { sendWelcomeEmail } from './email.service';
import { updateUserGeoAndIp } from './geo.service';
import { getRequestIp } from '../utils/context';

interface OAuthExchangePayload {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string | null; role: string; mobile_number: string | null };
}

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

function getRedirectUri(): string {
  const uri = getEnv('GOOGLE_OAUTH_REDIRECT_URI');
  if (!uri) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'Google OAuth is not configured', 'OAUTH_CONFIG_ERROR');
  return uri;
}

export function buildGoogleAuthUrl(): string {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  if (!clientId) throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'Google OAuth is not configured', 'OAUTH_CONFIG_ERROR');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: generateOAuthStateToken(),
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

async function exchangeCodeForGoogleTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'Google OAuth is not configured', 'OAUTH_CONFIG_ERROR');
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    logger.error('Google token exchange failed', { status: res.status, body: await res.text().catch(() => '') });
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Failed to exchange Google authorization code', 'OAUTH_TOKEN_EXCHANGE_FAILED');
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    logger.error('Google userinfo fetch failed', { status: res.status });
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Failed to fetch Google account details', 'OAUTH_USERINFO_FAILED');
  }

  return res.json() as Promise<GoogleUserInfo>;
}

/**
 * Verifies the callback's state, exchanges the code with Google, resolves or
 * creates the local user account, issues a normal session (identical to a
 * password login), and stashes the tokens under a fresh single-use exchange
 * code — never returning raw tokens to the caller, since this is invoked from
 * a route that can only respond with a redirect (see routes/auth.ts).
 */
export async function exchangeGoogleCodeAndIssueExchange(code: string, state: string): Promise<string> {
  verifyOAuthStateToken(state);

  const tokens = await exchangeCodeForGoogleTokens(code);
  const googleUser = await fetchGoogleUserInfo(tokens.access_token);

  if (!googleUser.email_verified) {
    throw new AppError(HttpStatus.FORBIDDEN, 'Google account email is not verified', 'OAUTH_EMAIL_UNVERIFIED');
  }

  let user = await commonDao.getOneDataByCond<any>(TABLES.USERS, { google_id: googleUser.sub });
  let activityAction: string = ACTIVITY_ACTIONS.GOOGLE_LOGIN;

  if (!user) {
    // Google has already verified mailbox ownership, so linking into an existing
    // password account with the same email is safe — friendlier than forcing the
    // user to remember they signed up with a password instead.
    const existingByEmail = await commonDao.getOneDataByCond<any>(TABLES.USERS, { email: googleUser.email });
    if (existingByEmail) {
      user = await commonDao.updateData<any>(TABLES.USERS, { google_id: googleUser.sub }, { id: existingByEmail.id });
      activityAction = ACTIVITY_ACTIONS.GOOGLE_ACCOUNT_LINKED;
    } else {
      user = await commonDao.addData<any>(TABLES.USERS, {
        email: googleUser.email,
        password_hash: null,
        name: googleUser.name || null,
        role: ROLES.USER,
        google_id: googleUser.sub,
        auth_provider: 'google',
      });
      activityAction = ACTIVITY_ACTIONS.GOOGLE_REGISTER;
      sendWelcomeEmail(user.email, user.name || user.email);
    }
  }

  if (user.is_active === false) {
    throw new AppError(HttpStatus.FORBIDDEN, 'This account has been deactivated. Contact an administrator.', 'ACCOUNT_INACTIVE');
  }

  const { accessToken, refreshToken } = await issueSession(user);

  await commonDao.updateData(TABLES.USERS, { last_login: new Date() }, { id: user.id });
  await commonDao.addData(TABLES.ACTIVITY_LOGS, { user_id: user.id, action: activityAction, resource: 'auth' });
  updateUserGeoAndIp(user.id, getRequestIp());

  const exchangeCode = crypto.randomBytes(24).toString('base64url');
  const payload: OAuthExchangePayload = {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, mobile_number: user.mobile_number },
  };
  await stashOAuthExchange(exchangeCode, payload, OAUTH_EXCHANGE_TTL_SECONDS);

  logger.info('Google sign-in completed', { userId: user.id, action: activityAction });

  return exchangeCode;
}

/** Redeems a one-time exchange code, minted above, for the real session tokens. */
export async function consumeGoogleExchange(code: string): Promise<OAuthExchangePayload> {
  const payload = await consumeOAuthExchange<OAuthExchangePayload>(code);
  if (!payload) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'This sign-in link has expired or was already used. Please try again.', 'INVALID_OR_EXPIRED_EXCHANGE_CODE');
  }
  return payload;
}
