const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildContentSecurityPolicy,
  setSecurityHeaders
} = require('../http/http-utils');

class MockResponse {
  constructor() {
    this.headers = {};
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
}

test('security headers include CSP protections', () => {
  const response = new MockResponse();

  setSecurityHeaders(response);

  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.equal(response.headers['permissions-policy'], 'camera=(), microphone=(), geolocation=()');
  assert.match(response.headers['content-security-policy'], /default-src 'self'/);
  assert.match(response.headers['content-security-policy'], /object-src 'none'/);
  assert.match(response.headers['content-security-policy'], /frame-ancestors 'self'/);
});

test('CSP allows current frontend asset origins without allowing object embeds', () => {
  const policy = buildContentSecurityPolicy();

  assert.match(policy, /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(policy, /https:\/\/fonts\.googleapis\.com/);
  assert.match(policy, /img-src 'self' data: blob: https:/);
  assert.doesNotMatch(policy, /object-src \*/);
});
