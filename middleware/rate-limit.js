const { AppError } = require('../database/errors');
const env = require('../config/env');
const logger = require('../utils/logger');

const rateLimits = new Map();

function getClientId(request) {
  const useProxy = process.env.TRUST_PROXY === 'true';
  const forwarded = useProxy ? request.headers['x-forwarded-for'] : null;
  return String(forwarded || request.socket.remoteAddress || 'local')
    .split(',')[0]
    .trim();
}

function getRateLimitConfig() {
  return {
    limit: Number.isSafeInteger(env.rateLimitMax) && env.rateLimitMax > 0
      ? env.rateLimitMax
      : 20,
    windowMs: Number.isSafeInteger(env.rateLimitWindowMs) && env.rateLimitWindowMs > 0
      ? env.rateLimitWindowMs
      : 60_000
  };
}

function throwRateLimited() {
  throw new AppError(
    'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
    429,
    'RATE_LIMITED'
  );
}

function assertMemoryRateLimit(clientId, now = Date.now()) {
  const { limit, windowMs } = getRateLimitConfig();
  const current = rateLimits.get(clientId);

  if (!current || now - current.startedAt >= windowMs) {
    rateLimits.set(clientId, { count: 1, startedAt: now });
    cleanupExpiredMemoryLimits(now, windowMs);
    return;
  }

  current.count += 1;
  if (current.count > limit) throwRateLimited();
}

function cleanupExpiredMemoryLimits(now, windowMs) {
  if (rateLimits.size < 1000) return;
  for (const [clientId, bucket] of rateLimits.entries()) {
    if (now - bucket.startedAt >= windowMs) {
      rateLimits.delete(clientId);
    }
  }
}

async function incrementRedisRateLimit(clientId) {
  const { limit, windowMs } = getRateLimitConfig();
  const redisUrl = env.redisRestUrl.replace(/\/+$/, '');
  const windowId = Math.floor(Date.now() / windowMs);
  const key = `novamind:rate-limit:${clientId}:${windowId}`;
  const response = await fetch(`${redisUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.redisRestToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, String(windowMs), 'NX']
    ])
  });

  if (!response.ok) {
    throw new Error(`Redis rate limit request failed with ${response.status}`);
  }

  const payload = await response.json();
  const count = Number(payload?.[0]?.result ?? payload?.[0]);
  if (!Number.isFinite(count)) {
    throw new Error('Redis rate limit response did not include a counter.');
  }
  if (count > limit) throwRateLimited();
}

async function assertNotRateLimited(request) {
  const clientId = getClientId(request);

  if (env.redisRestUrl && env.redisRestToken) {
    try {
      await incrementRedisRateLimit(clientId);
      return;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn('Redis rate limiter unavailable; falling back to in-memory limiter.', {
        error: error.message
      });
    }
  }

  assertMemoryRateLimit(clientId);
}

module.exports = {
  assertMemoryRateLimit,
  assertNotRateLimited,
  getClientId,
  getRateLimitConfig
};
