// أدوات مساعدة للتعامل مع الطلب والاستجابة (HTTP helpers).

/** يقرأ جسم الطلب ويحوّله من JSON.
 *  يتعامل مع الحالتين: تدفّق خام (محليًا) أو req.body محلَّل مسبقًا (على Vercel). */
export async function readBody(req) {
  // بعض منصات الـ serverless تحلّل الجسم مسبقًا في req.body.
  if (req.body != null) {
    if (typeof req.body === 'string') {
      try { return req.body ? JSON.parse(req.body) : {}; }
      catch { throw new HttpError(400, 'جسم الطلب ليس JSON صالحًا'); }
    }
    return req.body; // كائن محلَّل مسبقًا
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'جسم الطلب ليس JSON صالحًا');
  }
}

/** يرسل استجابة JSON موحّدة. */
export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

/** خطأ تطبيقي يحمل رمز حالة HTTP. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
