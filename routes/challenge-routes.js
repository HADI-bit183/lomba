const challengeController = require('../controllers/challenge-controller');
const { optionalAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/challenge-progress$/,
    middleware: [optionalAuth],
    handler: challengeController.read
  },
  {
    method: 'POST',
    pattern: /^\/api\/challenge-progress$/,
    middleware: [optionalAuth],
    handler: challengeController.complete
  }
];
