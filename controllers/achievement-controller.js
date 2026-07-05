const { sendJson } = require('../http/http-utils');
const {
  checkAchievements,
  listAchievements
} = require('../services/achievement-service');

async function list(request, response) {
  const achievements = await listAchievements(request.auth.profileId);
  sendJson(response, 200, { data: achievements });
}

async function check(request, response) {
  const achievements = await checkAchievements(request.auth.profileId);
  sendJson(response, 200, {
    data: achievements,
    checkedAt: new Date().toISOString()
  });
}

module.exports = {
  check,
  list
};
