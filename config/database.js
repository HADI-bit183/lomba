const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let client;

class DatabaseConfigurationError extends Error {
  constructor() {
    super(
      'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.'
    );
    this.name = 'DatabaseConfigurationError';
    this.statusCode = 503;
  }
}

function isDatabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
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

module.exports = {
  DatabaseConfigurationError,
  getDatabase,
  isDatabaseConfigured
};
