const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const leadsPath = path.join(dataDir, 'leads.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(leadsPath)) {
  fs.writeFileSync(leadsPath, '[]', 'utf8');
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function safeJoin(requestPath, rootDir) {
  const normalizedPath = path.normalize(requestPath).replace(/^\.\.(?:[\\/]|$)/, '');
  return path.join(rootDir, normalizedPath);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/api/lead' && req.method === 'POST') {
    try {
      const rawBody = await readBody(req);
      const payload = JSON.parse(rawBody || '{}');

      const existing = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
      const lead = {
        ...payload,
        createdAt: new Date().toISOString()
      };

      existing.push(lead);
      fs.writeFileSync(leadsPath, JSON.stringify(existing, null, 2), 'utf8');

      return sendJson(res, 200, {
        ok: true,
        message: 'Lead enviado com sucesso!'
      });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        message: 'Não foi possível processar o formulário.'
      });
    }
  }

  if (pathname === '/') {
    return serveFile(res, path.join(publicDir, 'index.html'));
  }

  if (pathname === '/contato-geral.html') {
    return serveFile(res, path.join(publicDir, 'contato-geral.html'));
  }

  const filePath = safeJoin(pathname, publicDir);
  if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  sendJson(res, 404, { ok: false, message: 'Página não encontrada' });
});

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 500, { ok: false, message: 'Erro ao carregar o arquivo' });
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  });
}

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
