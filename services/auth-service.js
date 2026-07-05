const env = require('../config/env');
const {
  createAuthClient,
  getDatabase
} = require('../config/database');
const { AppError } = require('../database/errors');
const {
  ensureAuthProfile,
  recordLastLogin
} = require('./user-service');

function throwAuthError(error, fallbackMessage) {
  if (!error) return;
  const code = error.code || 'AUTH_ERROR';
  const statuses = {
    bad_jwt: 401,
    email_not_confirmed: 403,
    email_exists: 409,
    invalid_credentials: 401,
    invalid_token: 401,
    over_email_send_rate_limit: 429,
    over_request_rate_limit: 429,
    refresh_token_already_used: 401,
    refresh_token_not_found: 401,
    session_not_found: 401,
    same_password: 400,
    signup_disabled: 403,
    user_already_exists: 409,
    user_not_found: 401,
    weak_password: 400
  };
  const messages = {
    bad_jwt: 'Sesi tidak valid.',
    email_not_confirmed: 'Email belum diverifikasi.',
    email_exists: 'Email sudah terdaftar.',
    invalid_credentials: 'Email atau password salah.',
    invalid_token: 'Sesi tidak valid.',
    over_email_send_rate_limit: 'Terlalu banyak email dikirim. Coba lagi nanti.',
    over_request_rate_limit: 'Terlalu banyak permintaan autentikasi.',
    refresh_token_already_used: 'Sesi sudah tidak berlaku.',
    refresh_token_not_found: 'Sesi sudah tidak berlaku.',
    session_not_found: 'Sesi sudah tidak berlaku.',
    same_password: 'Password baru harus berbeda.',
    signup_disabled: 'Pendaftaran akun sedang dinonaktifkan.',
    user_already_exists: 'Email sudah terdaftar.',
    user_not_found: 'Sesi tidak valid.',
    weak_password: 'Password belum memenuhi persyaratan keamanan.'
  };

  console.error('Supabase Auth operation failed:', code, error.message);
  throw new AppError(
    messages[code] || fallbackMessage,
    statuses[code] || (
      error.status === 429
        ? 429
        : error.status >= 500
          ? 502
          : 400
    ),
    code.toUpperCase()
  );
}

async function register({ email, fullname, password }) {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.signUp({
    email,
    password,
    options: {
      data: { fullname },
      emailRedirectTo: env.authRedirectUrl
    }
  });
  throwAuthError(error, 'Pendaftaran akun gagal.');

  if (!data.user || data.user.identities?.length === 0) {
    throw new AppError('Email sudah terdaftar.', 409, 'USER_ALREADY_EXISTS');
  }

  try {
    let profile = await ensureAuthProfile(data.user);
    if (data.session) {
      profile = await recordLastLogin(
        profile.user.id,
        data.user.last_sign_in_at || new Date().toISOString()
      );
    }
    return {
      authUser: data.user,
      emailVerificationRequired: !data.user.email_confirmed_at,
      profile,
      session: data.session
    };
  } catch (profileError) {
    const admin = getDatabase();
    const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
    if (cleanupError) {
      console.error('Auth registration rollback failed:', cleanupError.message);
    }
    throw profileError;
  }
}

async function login({ email, password }) {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  throwAuthError(error, 'Login gagal.');

  if (!data.user || !data.session) {
    throw new AppError('Supabase tidak mengembalikan sesi login.', 502, 'INVALID_AUTH_RESPONSE');
  }

  let profile = await ensureAuthProfile(data.user);
  profile = await recordLastLogin(
    profile.user.id,
    data.user.last_sign_in_at || new Date().toISOString()
  );

  return {
    authUser: data.user,
    profile,
    session: data.session
  };
}

