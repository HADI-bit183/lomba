const { ForbiddenError, UnauthorizedError } = require('../database/errors');

function requireAdmin(request) {
  if (!request.auth) throw new UnauthorizedError();
  if (request.auth.profile.user.role !== 'admin') {
    throw new ForbiddenError('Endpoint ini hanya dapat diakses admin.');
  }
}

module.exports = { requireAdmin };
