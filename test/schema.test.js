const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schema = fs.readFileSync(
  path.resolve(__dirname, '..', 'database', 'schema.sql'),
  'utf8'
);

test('schema defines achievement tables and all automatic badges', () => {
  assert.match(schema, /create table if not exists public\.achievements/i);
  assert.match(schema, /create table if not exists public\.user_achievements/i);
  [
    'First Chat',
    '10 Chats',
    '50 Chats',
    'First Login',
    'Active Learner'
  ].forEach(name => assert.match(schema, new RegExp(name, 'i')));
});

test('schema defines statistics and automatic award functions', () => {
  assert.match(schema, /check_user_achievements/);
  assert.match(schema, /get_user_daily_activity/);
  assert.match(schema, /get_admin_statistics/);
  assert.match(schema, /record_user_login/);
});
