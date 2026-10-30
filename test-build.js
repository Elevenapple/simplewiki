// Local GitHub Pages simulator.
// Serves `.output/public` under the `app.baseURL` from nuxt.config.ts, mimicking how
// GitHub Pages hosts a project site (https://<user>.github.io/<baseURL>/).
// Usage: `bun run generate && bun run preview:pages` (or `node test-build.js`).

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, '.output', 'public');
const port = Number(process.env.PORT) || 8080;

let baseURL = '/';
const configPath = path.join(root, 'nuxt.config.ts');
if (fs.existsSync(configPath)) {
  const match = fs.readFileSync(configPath, 'utf8').match(/baseURL:\s*["'`]([^"'`]+)["'`]/);
  if (match?.[1]) baseURL = match[1];
}
if (!baseURL.startsWith('/')) baseURL = `/${baseURL}`;
if (!baseURL.endsWith('/')) baseURL = `${baseURL}/`;

if (!fs.existsSync(publicDir)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ".output/public" does not exist. Run "bun run generate" first.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

function sendFile(res, status, filePath) {
  res.writeHead(status, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function notFound(res) {
  const page = path.join(publicDir, '404.html');
  if (fs.existsSync(page)) return sendFile(res, 404, page);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

function redirect(res, location) {
  res.writeHead(301, { Location: location });
  res.end();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound(res);
  }

  // GitHub Pages redirects /<base> to /<base>/ and knows nothing outside the project path.
  if (`${pathname}/` === baseURL) return redirect(res, `${baseURL}${url.search}`);
  if (!pathname.startsWith(baseURL)) return notFound(res);

  const filePath = path.resolve(publicDir, `.${pathname.slice(baseURL.length - 1)}`);
  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) return notFound(res);

  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      if (!pathname.endsWith('/')) return redirect(res, `${pathname}/${url.search}`);
      const index = path.join(filePath, 'index.html');
      return fs.existsSync(index) ? sendFile(res, 200, index) : notFound(res);
    }
    return sendFile(res, 200, filePath);
  }
  if (fs.existsSync(`${filePath}.html`)) return sendFile(res, 200, `${filePath}.html`);
  return notFound(res);
});

server.listen(port, () => {
  console.log('\x1b[36m%s\x1b[0m', `🤖 Simulating GitHub Pages with baseURL "${baseURL}"`);
  console.log('\x1b[32m%s\x1b[0m', `🚀 http://localhost:${port}${baseURL}`);
});
