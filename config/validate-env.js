const env = require('./env');

function validateEnvironment() {
  const missing = [];
  if (!env.supabaseUrl) missing.push('SUPABASE_URL');
  if (!env.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!env.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    missing.push('SESSION_SECRET (minimal 32 karakter)');
  }
  if (!process.env.AUTH_REDIRECT_URL) missing.push('AUTH_REDIRECT_URL');

  if (missing.length) {
    throw new Error(`CRITICAL: Konfigurasi environment belum lengkap atau tidak valid: ${missing.join(', ')}`);
  }

  const redirect = new URL(env.authRedirectUrl);
  if (env.nodeEnv === 'production' && redirect.protocol !== 'https:' && redirect.hostname !== 'localhost') {
    throw new Error('CRITICAL: AUTH_REDIRECT_URL harus menggunakan HTTPS di production.');
  }

  if (!env.geminiApiKey) {
    console.warn('WARNING: GEMINI_API_KEY belum diisi; fitur AI assistant akan nonaktif. Server tetap berjalan tanpa AI.');
  }
}

module.exports = { validateEnvironment };
