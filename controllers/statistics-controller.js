const { sendJson } = require('../http/http-utils');
const { getUserStatistics } = require('../services/statistics-service');

async function userStatistics(request, response) {
  const statistics = await getUserStatistics(request.auth.profileId);
  sendJson(response, 200, { data: statistics });
}

module.exports = { userStatistics };
