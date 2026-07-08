const env = require('../config/env');
const {
  getDatabase,
  isAuthConfigured,
  isDatabaseConfigured
} = require('../config/database');
const { sendJson } = require('../http/http-utils');

function read(request, response) {
  sendJson(response, 200, {
    status: 'ok',
    aiConfigured: Boolean(env.geminiApiKey),
    authConfigured: isAuthConfigured(),
    databaseConfigured: isDatabaseConfigured(),
    model: env.geminiModel
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      const timer = setTimeout(
        () => resolve({ error: new Error('TIMEOUT') }),
        timeoutMs
      );
      timer.unref?.();
    })
  ]);
}

async function readiness(request, response) {
  const checks = {
    auth: false,
    database: false
  };

  if (isDatabaseConfigured()) {
    const databaseResults = await withTimeout(
      Promise.all([
        getDatabase()
          .from('users')
          .select('id,last_login_at,total_chat,total_login', { head: true }),
        getDatabase()
          .from('achievements')
          .select('id,code,name,description', { head: true }),
        getDatabase()
          .from('user_achievements')
          .select('id,user_id,achievement_id,earned_at', { head: true }),
        getDatabase().rpc('get_admin_statistics')
      ]),
      5000
    );
    checks.database = Array.isArray(databaseResults) &&
      databaseResults.every(result => !result.error);
  }

  if (isAuthConfigured()) {
    try {
      const authResponse = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
        headers: { apikey: env.supabaseAnonKey },
        signal: AbortSignal.timeout(5000)
      });
      checks.auth = authResponse.ok;
    } catch {
      checks.auth = false;
    }
  }

  const ready = checks.auth && checks.database;
  sendJson(response, ready ? 200 : 503, {
    status: ready ? 'ready' : 'not_ready',
    checks,
    aiConfigured: Boolean(env.geminiApiKey)
  });
}

module.exports = {
  read,
  readiness
};
