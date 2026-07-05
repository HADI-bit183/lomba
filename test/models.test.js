const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../database/errors');
const { createChatHistoryModel } = require('../models/chat-history');
const { createRegistrationModel } = require('../models/registration');
const {
  createUserModel,
  createUserUpdateModel,
  toPublicUser
} = require('../models/user');
const { hashPassword } = require('../services/password-service');

test('user model normalizes public registration data', () => {
  const user = createUserModel({
    fullname: '  Sari Inovator  ',
    email: 'SARI@EXAMPLE.COM',
    role: 'participant'
  });

  assert.deepEqual(user, {
    avatar: null,
    email: 'sari@example.com',
    fullname: 'Sari Inovator',
    role: 'participant'
  });
});

test('public user never includes password_hash', () => {
  const output = toPublicUser({
    id: 'user-id',
    fullname: 'Sari',
    email: 'sari@example.com',
    password_hash: 'secret',
    avatar: null,
    role: 'participant',
    created_at: '2026-07-05T00:00:00Z'
  });

  assert.equal(output.password_hash, undefined);
});

test('registration model accepts only known competition categories', () => {
  assert.throws(
    () => createRegistrationModel({
      category: 'unknown',
      faculty: 'Engineering',
      phone: '081234567890',
      teamName: 'Nova',
      university: 'Universitas Indonesia'
    }, 'user-id'),
    AppError
  );
});

test('chat history model requires a prompt and response', () => {
  assert.throws(
    () => createChatHistoryModel({
      prompt: '',
      response: 'Answer',
      visitorId: 'visitor-id'
    }),
    AppError
  );
});

test('password service hashes supplied passwords and permits absent passwords', async () => {
  assert.equal(await hashPassword(undefined), null);
  const hash = await hashPassword('correct horse battery staple');
  assert.match(hash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(hash.includes('correct horse'), false);
});

test('user update model supports partial updates', () => {
  assert.deepEqual(
    createUserUpdateModel({ fullname: '  Nama Baru  ' }),
    {
      hasPassword: false,
      update: { fullname: 'Nama Baru' }
    }
  );
});

test('user update model rejects role changes and empty updates', () => {
  assert.throws(() => createUserUpdateModel({ role: 'admin' }), AppError);
  assert.throws(() => createUserUpdateModel({}), AppError);
  assert.throws(() => createUserUpdateModel({ password: null }), AppError);
});
