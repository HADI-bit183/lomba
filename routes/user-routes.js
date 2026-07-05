const userController = require('../controllers/user-controller');
const { optionalAuth, requireAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'POST',
    pattern: /^\/api\/users$/,
    handler: userController.create
  },
  {
    method: 'GET',
    pattern: /^\/api\/users\/me$/,
    middleware: [optionalAuth],
    handler: userController.readCurrent
  },
  {
    method: 'GET',
    pattern: /^\/api\/users\/profile$/,
    middleware: [requireAuth],
    handler: userController.profile
  },
  {
    method: 'PUT',
    pattern: /^\/api\/users\/profile$/,
    middleware: [requireAuth],
    handler: userController.updateProfile
  },
  {
    method: 'GET',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    middleware: [requireAuth],
    handler: userController.read
  },
  {
    method: 'PUT',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    middleware: [requireAuth],
    handler: userController.update
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/users\/([^/]+)$/,
    params: ['id'],
    middleware: [requireAuth],
    handler: userController.remove
  }
];
