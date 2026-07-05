const { sendJson } = require('../http/http-utils');
const { openApiDocument } = require('../docs/openapi');

function read(request, response) {
  sendJson(response, 200, openApiDocument);
}

module.exports = { read };
