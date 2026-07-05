const {
  ForbiddenError,
  UnauthorizedError
} = require('../database/errors');
const {
  readJsonBody,
  sendJson,
  sendNoContent
} = require('../http/http-utils');
const { assertNotRateLimited } = require('../middleware/rate-limit');
const {
  attachUser,
  getOrCreateSession
} = require('../services/session-service');
const {
  createUser,
  deleteUser,
  getUserById,
  updateUser
} = require('../services/user-service');
const { validateUuid } = require('../validators/common-validator');

function requireOwnUser(session, userId) {
  if (!session.userId) throw new UnauthorizedError();
  if (session.userId !== userId) throw new ForbiddenError();
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
  const session = getOrCreateSession(request, response);
  requireOwnUser(session, userId);
  sendJson(response, 200, await getUserById(userId));
}

async function readCurrent(request, response) {
  const session = getOrCreateSession(request, response);
  if (!session.userId) throw new UnauthorizedError();
  sendJson(response, 200, await getUserById(session.userId));
}

async function update(request, response, params) {
  const userId = validateUuid(params.id, 'ID pengguna');
  const session = getOrCreateSession(request, response);
  requireOwnUser(session, userId);
  const input = await readJsonBody(request);
  const user = await updateUser(userId, input);
  sendJson(response, 200, { user });
}

async function remove(request, response, params) {
  const userId = validateUuid(params.id, 'ID pengguna');
  const session = getOrCreateSession(request, response);
  requireOwnUser(session, userId);
  await deleteUser(userId);
  attachUser(response, session, null);
  sendNoContent(response);
}

module.exports = {
  create,
  read,
  readCurrent,
  remove,
  update
};
