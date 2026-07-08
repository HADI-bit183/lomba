const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const env = require('../config/env');
const {
  assertMemoryRateLimit,
  assertNotRateLimited,
  getClientId
} = require('../middleware/rate-limit');

function createRequest(remoteAddress = '127.0.0.1', headers = {}) {
  const request = Readable.from([]);
  request.headers = headers;
  request.socket = { remoteAddress };
  return request;
}

test('memory rate limiter blocks requests over the configured limit', () => {
  const originalLimit = env.rateLimitMax;
  const originalWindow = env.rateLimitWindowMs;
  env.rateLimitMax = 2;
  env.rateLimitWindowMs = 60_000;
  const clientId = `test-memory-${Date.now()}`;

  try {
    assertMemoryRateLimit(clientId, 1_000);
    assertMemoryRateLimit(clientId, 1_001);
    assert.throws(
      () => assertMemoryRateLimit(clientId, 1_002),
      error => error.code === 'RATE_LIMITED'
    );
  } finally {
    env.rateLimitMax = originalLimit;
    env.rateLimitWindowMs = originalWindow;
  }
});

test('rate limiter can use Redis REST counters', async () => {
  const originalFetch = global.fetch;
  const originalUrl = env.redisRestUrl;
  const originalToken = env.redisRestToken;
  const originalLimit = env.rateLimitMax;
  env.redisRestUrl = 'https://redis.example';
  env.redisRestToken = 'token';
  env.rateLimitMax = 2;
  let requestBody;

  global.fetch = async (url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }]
    };
  };

  try {
    await assertNotRateLimited(createRequest('192.0.2.10'));
    assert.equal(requestBody[0][0], 'INCR');
    assert.equal(requestBody[1][0], 'PEXPIRE');
  } finally {
    global.fetch = originalFetch;
    env.redisRestUrl = originalUrl;
    env.redisRestToken = originalToken;
    env.rateLimitMax = originalLimit;
  }
});

test('client id honors x-forwarded-for only when TRUST_PROXY is enabled', () => {
  const originalTrustProxy = process.env.TRUST_PROXY;
  const request = createRequest('10.0.0.1', {
    'x-forwarded-for': '203.0.113.9, 10.0.0.1'
  });

  try {
    delete process.env.TRUST_PROXY;
    assert.equal(getClientId(request), '10.0.0.1');
    process.env.TRUST_PROXY = 'true';
    assert.equal(getClientId(request), '203.0.113.9');
  } finally {
    if (originalTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = originalTrustProxy;
    }
  }
});
