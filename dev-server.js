const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 5173;
const ROOT = __dirname;
const TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
};

// Serve static files from the project root for local prototype testing.
function serve(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : decodeURIComponent(request.url);
  const filePath = path.join(ROOT, requestedPath);
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'text/plain' });
    response.end(data);
  });
}

http.createServer(serve).listen(PORT, HOST, () => {
  console.log(`Wyrmpit dev server: http://${HOST}:${PORT}/`);
});
