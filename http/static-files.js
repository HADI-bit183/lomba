const PUBLIC_DIRECTORIES = [
  '/Administrasi/',
  '/FutureInnovators/',
  '/assets/',
  '/css/',
  '/js/'
];

const PUBLIC_ROOT_FILES = new Set([
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js'
]);

function isPublicStaticPath(pathname) {
  if (/^\/[^/]+\.html$/i.test(pathname)) return true;
  if (PUBLIC_ROOT_FILES.has(pathname)) return true;
  return PUBLIC_DIRECTORIES.some(directory => pathname.startsWith(directory));
}

module.exports = { isPublicStaticPath };
