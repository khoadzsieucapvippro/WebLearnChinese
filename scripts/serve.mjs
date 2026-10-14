import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_CSP_POLICY } from '../tests/frontend/utils/static-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8080';

process.on('uncaughtException', (err) => {
  console.error('Unhandled static server exception:', err && err.message ? err.message : err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled static server rejection:', reason);
});

function startServer() {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

    // Reverse-proxy /api/ and /actuator/ requests to the backend service
    if (parsedUrl.pathname.startsWith('/api/') || parsedUrl.pathname.startsWith('/actuator/')) {
      const targetUrl = new URL(req.url, BACKEND_ORIGIN);
      const proxyHeaders = { ...req.headers };
      proxyHeaders.host = targetUrl.host;

      const clientIp = req.socket && req.socket.remoteAddress;
      if (clientIp) {
        proxyHeaders['x-forwarded-for'] = req.headers['x-forwarded-for']
          ? `${req.headers['x-forwarded-for']}, ${clientIp}`
          : clientIp;
      }
      proxyHeaders['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || (targetUrl.protocol === 'https:' ? 'https' : 'http');
      proxyHeaders['x-forwarded-host'] = req.headers.host || targetUrl.host;

      const requestFn = targetUrl.protocol === 'https:' ? https.request : http.request;
      const proxyReq = requestFn(targetUrl, {
        method: req.method,
        headers: proxyHeaders
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        if (!res.headersSent) {
          const body = JSON.stringify({
            error: 'Bad Gateway',
            message: 'Backend service is unreachable at ' + BACKEND_ORIGIN
          });
          res.writeHead(502, {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(body)
          });
          res.end(body);
        }
      });

      res.on('close', () => {
        proxyReq.destroy();
      });

      req.on('error', () => {
        proxyReq.destroy();
      });

      req.pipe(proxyReq);
      return;
    }
    let reqPath;
    try {
      reqPath = decodeURIComponent(parsedUrl.pathname);
    } catch {
      reqPath = parsedUrl.pathname;
    }
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(FRONTEND_DIR, safePath);

    if (reqPath === '/favicon.ico' && !fs.existsSync(filePath)) {
      res.writeHead(204, { 'Content-Type': 'image/x-icon' });
      res.end();
      return;
    }

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      stat = null;
    }

    if (!stat || stat.isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const isHashed = /\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|svg|woff2?)$/i.test(safePath);
    const cacheControl = isHashed ? 'public, max-age=31536000, immutable' : 'no-cache, must-revalidate';

    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const lastModified = stat.mtime.toUTCString();

    // Conditional HTTP requests handling (RFC 9110 / RFC 7232)
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];

    let notModified = false;
    if (ifNoneMatch) {
      const normalizeTag = (t) => (t ? t.replace(/^W\//, '') : '');
      const normEtag = normalizeTag(etag);
      if (ifNoneMatch === etag || ifNoneMatch.split(',').map((s) => normalizeTag(s.trim())).includes(normEtag) || ifNoneMatch === '*') {
        notModified = true;
      }
    } else if (ifModifiedSince) {
      const imsDate = Date.parse(ifModifiedSince);
      if (!isNaN(imsDate)) {
        if (imsDate >= Math.floor(stat.mtimeMs / 1000) * 1000 || new Date(ifModifiedSince) >= stat.mtime) {
          notModified = true;
        }
      }
    }

    if (notModified) {
      res.writeHead(304, {
        'Cache-Control': cacheControl,
        'ETag': etag,
        'Last-Modified': lastModified,
        'Access-Control-Allow-Origin': '*'
      });
      res.end();
      return;
    }

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'ETag': etag,
      'Last-Modified': lastModified,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    };

    if (ext === '.html') {
      headers['Content-Security-Policy'] = DEV_CSP_POLICY;
    }

    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Server error');
      }
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is currently occupied (e.g. active test run). Retrying in 2 seconds...`);
      setTimeout(startServer, 2000);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
  });
}

startServer();
