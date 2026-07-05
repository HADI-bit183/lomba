const { AppError } = require('../database/errors');
const {
  clearAuthSession,
  readAuthSession,
  setAuthSession
} = require('../services/auth-session-service');
const {
  getAuthUser,
  refresh
} = require('../services/auth-service');
const { ensureAuthProfile } = require('../services/user-service');

async function resolveAuthentication(request, response, required) {
  const tokens = readAuthSession(request);
  if (!tokens.accessToken && !tokens.refreshToken) {
    if (required) {
      throw new AppError('Autentikasi diperlukan.', 401, 'UNAUTHORIZED');
    }
    request.auth = null;
    return;
  }

  let accessToken = tokens.accessToken;
  let refreshToken = tokens.refreshToken;
  let authUser;

  try {
    if (!accessToken) throw new AppError('Sesi perlu diperbarui.', 401, 'UNAUTHORIZED');
    authUser = await getAuthUser(accessToken);
  } catch (error) {
    if (refreshToken && error.statusCode === 401) {
      try {
        const refreshed = await refresh(refreshToken);
        accessToken = refreshed.session.access_token;
        refreshToken = refreshed.session.refresh_token;
        authUser = refreshed.user;
        setAuthSession(response, refreshed.session, tokens.remember);
      } catch (refreshError) {
        clearAuthSession(response);
        if (required || tokens.source === 'bearer') throw refreshError;
        request.auth = null;
        return;
      }
    } else {
      if (error.statusCode === 401) clearAuthSession(response);
      if (required || tokens.source === 'bearer') throw error;
      request.auth = null;
      return;
    }
  }

  const profile = await ensureAuthProfile(authUser);
  request.auth = {
    accessToken,
    authUser,
    profile,
    profileId: profile.user.id,
    refreshToken,
    remember: tokens.remember
  };
}

async function requireAuth(request, response) {
  await resolveAuthentication(request, response, true);
}

async function optionalAuth(request, response) {
  await resolveAuthentication(request, response, false);
}

module.exports = {
  optionalAuth,
  requireAuth,
  resolveAuthentication
};
