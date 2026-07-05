function parseCookies(request) {
  return String(request.headers.cookie || '')
    .split(';')
    .map(value => value.trim().split('='))
    .reduce((cookies, [key, ...value]) => {
      if (key) {
        try {
          cookies[key] = decodeURIComponent(value.join('='));
        } catch {
          cookies[key] = '';
        }
      }
      return cookies;
    }, {});
}

function appendSetCookie(response, cookie) {
  const existing = typeof response.getHeader === 'function'
    ? response.getHeader('Set-Cookie')
    : response.headers?.['set-cookie'];
  const cookies = existing
    ? (Array.isArray(existing) ? existing : [existing])
    : [];
  response.setHeader('Set-Cookie', [...cookies, cookie]);
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  if (options.secure) parts.push('Secure');
  if (Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  return parts.join('; ');
}

module.exports = {
  appendSetCookie,
  parseCookies,
  serializeCookie
};
