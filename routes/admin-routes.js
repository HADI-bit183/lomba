const adminController = require('../controllers/admin-controller');
const { requireAdmin } = require('../middleware/admin');
const { requireAuth } = require('../middleware/auth');

const adminMiddleware = [requireAuth, requireAdmin];

module.exports = [
  {
    method: 'GET',
    pattern: /^\/api\/admin\/statistics$/,
    middleware: adminMiddleware,
    handler: adminController.statistics
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/users$/,
    middleware: adminMiddleware,
    handler: adminController.users
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/chats$/,
    middleware: adminMiddleware,
    handler: adminController.chats
  }
];
