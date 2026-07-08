const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../config/env');

const MIGRATIONS_TABLE = 'public.schema_migrations';

function listMigrationFiles(migrationsDir = path.join(env.ROOT, 'database', 'migrations')) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory not found: ${migrationsDir}`);
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => /^\d{3,}_[a-z0-9_]+\.sql$/i.test(file))
    .sort((left, right) => left.localeCompare(right))
    .map(file => ({
      name: file,
      path: path.join(migrationsDir, file)
    }));
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists ${MIGRATIONS_TABLE} (
      id bigserial primary key,
      name text not null unique,
      applied_at timestamptz not null default now()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(`select name from ${MIGRATIONS_TABLE}`);
  return new Set(result.rows.map(row => row.name));
}

async function migrate() {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL wajib diisi untuk migrasi. Ambil connection string PostgreSQL dari Supabase.'
    );
  }

  const migrations = listMigrationFiles();
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: env.databaseSsl ? { rejectUnauthorized: false } : false
  });

  await client.connect();
  try {
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock($1)', [812_026_001]);
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const pending = migrations.filter(migration => !applied.has(migration.name));

    for (const migration of pending) {
      const sql = fs.readFileSync(migration.path, 'utf8');
      await client.query(sql);
      await client.query(
        `insert into ${MIGRATIONS_TABLE} (name) values ($1)`,
        [migration.name]
      );
      console.log(`Applied migration: ${migration.name}`);
    }

    await client.query('commit');
    console.log(`Database migration completed. ${pending.length} migration(s) applied.`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate().catch(error => {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  listMigrationFiles,
  migrate
};
