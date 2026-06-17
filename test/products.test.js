// اختبارات أولية لوحدة المنتجات باستخدام مُشغّل اختبارات Node المدمج.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { service as products } from '../src/modules/products/index.js';

test('إنشاء منتج صالح', () => {
  const p = products.create({ name: 'مطرقة', price: 30, stock: 10 });
  assert.equal(p.name, 'مطرقة');
  assert.equal(p.price, 30);
  assert.ok(p.id);
});

test('رفض منتج بدون اسم', () => {
  assert.throws(() => products.create({ price: 10 }), /اسم المنتج مطلوب/);
});

test('رفض سعر سالب', () => {
  assert.throws(() => products.create({ name: 'x', price: -5 }), /سعر المنتج غير صالح/);
});

test('البحث بالاسم', () => {
  products.create({ name: 'منشار كهربائي', price: 200, stock: 5 });
  const found = products.list({ search: 'منشار' });
  assert.ok(found.some((p) => p.name.includes('منشار')));
});
