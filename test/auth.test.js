const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../database/errors');
const {
  setAuthSession,
  toPublicSession
} = require('../services/auth-session-service');
const {
  validateLogin,
  validateRegister
} = require('../validators/auth-validator');

class CookieResponse {
  constructor() {
    this.headers = {};
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
}

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  expires_at: 123456,
  token_type: 'bearer'
};

test('register and login validators normalize credentials', () => {
  assert.deepEqual(
    validateRegister({
      email: ' USER@EXAMPLE.COM ',
      fullname: ' Nova User ',
      password: 'strong-password',
      remember: true
    }),
    {
      email: 'user@example.com',
      fullname: 'Nova User',
      password: 'strong-password',
      remember: true
    }
  );
  assert.equal(
    validateLogin({
      email: 'user@example.com',
      password: 'strong-password'
    }).remember,
    false
  );
});

test('auth validators reject weak passwords and invalid remember values', () => {
  assert.throws(
    () => validateLogin({
      email: 'user@example.com',
      password: 'short'
    }),
    AppError
  );
  assert.throws(
    () => validateLogin({
      email: 'user@example.com',
      password: 'strong-password',
      remember: 'yes'
    }),
    AppError
  );
});

test('remember login creates persistent HttpOnly cookies', () => {
  const response = new CookieResponse();
  setAuthSession(response, session, true);
  const cookies = response.getHeader('set-cookie');

  assert.equal(cookies.length, 3);
  assert.equal(cookies.every(cookie => cookie.includes('HttpOnly')), true);
  assert.equal(cookies.every(cookie => cookie.includes('SameSite=Lax')), true);
  assert.equal(cookies.every(cookie => cookie.includes('Max-Age=')), true);
});

test('non-remembered login creates browser-session cookies', () => {
  const response = new CookieResponse();
  setAuthSession(response, session, false);
  const cookies = response.getHeader('set-cookie');

  assert.equal(cookies.length, 3);
  assert.equal(cookies.every(cookie => !cookie.includes('Max-Age=')), true);
  assert.deepEqual(toPublicSession(session, false), {
    expiresAt: 123456,
    remember: false,
    tokenType: 'bearer'
  });
});
