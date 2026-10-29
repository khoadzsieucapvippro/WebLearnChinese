import http from 'node:http';
import https from 'node:https';

const TARGET_HOST = 'elearning-backend-pwyi.onrender.com';
const PORT = 8080;

const server = http.createServer((req, res) => {
  // CORS Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Authorization, Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST
    }
  };

  // Remove origin headers that could cause Cloudflare host mismatch
  delete options.headers['host'];
  options.headers['host'] = TARGET_HOST;

  const proxyReq = https.request(options, (proxyRes) => {
    // Forward headers except CORS which we already set
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-methods'];
    delete headers['access-control-allow-headers'];
    delete headers['access-control-allow-credentials'];

    res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy 8080 Error]:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 'BAD_GATEWAY', message: 'Không thể kết nối đến máy chủ đám mây: ' + err.message }));
    }
  });

  req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Local Backend Bridge] Proxy active on http://localhost:${PORT} -> https://${TARGET_HOST}`);
});
