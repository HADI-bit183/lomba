const test = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenError, UnauthorizedError } = require('../database/errors');
const { requireAdmin } = require('../middleware/admin');

test('admin middleware allows only admin profiles', () => {
  assert.doesNotThrow(() => requireAdmin({
    auth: { profile: { user: { role: 'admin' } } }
  }));
  assert.throws(
    () => requireAdmin({
      auth: { profile: { user: { role: 'participant' } } }
    }),
    ForbiddenError
  );
  assert.throws(() => requireAdmin({ auth: null }), UnauthorizedError);
});
