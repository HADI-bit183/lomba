const {
  readJsonBody,
  sendJson
} = require('../http/http-utils');
const {
  completeChallenge,
  getProgress
} = require('../services/challenge-service');
const { getOrCreateSession } = require('../services/session-service');

async function read(request, response) {
  const session = getOrCreateSession(request, response);
  sendJson(response, 200, await getProgress(session.visitorId));
}

async function complete(request, response) {
  const session = getOrCreateSession(request, response);
  const input = await readJsonBody(request);
  const progress = await completeChallenge({
    challengeDate: input.challengeDate,
    userId: request.auth?.profileId || session.userId,
    visitorId: session.visitorId,
    xp: input.xp
  });
  sendJson(response, 200, progress);
}

module.exports = {
  complete,
  read
};
