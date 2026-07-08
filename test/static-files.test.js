const test = require('node:test');
const assert = require('node:assert/strict');
const { isPublicStaticPath } = require('../http/static-files');

test('static server allows website pages and required assets', () => {
  [
    '/index.html',
    '/ai-assistant.html',
    '/assets/logo.svg',
    '/css/style.css',
    '/js/bundle.js',
    '/Administrasi/Guidebook.pdf',
    '/FutureInnovators/index.html',
    '/FutureInnovators/js/experience.js',
    '/manifest.json',
    '/sw.js'
  ].forEach(pathname => assert.equal(isPublicStaticPath(pathname), true));
});

test('static server blocks backend source and configuration files', () => {
  [
    '/server.js',
    '/package.json',
    '/package-lock.json',
    '/database/schema.sql',
    '/services/auth-service.js',
    '/node_modules/pg/package.json',
    '/DEPLOYMENT.md'
  ].forEach(pathname => assert.equal(isPublicStaticPath(pathname), false));
});
