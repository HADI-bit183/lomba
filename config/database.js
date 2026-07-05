const { createClient } = require('@supabase/supabase-js');
const env = require('./env');
const { AppError } = require('../database/errors');

let client;

class DatabaseConfigurationError extends AppError {
  constructor() {
    super(
      'Supabase belum dikonfigurasi. Isi SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY di .env.local.',
      503,
      'DATABASE_NOT_CONFIGURED'
    );
    this.name = 'DatabaseConfigurationError';
  }
}

function isDatabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

function isAuthConfigured() {
  return Boolean(
    env.supabaseUrl &&
    env.supabaseAnonKey &&
    env.supabaseServiceRoleKey
  );
}

function getDatabase() {
  if (!isDatabaseConfigured()) {
    throw new DatabaseConfigurationError();
  }

  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      db: { schema: 'public' }
    });
  }

  return client;
}

function createAuthClient() {
  if (!isAuthConfigured()) {
    throw new DatabaseConfigurationError();
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

module.exports = {
  createAuthClient,
  DatabaseConfigurationError,
  getDatabase,
  isAuthConfigured,
  isDatabaseConfigured
};
