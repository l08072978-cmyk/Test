// دالة serverless على Vercel — تلتقط كل مسارات /api/* وتمرّرها إلى معالج التطبيق.
// الملفات الثابتة (public/) تُخدَم مباشرةً من شبكة Vercel ولا تمرّ من هنا.
import { getHandler } from '../src/app.js';

export default async function handler(req, res) {
  const handle = await getHandler();
  return handle(req, res);
}
