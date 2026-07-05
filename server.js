const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const logger = require('./utils/logger');
const { isDatabaseConfigured } = require('./config/database');
const { validateEnvironment } = require('./config/validate-env');
const {
  sendError,
  setSecurityHeaders
} = require('./http/http-utils');
const { isPublicStaticPath } = require('./http/static-files');
const { routeApiRequest } = require('./routes/api-router');

const ROOT = env.ROOT;
const HOST = env.host;
const PORT = env.port;

validateEnvironment();

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  let pathname;

  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  const serve404 = () => {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    const notFoundPath = path.resolve(ROOT, '404.html');
    if (fs.existsSync(notFoundPath)) {
      fs.createReadStream(notFoundPath).pipe(response);
    } else {
      response.end('Not Found');
    }
  };

  if (pathname.split('/').some(segment => segment.startsWith('.'))) {
    serve404();
    return;
  }
  if (!isPublicStaticPath(pathname)) {
    serve404();
    return;
  }

  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      serve404();
      return;
    }

    const mtime = stats.mtime.toUTCString();
    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

    if (
      request.headers['if-none-match'] === etag ||
      (request.headers['if-modified-since'] === mtime)
    ) {
      response.writeHead(304);
      response.end();
      return;
    }

    let cacheControl = 'no-cache';
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.html') {
      cacheControl = 'no-cache';
    } else if (ext === '.css' || ext === '.js' || ext === '.mjs') {
      cacheControl = 'public, max-age=31536000, immutable';
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) {
      cacheControl = 'public, max-age=2592000';
    } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
      cacheControl = 'public, max-age=31536000';
    } else {
      cacheControl = 'public, max-age=3600, must-revalidate';
    }

    setSecurityHeaders(response);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': cacheControl,
      'ETag': etag,
      'Last-Modified': mtime
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  });
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (await routeApiRequest(request, response, requestUrl)) return;

  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }

  serveStatic(request, response);
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    
    if (request.url.startsWith('/api')) {
      sendError(response, error);
    } else {
      logger.error('Server error (HTML):', { message: error.message, stack: error.stack });
      response.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      const serverErrorPath = path.resolve(ROOT, '500.html');
      if (fs.existsSync(serverErrorPath)) {
        fs.createReadStream(serverErrorPath).pipe(response);
      } else {
        response.end('Internal Server Error');
      }
    }
  });
});

server.on('clientError', (error, socket) => {
  logger.error('Invalid client request:', { error: error.code || error.message });
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, HOST, () => {
  logger.info(`NovaMind server listening on ${HOST}:${PORT}`);
  if (!isDatabaseConfigured()) {
    logger.warn('Supabase is not configured; database-backed features will return 503.');
  }
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received; closing HTTP server and ensuring database is cleanly exited.`);

  const forceClose = setTimeout(() => {
    logger.error('Force closing server due to timeout.');
    server.closeAllConnections?.();
    process.exitCode = 1;
  }, 10_000);
  forceClose.unref();

  server.close(error => {
    clearTimeout(forceClose);
    if (error) {
      logger.error('Server shutdown failed:', { error: error.message });
      process.exitCode = 1;
    } else {
      logger.info('Server successfully closed.');
    }
    // Database connections (Supabase REST) do not need explicit closing, but if they did, it would happen here.
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception', { message: error.message, stack: error.stack });
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled Rejection', { reason: reason });
  shutdown('UNHANDLED_REJECTION');
});
