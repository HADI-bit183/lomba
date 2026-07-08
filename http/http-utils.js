const { AppError } = require('../database/errors');
const env = require('../config/env');

const MAX_BODY_BYTES = 24 * 1024;

function buildContentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://*.googleapis.com",
    "worker-src 'self'",
    "manifest-src 'self'"
  ];

  if (env.nodeEnv === 'production') {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Content-Security-Policy', buildContentSecurityPolicy());
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (env.nodeEnv === 'production') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  setSecurityHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  response.end(body);
}

function sendNoContent(response) {
  setSecurityHeaders(response);
  response.writeHead(204, { 'Cache-Control': 'no-store' });
  response.end();
}

function sendError(response, error, fallbackMessage = 'Terjadi kesalahan pada server.') {
  const statusCode = Number(error?.statusCode) || 500;
  if (statusCode >= 500) {
    console.error(error?.message || fallbackMessage);
  }
  sendJson(response, statusCode, {
    error: statusCode >= 500 && !(error instanceof AppError)
      ? fallbackMessage
      : error.message,
    code: error?.code || 'INTERNAL_ERROR'
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let settled = false;
    const chunks = [];

    request.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        reject(new AppError('Payload terlalu besar.', 413, 'PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (settled) return;
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('INVALID_JSON');
        }
        resolve(parsed);
      } catch {
        reject(new AppError('Format JSON tidak valid.', 400, 'INVALID_JSON'));
      }
    });

    request.on('error', error => {
      if (!settled) reject(error);
    });
  });
}

module.exports = {
  buildContentSecurityPolicy,
  readJsonBody,
  sendError,
  sendJson,
  sendNoContent,
  setSecurityHeaders
};
