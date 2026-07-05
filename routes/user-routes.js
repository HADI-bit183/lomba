const userController = require('../controllers/user-controller');

module.exports = [
  {
    method: 'POST',
    pattern: /^\/api\/users$/,
    handler: userController.create
  },
  {
    method: 'GET',
    pattern: /^\/api\/users\/me$/,
    handler: userController.readCurrent
  },
  {
    method: 'GET',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    handler: userController.read
  },
  {
    method: 'PUT',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    handler: userController.update
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    handler: userController.remove
  }
];
