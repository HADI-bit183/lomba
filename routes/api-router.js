const { AppError } = require('../database/errors');
const { sendError } = require('../http/http-utils');
const { csrfMiddleware, getCsrfToken } = require('../middleware/csrf');
const achievementRoutes = require('./achievement-routes');
const adminRoutes = require('./admin-routes');
const authRoutes = require('./auth-routes');
const challengeRoutes = require('./challenge-routes');
const chatRoutes = require('./chat-routes');
const docsRoutes = require('./docs-routes');
const healthRoutes = require('./health-routes');
const statisticsRoutes = require('./statistics-routes');
const userRoutes = require('./user-routes');

const routes = [
  { method: 'GET', pattern: /^\/api\/csrf-token$/, handler: getCsrfToken },
  ...authRoutes,
  ...adminRoutes,
  ...achievementRoutes,
  ...statisticsRoutes,
  ...docsRoutes,
  ...userRoutes,
  ...chatRoutes,
  ...challengeRoutes,
  ...healthRoutes
];

function matchRoute(route, pathname) {
  const match = pathname.match(route.pattern);
  if (!match) return null;

  const params = {};
  (route.params || []).forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

async function routeApiRequest(request, response, requestUrl) {
  if (!requestUrl.pathname.startsWith('/api/')) return false;

  response.setHeader('Cache-Control', 'no-store');

  try {
    const pathMatches = routes
      .map(route => ({ route, params: matchRoute(route, requestUrl.pathname) }))
      .filter(result => result.params !== null);
    const selected = pathMatches.find(result => result.route.method === request.method);

    if (!selected) {
      if (pathMatches.length) {
        const allowed = [...new Set(pathMatches.map(result => result.route.method))];
        response.setHeader('Allow', allowed.join(', '));
        sendError(
          response,
          new AppError('Metode HTTP tidak diizinkan.', 405, 'METHOD_NOT_ALLOWED')
        );
      } else {
        sendError(response, new AppError('Endpoint API tidak ditemukan.', 404, 'NOT_FOUND'));
      }
      return true;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      await csrfMiddleware(request, response);
    }

    for (const middleware of selected.route.middleware || []) {
      await middleware(request, response, selected.params, requestUrl);
    }
    await selected.route.handler(request, response, selected.params, requestUrl);
  } catch (error) {
    const malformedPath = error instanceof URIError
      ? new AppError('Path API tidak valid.', 400, 'VALIDATION_ERROR')
      : error;
    sendError(response, malformedPath);
  }
  return true;
}

module.exports = {
  routeApiRequest,
  routes
};
