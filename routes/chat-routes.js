const chatController = require('../controllers/chat-controller');
const { requireAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'POST',
    pattern: /^\/api\/chat$/,
    middleware: [requireAuth],
    handler: chatController.create
  },
  {
    method: 'GET',
    pattern: /^\/api\/chat\/history$/,
    middleware: [requireAuth],
    handler: chatController.history
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/chat\/history$/,
    middleware: [requireAuth],
    handler: chatController.clearHistory
  },
  {
    method: 'GET',
    pattern: /^\/api\/chat-history$/,
    middleware: [requireAuth],
    handler: chatController.history
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/chat\/([^/]+)$/,
    params: ['id'],
    middleware: [requireAuth],
    handler: chatController.remove
  }
];
