// أدوات مساعدة للتعامل مع الطلب والاستجابة (HTTP helpers).

/** يقرأ جسم الطلب ويحوّله من JSON. */
export async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('جسم الطلب ليس JSON صالحًا');
    err.status = 400;
    throw err;
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
