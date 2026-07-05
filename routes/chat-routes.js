const chatController = require('../controllers/chat-controller');

module.exports = [
  {
    method: 'POST',
    pattern: /^\/api\/chat$/,
    handler: chatController.create
  },
  {
    method: 'GET',
    pattern: /^\/api\/chat\/history$/,
    handler: chatController.history
  },
  {
    method: 'GET',
    pattern: /^\/api\/chat-history$/,
    handler: chatController.history
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/chat\/([^/]+)$/,
    params: ['id'],
    handler: chatController.remove
  }
];
