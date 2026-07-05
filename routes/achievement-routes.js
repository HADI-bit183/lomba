const achievementController = require('../controllers/achievement-controller');
const { requireAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/achievements$/,
    middleware: [requireAuth],
    handler: achievementController.list
  },
  {
    method: 'POST',
    pattern: /^\/api\/achievements\/check$/,
    middleware: [requireAuth],
    handler: achievementController.check
  }
];
