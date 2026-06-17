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
    const price = Number(data.price);
    const oldPrice = data.oldPrice != null ? Number(data.oldPrice) : null;
    return collection().insert({
      name: data.name,
      description: data.description ?? '',
      price,
      oldPrice,
      // نسبة الخصم تُحسب تلقائيًا إن وُجد سعر قديم أعلى.
      discountPercent: oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0,
      currency: data.currency ?? 'AED',
      sku: data.sku ?? null,
      brand: data.brand ?? 'غير محدد',
      stock: Number(data.stock ?? 0),
      categoryId: data.categoryId ? String(data.categoryId) : null,
      emoji: data.emoji ?? '🧰',
      images: data.images ?? [],
      rating: data.rating ?? { average: 0, count: 0 },
      tags: data.tags ?? [],
      warranty: data.warranty ?? null,
      specifications: data.specifications ?? {},
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

// ---- بيانات أولية (Seed) — منتجات اختبارية كاملة التفاصيل ----
export async function seed() {
  if (collection().count() > 0) return;
  const categories = db.collection('categories').all();
  const byName = (n) => categories.find((c) => c.name === n)?.id ?? null;

  const samples = [
    {
      name: 'طقم سكاكين مطبخ ستانلس ستيل ٦ قطع',
      brand: 'شيف برو', sku: 'KIT-KNF-006', emoji: '🔪',
      price: 89, oldPrice: 129, stock: 40, categoryId: byName('أدوات المطبخ'),
      description: 'طقم سكاكين احترافي من الستانلس ستيل المقاوم للصدأ مع حامل خشبي أنيق. شفرات مسنونة بدقة لقطع سلس.',
      warranty: 'ضمان سنتان ضد عيوب الصناعة',
      rating: { average: 4.6, count: 213 },
      tags: ['الأكثر مبيعًا', 'هدية مثالية'],
      images: ['/img/knives-1.jpg', '/img/knives-2.jpg'],
      specifications: { 'المادة': 'ستانلس ستيل 4Cr14', 'عدد القطع': '6', 'الحامل': 'خشب زان', 'العناية': 'غسيل يدوي مفضّل' },
    },
    {
      name: 'مقلاة جرانيت غير لاصقة ٢٨ سم',
      brand: 'كوك ماستر', sku: 'KIT-PAN-028', emoji: '🍳',
      price: 110, oldPrice: 110, stock: 30, categoryId: byName('أدوات المطبخ'),
      description: 'مقلاة بطبقة جرانيت غير لاصقة متعددة الطبقات، مناسبة لكل أنواع المواقد بما فيها الحثّي (Induction). مقبض عازل للحرارة.',
      warranty: 'ضمان سنة',
      rating: { average: 4.3, count: 87 },
      tags: ['صديق للحثّي'],
      images: ['/img/pan-1.jpg'],
      specifications: { 'القطر': '28 سم', 'الطلاء': 'جرانيت 5 طبقات', 'القاعدة': 'مناسبة للحثّي', 'المقبض': 'عازل للحرارة' },
    },
    {
      name: 'خلاط كهربائي محمول ٣ سرعات',
      brand: 'هوم تك', sku: 'KIT-BLN-300', emoji: '🥤',
      price: 159, oldPrice: 199, stock: 22, categoryId: byName('أدوات المطبخ'),
      description: 'خلاط يدوي قوي 350 واط بثلاث سرعات وشفرات ستانلس ستيل، مثالي للعصائر والصلصات. سهل التنظيف.',
      warranty: 'ضمان سنة ودعم محلي',
      rating: { average: 4.1, count: 54 },
      tags: ['عرض خاص'],
      specifications: { 'القدرة': '350 واط', 'السرعات': '3', 'الشفرات': 'ستانلس ستيل', 'الجهد': '220 فولت' },
    },
    {
      name: 'مكنسة وممسحة أرضيات بمقبض قابل للتعديل',
      brand: 'كلين بلس', sku: 'CLN-MOP-001', emoji: '🧹',
      price: 45, oldPrice: 60, stock: 60, categoryId: byName('أدوات التنظيف'),
      description: 'طقم تنظيف متكامل بمقبض ألمنيوم خفيف قابل للتعديل من 80 إلى 130 سم، مع رأس ميكروفايبر قابل للغسل.',
      warranty: 'بدون ضمان',
      rating: { average: 4.4, count: 142 },
      tags: ['الأكثر مبيعًا'],
      specifications: { 'المقبض': 'ألمنيوم قابل للتعديل', 'الطول': '80–130 سم', 'الرأس': 'ميكروفايبر قابل للغسل' },
    },
    {
      name: 'مكنسة كهربائية لاسلكية ٢٢ فولت',
      brand: 'باور كلين', sku: 'CLN-VAC-022', emoji: '🔌',
      price: 499, oldPrice: 649, stock: 15, categoryId: byName('أدوات التنظيف'),
      description: 'مكنسة لاسلكية خفيفة بقوة شفط عالية وبطارية ليثيوم تدوم حتى 40 دقيقة، مع فلتر HEPA وحاوية شفافة سهلة التفريغ.',
      warranty: 'ضمان سنتان على المحرك',
      rating: { average: 4.7, count: 309 },
      tags: ['مميز', 'عرض خاص'],
      specifications: { 'الجهد': '22 فولت', 'مدة التشغيل': 'حتى 40 دقيقة', 'الفلتر': 'HEPA', 'الوزن': '2.6 كجم' },
    },
    {
      name: 'طقم مفكات براغي ٢٤ قطعة',
      brand: 'تول برو', sku: 'TLS-SCR-024', emoji: '🪛',
      price: 120, oldPrice: 150, stock: 25, categoryId: byName('العدد اليدوية'),
      description: 'مجموعة مفكات احترافية بمقابض مطاطية مانعة للانزلاق ورؤوس مغناطيسية متنوعة (فيليبس وعادية)، داخل حقيبة حمل متينة.',
      warranty: 'ضمان مدى الحياة ضد الكسر',
      rating: { average: 4.5, count: 98 },
      tags: ['احترافي'],
      specifications: { 'عدد القطع': '24', 'المقابض': 'مطاط مانع للانزلاق', 'الرؤوس': 'مغناطيسية', 'الحقيبة': 'مضمّنة' },
    },
    {
      name: 'مثقاب كهربائي لاسلكي ١٨ فولت',
      brand: 'تول برو', sku: 'TLS-DRL-018', emoji: '🛠️',
      price: 349, oldPrice: 429, stock: 18, categoryId: byName('العدد اليدوية'),
      description: 'مثقاب/مفك براغي لاسلكي ببطاريتين ليثيوم، عزم دوران قابل للتعديل على 21 مستوى، وإضاءة LED. مع طقم لقم 30 قطعة.',
      warranty: 'ضمان 3 سنوات',
      rating: { average: 4.8, count: 176 },
      tags: ['الأعلى تقييمًا', 'مع بطاريتين'],
      specifications: { 'الجهد': '18 فولت', 'العزم': '21 مستوى', 'البطاريات': '2 ليثيوم', 'اللقم': '30 قطعة' },
    },
    {
      name: 'مفتاح ربط إنجليزي قابل للتعديل ١٠"',
      brand: 'آيرون فيكس', sku: 'TLS-WRN-010', emoji: '🔧',
      price: 38, oldPrice: 38, stock: 70, categoryId: byName('العدد اليدوية'),
      description: 'مفتاح ربط من الكروم فاناديوم مقاوم للصدأ، فك قابل للتعديل بسلاسة ومقياس مدمج. قبضة مريحة.',
      warranty: 'ضمان سنة',
      rating: { average: 4.2, count: 61 },
      tags: [],
      specifications: { 'المقاس': '10 إنش', 'المادة': 'كروم فاناديوم', 'الفتحة': 'قابلة للتعديل' },
    },
    {
      name: 'مصباح LED قابل للشحن ٣ مستويات',
      brand: 'لايت أب', sku: 'ELC-LMP-003', emoji: '💡',
      price: 65, oldPrice: 85, stock: 35, categoryId: byName('الإضاءة والكهرباء'),
      description: 'مصباح طوارئ محمول قابل للشحن عبر USB، بثلاثة مستويات إضاءة وبطارية تدوم حتى 12 ساعة. مثالي للرحلات وانقطاع الكهرباء.',
      warranty: 'ضمان سنة',
      rating: { average: 4.3, count: 120 },
      tags: ['عرض خاص'],
      specifications: { 'الشحن': 'USB-C', 'المستويات': '3', 'مدة التشغيل': 'حتى 12 ساعة', 'البطارية': '2000 mAh' },
    },
    {
      name: 'شريط إضاءة LED ذكي ٥ متر',
      brand: 'لايت أب', sku: 'ELC-STR-005', emoji: '🌈',
      price: 95, oldPrice: 140, stock: 45, categoryId: byName('الإضاءة والكهرباء'),
      description: 'شريط إضاءة RGB ذكي يتحكم به عبر تطبيق أو ريموت، 16 مليون لون وأنماط متعددة، لاصق خلفي قوي. مناسب للديكور.',
      warranty: 'ضمان سنة',
      rating: { average: 4.0, count: 73 },
      tags: ['ذكي', 'عرض خاص'],
      specifications: { 'الطول': '5 متر', 'الألوان': '16 مليون', 'التحكم': 'تطبيق + ريموت', 'التوصيل': 'Wi-Fi' },
    },
    {
      name: 'مشترك كهربائي ٤ منافذ مع حماية',
      brand: 'باور سيف', sku: 'ELC-SKT-004', emoji: '⚡',
      price: 55, oldPrice: 70, stock: 80, categoryId: byName('الإضاءة والكهرباء'),
      description: 'مشترك كهربائي بأربعة منافذ ومنفذي USB، مع حماية ضد التيار الزائد ومفتاح إضاءة لكل منفذ. كابل بطول 2 متر.',
      warranty: 'ضمان سنتان',
      rating: { average: 4.5, count: 188 },
      tags: ['الأكثر مبيعًا'],
      specifications: { 'المنافذ': '4 + 2 USB', 'الحماية': 'ضد التيار الزائد', 'طول الكابل': '2 متر' },
    },
    {
      name: 'صناديق تخزين بلاستيكية شفافة ٣ قطع',
      brand: 'أورجانايز', sku: 'STO-BOX-003', emoji: '📦',
      price: 75, oldPrice: 95, stock: 50, categoryId: byName('التخزين والتنظيم'),
      description: 'مجموعة من ثلاثة صناديق تخزين شفافة بأحجام متدرجة وأغطية محكمة الإغلاق قابلة للتكديس. مثالية للملابس والأدوات.',
      warranty: 'بدون ضمان',
      rating: { average: 4.4, count: 134 },
      tags: ['قابل للتكديس'],
      specifications: { 'عدد القطع': '3', 'المادة': 'بلاستيك خالٍ من BPA', 'الأغطية': 'محكمة', 'قابل للتكديس': 'نعم' },
    },
    {
      name: 'منظّم أدراج قابل للتعديل ٦ أقسام',
      brand: 'أورجانايز', sku: 'STO-ORG-006', emoji: '🗂️',
      price: 42, oldPrice: 55, stock: 65, categoryId: byName('التخزين والتنظيم'),
      description: 'منظّم أدراج بأقسام قابلة للتعديل لترتيب الأدوات المكتبية وأدوات المطبخ. تصميم معياري يتكيّف مع حجم الدرج.',
      warranty: 'بدون ضمان',
      rating: { average: 4.1, count: 47 },
      tags: ['معياري'],
      specifications: { 'الأقسام': '6 قابلة للتعديل', 'المادة': 'بلاستيك متين', 'الاستخدام': 'أدراج المطبخ والمكتب' },
    },
    {
      name: 'رف تخزين معدني ٤ طبقات',
      brand: 'ستيل رَك', sku: 'STO-SHF-004', emoji: '🪜',
      price: 220, oldPrice: 280, stock: 12, categoryId: byName('التخزين والتنظيم'),
      description: 'رف تخزين معدني متين بأربع طبقات قابلة لتحمّل حتى 120 كجم لكل طبقة، مناسب للمستودعات والمطابخ والكراجات. سهل التركيب.',
      warranty: 'ضمان 3 سنوات على الهيكل',
      rating: { average: 4.6, count: 92 },
      tags: ['تحمّل عالٍ'],
      specifications: { 'الطبقات': '4', 'التحمّل': '120 كجم/طبقة', 'المادة': 'معدن مطلي', 'الأبعاد': '90×40×160 سم' },
    },
  ];
  samples.forEach((p) => service.create(p));
}
