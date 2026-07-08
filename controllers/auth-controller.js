const {
  readJsonBody,
  sendJson,
  sendNoContent
} = require('../http/http-utils');
const { assertNotRateLimited } = require('../middleware/rate-limit');
const {
  clearAuthSession,
  readAuthSession,
  setAuthSession,
  toPublicSession
} = require('../services/auth-session-service');
const {
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  toPublicAuthUser,
  verifyEmail,
  verifyPasswordRecovery
} = require('../services/auth-service');
const {
  validateEmail,
  validateEmailVerification,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword
} = require('../validators/auth-validator');

async function registerAccount(request, response) {
  await assertNotRateLimited(request);
  const input = validateRegister(await readJsonBody(request));
  const result = await register(input);

  if (result.session) {
    setAuthSession(response, result.session, input.remember);
  }

  response.setHeader('Location', `/api/users/${result.profile.user.id}`);
  sendJson(response, 201, {
    emailVerificationRequired: result.emailVerificationRequired,
    session: toPublicSession(result.session, input.remember),
    user: result.profile.user
  });
}

async function loginAccount(request, response) {
  await assertNotRateLimited(request);
  const input = validateLogin(await readJsonBody(request));
  const result = await login(input);
  setAuthSession(response, result.session, input.remember);
  sendJson(response, 200, {
    auth: toPublicAuthUser(result.authUser),
    session: toPublicSession(result.session, input.remember),
    user: result.profile.user
  });
}

async function logoutAccount(request, response) {
  const { accessToken } = readAuthSession(request);
  try {
    await logout(accessToken);
  } finally {
    clearAuthSession(response);
  }
  sendNoContent(response);
}

async function me(request, response) {
  sendJson(response, 200, {
    auth: toPublicAuthUser(request.auth.authUser),
    registration: request.auth.profile.registration,
    session: {
      authenticated: true,
      remember: request.auth.remember
    },
    user: request.auth.profile.user
  });
}

async function verifyEmailAddress(request, response) {
  await assertNotRateLimited(request);
  const input = validateEmailVerification(await readJsonBody(request));
  const result = await verifyEmail(input);
  if (result.session) {
    setAuthSession(response, result.session, input.remember);
  }
  sendJson(response, 200, {
    auth: toPublicAuthUser(result.authUser),
    session: toPublicSession(result.session, input.remember),
    user: result.profile.user
  });
}

async function resendEmailVerification(request, response) {
  await assertNotRateLimited(request);
  const { email } = await readJsonBody(request);
  await resendVerification(validateEmail(email));
  sendJson(response, 202, {
    message: 'Jika akun tersedia, email verifikasi akan dikirim.'
  });
}

async function verifyRecovery(request, response) {
  await assertNotRateLimited(request);
  const input = validateEmailVerification(await readJsonBody(request));
  const result = await verifyPasswordRecovery(input);
  setAuthSession(response, result.session, input.remember);
  sendJson(response, 200, {
    session: toPublicSession(result.session, input.remember),
    user: result.profile.user
  });
}

async function forgotPassword(request, response) {
  await assertNotRateLimited(request);
  const { email } = validateForgotPassword(await readJsonBody(request));
  await requestPasswordReset(email);
  sendJson(response, 202, {
    message: 'Jika akun tersedia, instruksi reset password akan dikirim.'
  });
}

async function updatePassword(request, response) {
  const { password } = validateResetPassword(await readJsonBody(request));
  await resetPassword(request.auth.authUser.id, password);
  sendJson(response, 200, { message: 'Password berhasil diperbarui.' });
}

module.exports = {
  forgotPassword,
  loginAccount,
  logoutAccount,
  me,
  registerAccount,
  resendEmailVerification,
  updatePassword,
  verifyEmailAddress,
  verifyRecovery
};
