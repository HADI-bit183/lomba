const crypto = require('crypto');
const env = require('../config/env');
const {
  appendSetCookie,
  parseCookies,
  serializeCookie
} = require('./cookie-service');

const COOKIE_NAME = 'novamind_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
const processSecret = crypto.randomBytes(32).toString('hex');

function getSecret() {
  return env.sessionSecret || processSecret;
}

function sign(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value || '');
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');

  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!isUuid(payload.visitorId)) return null;
    return {
      userId: isUuid(payload.userId) ? payload.userId : null,
      visitorId: payload.visitorId
    };
  } catch {
    return null;
  }
}

function setSessionCookie(response, session) {
  appendSetCookie(response, serializeCookie(COOKIE_NAME, sign(session), {
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === 'production'
  }));
}

function getOrCreateSession(request, response) {
  const session = verify(parseCookies(request)[COOKIE_NAME]) || {
    userId: null,
    visitorId: crypto.randomUUID()
  };
  setSessionCookie(response, session);
  return session;
}

function attachUser(response, session, userId) {
  const updatedSession = { ...session, userId };
  setSessionCookie(response, updatedSession);
  return updatedSession;
}

module.exports = {
  attachUser,
  getOrCreateSession,
  parseCookies
};
