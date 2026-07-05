const env = require('../config/env');
const {
  isAuthConfigured,
  isDatabaseConfigured
} = require('../config/database');
const { sendJson } = require('../http/http-utils');

function read(request, response) {
  sendJson(response, 200, {
    status: 'ok',
    aiConfigured: Boolean(env.openAiApiKey),
    authConfigured: isAuthConfigured(),
    databaseConfigured: isDatabaseConfigured(),
    model: env.openAiModel
  });
}

module.exports = { read };
