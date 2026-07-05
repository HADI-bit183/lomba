const healthController = require('../controllers/health-controller');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/health$/,
    handler: healthController.read
  },
  {
    method: 'GET',
    pattern: /^\/api\/ready$/,
    handler: healthController.readiness
  }
];
