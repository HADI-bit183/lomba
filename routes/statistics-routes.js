const statisticsController = require('../controllers/statistics-controller');
const { requireAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/users\/statistics$/,
    middleware: [requireAuth],
    handler: statisticsController.userStatistics
  }
];
