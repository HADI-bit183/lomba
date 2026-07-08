const { sendJson } = require('../http/http-utils');
const {
  deleteUserById,
  getAdminStatistics,
  listChats,
  listUsers
} = require('../services/admin-service');
const {
  validateLimit,
  validateOffset,
  validateUuid
} = require('../validators/common-validator');

function pagination(requestUrl) {
  return {
    limit: validateLimit(requestUrl.searchParams.get('limit'), 20),
    offset: validateOffset(requestUrl.searchParams.get('offset'))
  };
}

async function statistics(request, response) {
  sendJson(response, 200, { data: await getAdminStatistics() });
}

async function users(request, response, params, requestUrl) {
  const { limit, offset } = pagination(requestUrl);
  const result = await listUsers(limit, offset);
  sendJson(response, 200, {
    data: result.data,
    pagination: {
      limit,
      offset,
      total: result.total
    }
  });
}

async function chats(request, response, params, requestUrl) {
  const { limit, offset } = pagination(requestUrl);
  const result = await listChats(limit, offset);
  sendJson(response, 200, {
    data: result.data,
    pagination: {
      limit,
      offset,
      total: result.total
    }
  });
}

async function deleteUser(request, response, params) {
  const userId = validateUuid(params.id);
  const requestUserId = request.auth.profileId;
  await deleteUserById(userId, requestUserId);
  sendJson(response, 200, { message: 'User deleted successfully' });
}

module.exports = {
  chats,
  deleteUser,
  statistics,
  users
};
