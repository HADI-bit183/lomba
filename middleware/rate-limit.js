const { AppError } = require('../database/errors');

const rateLimits = new Map();

function assertNotRateLimited(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const clientId = String(forwarded || request.socket.remoteAddress || 'local')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 20;
  const current = rateLimits.get(clientId);

  if (!current || now - current.startedAt >= windowMs) {
    rateLimits.set(clientId, { count: 1, startedAt: now });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new AppError(
      'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
      429,
      'RATE_LIMITED'
    );
  }
}

module.exports = { assertNotRateLimited };
