const {
  ForbiddenError,
  UnauthorizedError
} = require('../database/errors');
const {
  readJsonBody,
  sendJson,
  sendNoContent
} = require('../http/http-utils');
const {
  clearAuthSession
} = require('../services/auth-session-service');
const {
  deleteAuthUser,
  updateEmail
} = require('../services/auth-service');
const { assertNotRateLimited } = require('../middleware/rate-limit');
const {
  attachUser,
  getOrCreateSession
} = require('../services/session-service');
const {
  createUser,
  getUserById,
  updateUser
} = require('../services/user-service');
const { createUserUpdateModel } = require('../models/user');
const { validateEmail } = require('../validators/auth-validator');
const { validateUuid } = require('../validators/common-validator');

function requireOwnUser(auth, userId) {
  if (!auth) throw new UnauthorizedError();
  if (auth.profileId !== userId) throw new ForbiddenError();
}

async function create(request, response) {
  assertNotRateLimited(request);
  const input = await readJsonBody(request);
  const session = getOrCreateSession(request, response);
  const result = await createUser(input);
  attachUser(response, session, result.user.id);
  response.setHeader('Location', `/api/users/${result.user.id}`);
  sendJson(response, 201, result);
}

async function read(request, response, params) {
  const userId = validateUuid(params.id, 'ID pengguna');
  requireOwnUser(request.auth, userId);
  sendJson(response, 200, await getUserById(userId));
}

async function readCurrent(request, response) {
  if (request.auth) {
    sendJson(response, 200, request.auth.profile);
    return;
  }

  const session = getOrCreateSession(request, response);
  if (!session.userId) throw new UnauthorizedError();
  sendJson(response, 200, await getUserById(session.userId));
}

async function update(request, response, params) {
  const userId = validateUuid(params.id, 'ID pengguna');
  requireOwnUser(request.auth, userId);
  await updateProfileData(request, response, userId);
}

async function updateProfileData(request, response, userId) {
  const input = await readJsonBody(request);
  createUserUpdateModel(input);

  let emailVerificationRequired = false;
  if (Object.hasOwn(input, 'email')) {
    const requestedEmail = validateEmail(input.email);
    const authUser = await updateEmail(
      request.auth.accessToken,
      request.auth.refreshToken,
      requestedEmail
    );
    emailVerificationRequired = authUser.email !== requestedEmail;
    if (emailVerificationRequired) {
      delete input.email;
    } else {
      input.email = requestedEmail;
    }
  }

  const user = Object.keys(input).length
    ? await updateUser(userId, input)
    : (await getUserById(userId)).user;
  sendJson(response, 200, { emailVerificationRequired, user });
}

async function profile(request, response) {
  sendJson(response, 200, await getUserById(request.auth.profileId));
}

async function updateProfile(request, response) {
  await updateProfileData(request, response, request.auth.profileId);
}

async function remove(request, response, params) {
  const userId = validateUuid(params.id, 'ID pengguna');
  const session = getOrCreateSession(request, response);
  requireOwnUser(request.auth, userId);
  await deleteAuthUser(request.auth.authUser.id);
  clearAuthSession(response);
  attachUser(response, session, null);
  sendNoContent(response);
}

module.exports = {
  create,
  profile,
  read,
  readCurrent,
  remove,
  update,
  updateProfile
};
