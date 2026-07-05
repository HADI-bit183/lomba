const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../config/env');

async function migrate() {
  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL wajib diisi untuk migrasi. Ambil connection string PostgreSQL dari Supabase.'
    );
  }

  const schemaPath = path.join(env.ROOT, 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: env.databaseSsl ? { rejectUnauthorized: false } : false
  });

  await client.connect();
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
    console.log('Database migration completed.');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(error => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});
