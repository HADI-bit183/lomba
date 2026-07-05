const docsController = require('../controllers/docs-controller');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/docs$/,
    handler: docsController.read
  }
];
