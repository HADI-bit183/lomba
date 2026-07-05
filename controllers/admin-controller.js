const { sendJson } = require('../http/http-utils');
const {
  getAdminStatistics,
  listChats,
  listUsers
} = require('../services/admin-service');
const {
  validateLimit,
  validateOffset
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

module.exports = {
  chats,
  statistics,
  users
};
