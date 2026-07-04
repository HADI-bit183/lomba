const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY_BYTES = 24 * 1024;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_ITEMS = 10;
const REQUEST_TIMEOUT_MS = 45_000;

function loadLocalEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!match || process.env[match[1]]) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

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

const rateLimits = new Map();

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  setSecurityHeaders(response);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    request.on('error', reject);
  });
}

function isRateLimited(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const clientId = String(forwarded || request.socket.remoteAddress || 'local')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 20;
  const current = rateLimits.get(clientId);

  if (!current || now - current.startedAt >= windowMs) {
    rateLimits.set(clientId, { count: 1, startedAt: now });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_HISTORY_ITEMS)
    .filter(item => item && ['user', 'assistant'].includes(item.role))
    .map(item => ({
      role: item.role,
      content: String(item.content || '').slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter(item => item.content.trim());
}

function extractResponseText(apiResponse) {
  return (apiResponse.output || [])
    .filter(item => item.type === 'message')
    .flatMap(item => item.content || [])
    .filter(content => content.type === 'output_text')
    .map(content => content.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function handleChat(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, {
      error: 'AI service is not configured. Add OPENAI_API_KEY to .env.local.'
    });
    return;
  }

  if (isRateLimited(request)) {
    sendJson(response, 429, {
      error: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    sendJson(response, status, { error: 'Format permintaan tidak valid.' });
    return;
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    sendJson(response, 400, {
      error: `Pertanyaan harus berisi 1–${MAX_MESSAGE_LENGTH} karakter.`
    });
    return;
  }

  const input = [
    ...normalizeHistory(body.history),
    { role: 'user', content: message }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
        instructions: [
          'You are NovaMind AI, a helpful bilingual assistant for an Indonesian student innovation competition.',
          'Answer in the same language as the user, using concise and natural wording.',
          'Prioritize factual accuracy. If a fact is uncertain, say so clearly instead of guessing.',
          'Use web search for current or location-based factual questions.',
          'Known NovaMind context: registration is for university student teams; the submission deadline is 17 October 2026; the grand final is 28 November 2026.',
          'Never claim that this static competition demo has processed payments, verified documents, or performed real administrative actions.'
        ].join(' '),
        input,
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'auto',
        max_output_tokens: 600
      }),
      signal: controller.signal
    });

    const data = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      console.error('OpenAI request failed:', apiResponse.status, data?.error?.code || 'unknown');
      const clientMessage = data?.error?.code === 'insufficient_quota'
        ? 'Kredit API OpenAI belum tersedia. Aktifkan billing atau tambahkan kredit terlebih dahulu.'
        : apiResponse.status === 429
          ? 'Layanan AI sedang sibuk. Tunggu sebentar lalu coba lagi.'
          : 'Layanan AI belum dapat menjawab. Coba lagi nanti.';
      sendJson(response, apiResponse.status === 429 ? 429 : 502, { error: clientMessage });
      return;
    }

    const answer = extractResponseText(data);
    if (!answer) {
      sendJson(response, 502, { error: 'AI tidak menghasilkan jawaban teks.' });
      return;
    }

    sendJson(response, 200, { answer });
  } catch (error) {
    const timedOut = error.name === 'AbortError';
    console.error(timedOut ? 'OpenAI request timed out.' : 'OpenAI request could not be completed.');
    sendJson(response, 502, {
      error: timedOut
        ? 'Jawaban AI terlalu lama. Silakan coba lagi.'
        : 'Tidak dapat terhubung ke layanan AI.'
    });
  } finally {
    clearTimeout(timeout);
  }
}

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
  if (pathname.split('/').some(segment => segment.startsWith('.'))) {
    response.writeHead(404);
    response.end('Not Found');
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
      response.writeHead(404);
      response.end('Not Found');
      return;
    }

    setSecurityHeaders(response);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'POST' && requestUrl.pathname === '/api/chat') {
    await handleChat(request, response);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(response, 200, {
      status: 'ok',
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini'
    });
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD, POST' });
    response.end('Method Not Allowed');
    return;
  }

  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`NovaMind server running at http://localhost:${PORT}`);
});
