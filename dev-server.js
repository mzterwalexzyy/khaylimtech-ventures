// Lightweight local development server with Netlify-equivalent redirects
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.js':   'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Clean trailing slashes
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Rewrite rules based on netlify.toml
  let targetFile = pathname;
  if (pathname === '/' || pathname === '') {
    targetFile = '/index.html';
  } else if (pathname === '/phones') {
    targetFile = '/products.html';
  } else if (pathname === '/laptops') {
    targetFile = '/products.html';
  } else if (pathname === '/gaming') {
    targetFile = '/products.html';
  } else if (pathname === '/accessories') {
    targetFile = '/products.html';
  } else if (pathname === '/products') {
    targetFile = '/products.html';
  } else if (pathname === '/cart') {
    targetFile = '/cart.html';
  } else if (pathname === '/about') {
    targetFile = '/about.html';
  } else if (pathname === '/contact') {
    targetFile = '/contact.html';
  } else if (pathname === '/how-to-order') {
    targetFile = '/how-to-order.html';
  } else if (pathname === '/faq') {
    targetFile = '/faq.html';
  } else if (pathname.startsWith('/product/')) {
    targetFile = '/product-detail.html';
  }

  // Resolve file path safely
  let filePath = path.join(ROOT, targetFile);

  // If path has no extension and doesn't exist, check for .html
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

let currentPort = Number(PORT);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
    if (currentPort >= 5140 && currentPort < 5941) {
      currentPort = 5941; // Skip Windows OS-administered exclusion range (5141-5940)
    } else {
      currentPort += 1;
    }
    console.log(`Port unavailable (${err.code}), trying http://localhost:${currentPort}...`);
    server.listen(currentPort);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  const activePort = server.address().port;
  fs.writeFileSync(path.join(ROOT, '.server-port'), String(activePort));
  console.log(`KhaylimTech local server running at http://localhost:${activePort}`);
});
