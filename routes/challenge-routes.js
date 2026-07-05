const challengeController = require('../controllers/challenge-controller');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/challenge-progress$/,
    handler: challengeController.read
  },
  {
    method: 'POST',
    pattern: /^\/api\/challenge-progress$/,
    handler: challengeController.complete
  }
];
