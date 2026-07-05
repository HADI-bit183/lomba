const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { routeApiRequest, routes } = require('../routes/api-router');

class MockResponse {
  constructor() {
    this.headers = {};
    this.statusCode = null;
    this.body = '';
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    Object.entries(headers).forEach(([name, value]) => this.setHeader(name, value));
  }

  end(body = '') {
    this.body += body;
  }
}

function createRequest(method, body) {
  const request = Readable.from(
    body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  );
  request.method = method;
  request.headers = {};
  request.socket = { remoteAddress: '127.0.0.1' };
  return request;
}

function hasRoute(method, pathname) {
  return routes.some(route => route.method === method && route.pattern.test(pathname));
}

test('router exposes all required CRUD endpoints', () => {
  const userId = '123e4567-e89b-42d3-a456-426614174000';
  const chatId = '123e4567-e89b-42d3-a456-426614174001';

  assert.equal(hasRoute('POST', '/api/users'), true);
  assert.equal(hasRoute('GET', `/api/users/${userId}`), true);
  assert.equal(hasRoute('PUT', `/api/users/${userId}`), true);
  assert.equal(hasRoute('DELETE', `/api/users/${userId}`), true);
  assert.equal(hasRoute('POST', '/api/chat'), true);
  assert.equal(hasRoute('GET', '/api/chat/history'), true);
  assert.equal(hasRoute('DELETE', '/api/chat/history'), true);
  assert.equal(hasRoute('DELETE', `/api/chat/${chatId}`), true);
  assert.equal(hasRoute('GET', '/api/users/profile'), true);
  assert.equal(hasRoute('PUT', '/api/users/profile'), true);
  assert.equal(hasRoute('POST', '/api/auth/register'), true);
  assert.equal(hasRoute('POST', '/api/auth/login'), true);
  assert.equal(hasRoute('POST', '/api/auth/logout'), true);
  assert.equal(hasRoute('GET', '/api/auth/me'), true);
  assert.equal(hasRoute('POST', '/api/auth/verify-email'), true);
  assert.equal(hasRoute('POST', '/api/auth/forgot-password'), true);
  assert.equal(hasRoute('POST', '/api/auth/verify-recovery'), true);
  assert.equal(hasRoute('POST', '/api/auth/reset-password'), true);
  assert.equal(hasRoute('GET', '/api/health'), true);
  assert.equal(hasRoute('GET', '/api/ready'), true);
  assert.equal(hasRoute('GET', '/api/docs'), true);
  assert.equal(hasRoute('GET', '/api/admin/statistics'), true);
  assert.equal(hasRoute('GET', '/api/admin/users'), true);
  assert.equal(hasRoute('GET', '/api/admin/chats'), true);
  assert.equal(hasRoute('GET', '/api/achievements'), true);
  assert.equal(hasRoute('POST', '/api/achievements/check'), true);
  assert.equal(hasRoute('GET', '/api/users/statistics'), true);
});

test('router returns 405 and Allow for unsupported methods', async () => {
  const response = new MockResponse();
  const handled = await routeApiRequest(
    createRequest('PATCH'),
    response,
    new URL('http://localhost/api/users/123e4567-e89b-42d3-a456-426614174000')
  );

  assert.equal(handled, true);
  assert.equal(response.statusCode, 405);
  assert.match(response.headers.allow, /GET/);
  assert.match(response.headers.allow, /PUT/);
  assert.match(response.headers.allow, /DELETE/);
});

test('router returns 404 for unknown API paths', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('GET'),
    response,
    new URL('http://localhost/api/unknown')
  );

  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).code, 'NOT_FOUND');
});

test('protected user routes reject unauthenticated requests', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('GET'),
    response,
    new URL('http://localhost/api/users/not-a-uuid')
  );

  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).code, 'UNAUTHORIZED');
});

test('create user validates request body before database access', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('POST', { fullname: 'A', email: 'invalid' }),
    response,
    new URL('http://localhost/api/users')
  );

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).code, 'VALIDATION_ERROR');
});

test('chat creation and history require authentication', async () => {
  for (const [method, path, body] of [
    ['POST', '/api/chat', { prompt: '', response: 'Jawaban' }],
    ['GET', '/api/chat/history'],
    ['DELETE', '/api/chat/history']
  ]) {
    const response = new MockResponse();
    await routeApiRequest(
      createRequest(method, body),
      response,
      new URL(`http://localhost${path}`)
    );

    assert.equal(response.statusCode, 401);
    assert.equal(JSON.parse(response.body).code, 'UNAUTHORIZED');
  }
});

test('profile endpoints require authentication', async () => {
  for (const [method, body] of [
    ['GET'],
    ['PUT', { fullname: 'Updated User' }]
  ]) {
    const response = new MockResponse();
    await routeApiRequest(
      createRequest(method, body),
      response,
      new URL('http://localhost/api/users/profile')
    );

    assert.equal(response.statusCode, 401);
    assert.equal(JSON.parse(response.body).code, 'UNAUTHORIZED');
  }
});

test('chat model validates prompt and response before database access', async () => {
  const { saveChat } = require('../services/chat-history-service');
  await assert.rejects(
    () => saveChat({
      prompt: '',
      response: 'Jawaban',
      userId: '123e4567-e89b-42d3-a456-426614174000',
      visitorId: '123e4567-e89b-42d3-a456-426614174001'
    }),
    error => error.code === 'VALIDATION_ERROR'
  );
});

test('auth me and reset password require authentication', async () => {
  for (const [method, path, body] of [
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/reset-password', { password: 'new-password-123' }]
  ]) {
    const response = new MockResponse();
    await routeApiRequest(
      createRequest(method, body),
      response,
      new URL(`http://localhost${path}`)
    );
    assert.equal(response.statusCode, 401);
    assert.equal(JSON.parse(response.body).code, 'UNAUTHORIZED');
  }
});

test('auth register validates credentials before Supabase access', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('POST', {
      email: 'invalid',
      fullname: 'Nova User',
      password: 'short'
    }),
    response,
    new URL('http://localhost/api/auth/register')
  );

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).code, 'VALIDATION_ERROR');
});

test('logout is idempotent and clears auth cookies', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('POST'),
    response,
    new URL('http://localhost/api/auth/logout')
  );

  assert.equal(response.statusCode, 204);
  assert.equal(Array.isArray(response.headers['set-cookie']), true);
  assert.equal(response.headers['set-cookie'].length, 3);
});

test('API docs are public OpenAPI JSON', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('GET'),
    response,
    new URL('http://localhost/api/docs')
  );

  const document = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(document.openapi, '3.0.3');
  assert.ok(document.paths['/api/admin/statistics']);
  assert.ok(document.paths['/api/achievements']);
  assert.ok(document.paths['/api/users/statistics']);
});

test('admin, achievement, and statistics endpoints require authentication', async () => {
  for (const path of [
    '/api/admin/statistics',
    '/api/admin/users',
    '/api/admin/chats',
    '/api/achievements',
    '/api/users/statistics'
  ]) {
    const response = new MockResponse();
    await routeApiRequest(
      createRequest('GET'),
      response,
      new URL(`http://localhost${path}`)
    );
    assert.equal(response.statusCode, 401);
    assert.equal(JSON.parse(response.body).code, 'UNAUTHORIZED');
  }
});
