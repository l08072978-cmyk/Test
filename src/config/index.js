// إعدادات المشروع المركزية
// يمكن لاحقًا قراءة القيم من متغيرات البيئة (.env) أو خدمة إعدادات خارجية.

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  // اسم المتجر ومعلومات عامة تُعرض في الواجهة
  store: {
    name: 'متجر مريم',
    currency: 'AED',
    locale: 'ar-AE',
  },
  // مفتاح طبقة التخزين الحالية. لاحقًا يمكن استبداله بـ 'postgres' أو 'mongo'
  storage: process.env.STORAGE_DRIVER || 'memory',
};
