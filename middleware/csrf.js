const crypto = require('crypto');
const { AppError } = require('../database/errors');
const { appendSetCookie, parseCookies, serializeCookie } = require('../services/cookie-service');

const CSRF_COOKIE_NAME = 'novamind_csrf_secret';

function getCsrfToken(req, res) {
  const cookies = parseCookies(req);
  let secret = cookies[CSRF_COOKIE_NAME];
  
  if (!secret) {
    secret = crypto.randomUUID();
    const secure = process.env.NODE_ENV === 'production';
    const cookieStr = serializeCookie(CSRF_COOKIE_NAME, secret, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: secure,
      path: '/'
    });
    appendSetCookie(res, cookieStr);
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, token: secret }));
}

function csrfMiddleware(req, res) {
  // Bypass khusus untuk automated tests
  if (process.env.NODE_ENV === 'test') return;

  // Hanya validasi mutasi
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  
  const cookies = parseCookies(req);
  const secret = cookies[CSRF_COOKIE_NAME];
  const token = req.headers['x-csrf-token'];
  
  if (!secret || !token || secret !== token) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Invalid CSRF Token' }));
    return Promise.reject(new AppError('Invalid CSRF Token', 403, 'CSRF_ERROR'));
  }
}

module.exports = {
  getCsrfToken,
  csrfMiddleware
};
