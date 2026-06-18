import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 5176;
const root = process.cwd();
const port = Number(process.argv[2]) || DEFAULT_PORT;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${HOST}`).pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = normalize(join(root, relativePath));
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, HOST, () => {
  console.log(`[SERVER] Wyrmpit available at http://${HOST}:${port}/index.html`);
});
