const env = require('../config/env');
const { isDatabaseConfigured } = require('../config/database');
const { sendJson } = require('../http/http-utils');

function read(request, response) {
  sendJson(response, 200, {
    status: 'ok',
    aiConfigured: Boolean(env.openAiApiKey),
    databaseConfigured: isDatabaseConfigured(),
    model: env.openAiModel
  });
}

module.exports = { read };
