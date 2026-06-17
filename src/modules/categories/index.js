// وحدة التصنيفات (Categories) — تصنيف الأدوات المنزلية إلى أقسام.
import { db } from '../../core/database.js';
import { sendJson, HttpError } from '../../core/http.js';

export const name = 'categories';

const collection = () => db.collection('categories');

// ---- الخدمة (Service): منطق الأعمال ----
export const service = {
  list: () => collection().all(),
  getById: (id) => {
    const cat = collection().getById(id);
    if (!cat) throw new HttpError(404, 'التصنيف غير موجود');
    return cat;
  },
  create: (data) => {
    if (!data?.name) throw new HttpError(400, 'اسم التصنيف مطلوب');
    return collection().insert({ name: data.name, slug: data.slug ?? slugify(data.name) });
  },
};

// ---- المسارات (Routes) ----
export function register(router) {
  router.get('/api/categories', (req, res) => sendJson(res, 200, { data: service.list() }));
  router.get('/api/categories/:id', (req, res, { params }) =>
    sendJson(res, 200, { data: service.getById(params.id) }));
  router.post('/api/categories', (req, res, { body }) =>
    sendJson(res, 201, { data: service.create(body) }));
}

// ---- بيانات أولية (Seed) ----
export async function seed() {
  if (collection().count() > 0) return;
  ['أدوات المطبخ', 'أدوات التنظيف', 'العدد اليدوية', 'الإضاءة والكهرباء', 'التخزين والتنظيم']
    .forEach((nm) => collection().insert({ name: nm, slug: slugify(nm) }));
}

function slugify(text) {
  return String(text).trim().replace(/\s+/g, '-');
}
