const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { listMigrationFiles } = require('../scripts/migrate');

test('migration files are discovered in version order', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'novamind-migrations-'));
  fs.writeFileSync(path.join(dir, '002_add_column.sql'), 'select 2;');
  fs.writeFileSync(path.join(dir, '001_initial_schema.sql'), 'select 1;');
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'ignore me');

  const migrations = listMigrationFiles(dir);

  assert.deepEqual(
    migrations.map(migration => migration.name),
    ['001_initial_schema.sql', '002_add_column.sql']
  );
});