async function getAuthUser(accessToken) {
  if (!accessToken) {
    throw new AppError('Autentikasi diperlukan.', 401, 'UNAUTHORIZED');
  }

  const auth = createAuthClient();
  const { data, error } = await auth.auth.getUser(accessToken);
  if (error || !data.user) {
    throwAuthError(error || { code: 'invalid_credentials' }, 'Sesi tidak valid.');
  }
  return data.user;
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Sesi sudah berakhir.', 401, 'UNAUTHORIZED');
  }

  const auth = createAuthClient();
  const { data, error } = await auth.auth.refreshSession({
    refresh_token: refreshToken
  });
  throwAuthError(error, 'Sesi tidak dapat diperbarui.');

  if (!data.session || !data.user) {
    throw new AppError('Sesi sudah berakhir.', 401, 'UNAUTHORIZED');
  }
  return data;
}

async function logout(accessToken) {
  if (!accessToken) return;
  const admin = getDatabase();
  const { error } = await admin.auth.admin.signOut(accessToken, 'local');
  if (error && error.status !== 401) {
    throwAuthError(error, 'Logout gagal.');
  }
}

async function verifyEmail({ email, token, tokenHash }) {
  const auth = createAuthClient();
  const credentials = tokenHash
    ? { token_hash: tokenHash, type: 'email' }
    : { email, token, type: 'email' };
  const { data, error } = await auth.auth.verifyOtp(credentials);
  throwAuthError(error, 'Verifikasi email gagal.');

  if (!data.user) {
    throw new AppError('Verifikasi email gagal.', 400, 'INVALID_VERIFICATION');
  }

  let profile = await ensureAuthProfile(data.user);
  profile = await recordLastLogin(
    profile.user.id,
    data.user.last_sign_in_at || new Date().toISOString()
  );

  return {
    authUser: data.user,
    profile,
    session: data.session
  };
}

async function verifyPasswordRecovery({ email, token, tokenHash }) {
  const auth = createAuthClient();
  const credentials = tokenHash
    ? { token_hash: tokenHash, type: 'recovery' }
    : { email, token, type: 'recovery' };
  const { data, error } = await auth.auth.verifyOtp(credentials);
  throwAuthError(error, 'Token pemulihan password tidak valid.');

  if (!data.user || !data.session) {
    throw new AppError('Token pemulihan password tidak valid.', 400, 'INVALID_RECOVERY');
  }

  return {
    authUser: data.user,
    profile: await ensureAuthProfile(data.user),
    session: data.session
  };
}

async function resendVerification(email) {
  const auth = createAuthClient();
  const { error } = await auth.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: env.authRedirectUrl }
  });
  throwAuthError(error, 'Email verifikasi tidak dapat dikirim.');
}

async function requestPasswordReset(email) {
  const auth = createAuthClient();
  const { error } = await auth.auth.resetPasswordForEmail(email, {
    redirectTo: env.authRedirectUrl
  });
  throwAuthError(error, 'Permintaan reset password gagal.');
}

async function resetPassword(authUserId, password) {
  const admin = getDatabase();
  const { data, error } = await admin.auth.admin.updateUserById(authUserId, {
    password
  });
  throwAuthError(error, 'Password tidak dapat diperbarui.');
  return data.user;
}

async function updateEmail(accessToken, refreshToken, email) {
  if (!accessToken || !refreshToken) {
    throw new AppError(
      'Sesi cookie diperlukan untuk mengubah email.',
      401,
      'SESSION_REQUIRED'
    );
  }

  const auth = createAuthClient();
  const { error: sessionError } = await auth.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  throwAuthError(sessionError, 'Sesi tidak valid.');

  const { data, error } = await auth.auth.updateUser({ email });
  throwAuthError(error, 'Email tidak dapat diperbarui.');
  return data.user;
}

async function deleteAuthUser(authUserId) {
  const admin = getDatabase();
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  throwAuthError(error, 'Akun autentikasi tidak dapat dihapus.');
}

function toPublicAuthUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_confirmed_at),
    lastSignInAt: user.last_sign_in_at || null,
    createdAt: user.created_at
  };
}

module.exports = {
  deleteAuthUser,
  getAuthUser,
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  throwAuthError,
  toPublicAuthUser,
  updateEmail,
  verifyEmail,
  verifyPasswordRecovery
};
