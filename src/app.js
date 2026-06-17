// تجميع التطبيق: تحميل الوحدات، توجيه الطلبات، خدمة الملفات الثابتة.
// يُصدّر معالجًا واحدًا للطلبات يُعاد استخدامه في:
//   - خادم Node محليًا (createApp في server.js)
//   - دالة serverless على Vercel (api/[...path].js)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';
import { Router } from './core/router.js';
import { loadModules } from './core/moduleLoader.js';
import { readBody, sendJson, HttpError } from './core/http.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

// نبني المعالج مرة واحدة ونعيد استخدامه (مهم لأداء البدء البارد على serverless).
let handlerPromise;

export function getHandler() {
  if (!handlerPromise) handlerPromise = buildHandler();
  return handlerPromise;
}

async function buildHandler() {
  const router = new Router();
  const loaded = await loadModules(router);
  console.log(`✅ تم تحميل الوحدات: ${loaded.join(', ')}`);

  return async function handle(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
      const pathname = decodeURIComponent(url.pathname);

      // طلبات CORS المبدئية
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
      }

      // مسارات الـ API تُمرّر إلى الوحدات
      if (pathname.startsWith('/api/')) {
        const matched = router.match(req.method, pathname);
        if (!matched) return sendJson(res, 404, { error: 'المسار غير موجود' });

        const query = Object.fromEntries(url.searchParams);
        const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
        return await matched.handler(req, res, { params: matched.params, query, body });
      }

      // غير ذلك: خدمة الملفات الثابتة من مجلد public
      // (على Vercel تُخدَم هذه الملفات أصلًا من شبكة CDN ولا تصل إلى هنا).
      return await serveStatic(pathname, res);
    } catch (err) {
      const status = err.status ?? (err instanceof HttpError ? err.status : 500);
      if (status === 500) console.error(err);
      sendJson(res, status, { error: err.message || 'خطأ داخلي في الخادم' });
    }
  };
}

export async function createApp() {
  const handler = await getHandler();
  return createServer(handler);
}

async function serveStatic(pathname, res) {
  const relative = pathname === '/' ? '/index.html' : pathname;
  // منع الخروج خارج مجلد public
  const filePath = normalize(join(publicDir, relative));
  if (!filePath.startsWith(publicDir)) {
    return sendJson(res, 403, { error: 'ممنوع' });
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'الملف غير موجود' });
  }
}
