const { AppError } = require('../database/errors');
const {
  appendSetCookie,
  parseCookies,
  serializeCookie
} = require('./cookie-service');

const ACCESS_COOKIE = 'novamind_access_token';
const REFRESH_COOKIE = 'novamind_refresh_token';
const REMEMBER_COOKIE = 'novamind_remember';
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

function isSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

function readAuthSession(request) {
  const cookies = parseCookies(request);
  const authorization = String(request.headers.authorization || '');
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';

  return {
    accessToken: bearer || cookies[ACCESS_COOKIE] || '',
    refreshToken: cookies[REFRESH_COOKIE] || '',
    remember: cookies[REMEMBER_COOKIE] === '1',
    source: bearer ? 'bearer' : 'cookie'
  };
}

function setAuthSession(response, session, remember) {
  if (!session?.access_token || !session?.refresh_token) {
    throw new AppError('Sesi Supabase tidak valid.', 500, 'INVALID_AUTH_SESSION');
  }

  const persistent = remember
    ? { maxAge: REMEMBER_MAX_AGE }
    : {};
  const accessOptions = remember
    ? { maxAge: Math.min(session.expires_in || 3600, REMEMBER_MAX_AGE) }
    : {};
  const shared = { secure: isSecureCookie() };

  appendSetCookie(
    response,
    serializeCookie(ACCESS_COOKIE, session.access_token, {
      ...shared,
      ...accessOptions
    })
  );
  appendSetCookie(
    response,
    serializeCookie(REFRESH_COOKIE, session.refresh_token, {
      ...shared,
      ...persistent
    })
  );
  appendSetCookie(
    response,
    serializeCookie(REMEMBER_COOKIE, remember ? '1' : '0', {
      ...shared,
      ...persistent
    })
  );
}

function clearAuthSession(response) {
  const expired = {
    expires: new Date(0),
    maxAge: 0,
    secure: isSecureCookie()
  };
  [ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE].forEach(name => {
    appendSetCookie(response, serializeCookie(name, '', expired));
  });
}

function toPublicSession(session, remember) {
  if (!session) return null;
  return {
    expiresAt: session.expires_at || null,
    remember: Boolean(remember),
    tokenType: session.token_type || 'bearer'
  };
}

module.exports = {
  clearAuthSession,
  readAuthSession,
  setAuthSession,
  toPublicSession
};
