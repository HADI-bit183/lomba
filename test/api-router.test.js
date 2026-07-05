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
  assert.equal(hasRoute('DELETE', `/api/chat/${chatId}`), true);
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

test('user ID route rejects malformed UUIDs before database access', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('GET'),
    response,
    new URL('http://localhost/api/users/not-a-uuid')
  );

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).code, 'VALIDATION_ERROR');
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

test('direct chat creation validates prompt and response before database access', async () => {
  const response = new MockResponse();
  await routeApiRequest(
    createRequest('POST', { prompt: '', response: 'Jawaban' }),
    response,
    new URL('http://localhost/api/chat')
  );

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).code, 'VALIDATION_ERROR');
});
