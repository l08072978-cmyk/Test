// وحدة المنتجات (Products) — إدارة الأدوات المنزلية المعروضة للبيع.
import { db } from '../../core/database.js';
import { sendJson, HttpError } from '../../core/http.js';

export const name = 'products';

const collection = () => db.collection('products');

// ---- الخدمة (Service): منطق الأعمال ----
export const service = {
  list(filter = {}) {
    let items = collection().all();
    if (filter.categoryId) items = items.filter((p) => p.categoryId === String(filter.categoryId));
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q));
    }
    return items;
  },

  getById(id) {
    const product = collection().getById(id);
    if (!product) throw new HttpError(404, 'المنتج غير موجود');
    return product;
  },

  create(data) {
    if (!data?.name) throw new HttpError(400, 'اسم المنتج مطلوب');
    if (data.price == null || Number(data.price) < 0) throw new HttpError(400, 'سعر المنتج غير صالح');
    return collection().insert({
      name: data.name,
      description: data.description ?? '',
      price: Number(data.price),
      stock: Number(data.stock ?? 0),
      categoryId: data.categoryId ? String(data.categoryId) : null,
      image: data.image ?? null,
    });
  },

  update(id, patch) {
    const updated = collection().update(id, patch);
    if (!updated) throw new HttpError(404, 'المنتج غير موجود');
    return updated;
  },

  remove(id) {
    if (!collection().remove(id)) throw new HttpError(404, 'المنتج غير موجود');
    return { deleted: true };
  },
};

// ---- المسارات (Routes) ----
export function register(router) {
  router.get('/api/products', (req, res, { query }) =>
    sendJson(res, 200, { data: service.list(query) }));
  router.get('/api/products/:id', (req, res, { params }) =>
    sendJson(res, 200, { data: service.getById(params.id) }));
  router.post('/api/products', (req, res, { body }) =>
    sendJson(res, 201, { data: service.create(body) }));
  router.patch('/api/products/:id', (req, res, { params, body }) =>
    sendJson(res, 200, { data: service.update(params.id, body) }));
  router.delete('/api/products/:id', (req, res, { params }) =>
    sendJson(res, 200, { data: service.remove(params.id) }));
}

// ---- بيانات أولية (Seed) ----
export async function seed() {
  if (collection().count() > 0) return;
  const categories = db.collection('categories').all();
  const byName = (n) => categories.find((c) => c.name === n)?.id ?? null;

  const samples = [
    { name: 'طقم سكاكين مطبخ ستانلس ستيل', price: 89, stock: 40, categoryId: byName('أدوات المطبخ'), description: '٦ قطع مقاومة للصدأ' },
    { name: 'مكنسة وممسحة أرضيات', price: 45, stock: 60, categoryId: byName('أدوات التنظيف'), description: 'بمقبض قابل للتعديل' },
    { name: 'طقم مفكات براغي ٢٤ قطعة', price: 120, stock: 25, categoryId: byName('العدد اليدوية'), description: 'حقيبة حمل متينة' },
    { name: 'مصباح LED قابل للشحن', price: 65, stock: 35, categoryId: byName('الإضاءة والكهرباء'), description: 'إضاءة ٣ مستويات' },
    { name: 'صناديق تخزين بلاستيكية ٣ قطع', price: 75, stock: 50, categoryId: byName('التخزين والتنظيم'), description: 'شفافة بأغطية محكمة' },
    { name: 'مقلاة جرانيت غير لاصقة ٢٨سم', price: 110, stock: 30, categoryId: byName('أدوات المطبخ'), description: 'مناسبة لكل أنواع المواقد' },
  ];
  samples.forEach((p) => service.create(p));
}
