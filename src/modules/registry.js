// سجلّ الوحدات (Module Registry) — مصدر الحقيقة الوحيد للوحدات المفعّلة.
// نستخدم static imports بدل المسح التلقائي للمجلدات لأن ذلك:
//   1) يعمل محليًا وعلى منصات الـ serverless (مثل Vercel) دون مفاجآت تجميع.
//   2) يبقى معياريًا: لإضافة ميزة جديدة، أنشئ مجلدها ثم أضف سطر import واحد هنا.
// الترتيب مهم: الوحدات التي تُعبّئ بيانات تعتمد على غيرها تأتي بعدها
// (products.seed يقرأ التصنيفات، لذا categories قبل products).

import * as categories from './categories/index.js';
import * as products from './products/index.js';
import * as cart from './cart/index.js';

export const modules = [categories, products, cart];
