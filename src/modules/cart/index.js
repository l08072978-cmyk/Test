// وحدة سلة التسوق (Cart) — تعتمد على وحدة المنتجات.
// تُخزّن السلال في الذاكرة بمعرّف جلسة (sessionId) يُرسله العميل.
import { db } from '../../core/database.js';
import { sendJson, HttpError } from '../../core/http.js';
import { service as products } from '../products/index.js';

export const name = 'cart';

const collection = () => db.collection('carts');

function getOrCreateCart(sessionId) {
  if (!sessionId) throw new HttpError(400, 'معرّف الجلسة (sessionId) مطلوب');
  let cart = collection().findOne((c) => c.sessionId === sessionId);
  if (!cart) cart = collection().insert({ sessionId, items: [] });
  return cart;
}

function withTotals(cart) {
  const items = cart.items.map((item) => {
    const product = products.getById(item.productId);
    return { ...item, name: product.name, price: product.price, lineTotal: product.price * item.quantity };
  });
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { id: cart.id, sessionId: cart.sessionId, items, total };
}

export const service = {
  get(sessionId) {
    return withTotals(getOrCreateCart(sessionId));
  },

  addItem(sessionId, productId, quantity = 1) {
    const product = products.getById(productId); // يتحقق من وجود المنتج
    const qty = Math.max(1, Number(quantity) || 1);
    if (product.stock < qty) throw new HttpError(409, 'الكمية المطلوبة غير متوفرة في المخزون');

    const cart = getOrCreateCart(sessionId);
    const existing = cart.items.find((i) => i.productId === String(productId));
    if (existing) existing.quantity += qty;
    else cart.items.push({ productId: String(productId), quantity: qty });
    collection().update(cart.id, { items: cart.items });
    return withTotals(cart);
  },

  removeItem(sessionId, productId) {
    const cart = getOrCreateCart(sessionId);
    cart.items = cart.items.filter((i) => i.productId !== String(productId));
    collection().update(cart.id, { items: cart.items });
    return withTotals(cart);
  },

  clear(sessionId) {
    const cart = getOrCreateCart(sessionId);
    collection().update(cart.id, { items: [] });
    return withTotals(cart);
  },
};

export function register(router) {
  router.get('/api/cart/:sessionId', (req, res, { params }) =>
    sendJson(res, 200, { data: service.get(params.sessionId) }));
  router.post('/api/cart/:sessionId/items', (req, res, { params, body }) =>
    sendJson(res, 200, { data: service.addItem(params.sessionId, body.productId, body.quantity) }));
  router.delete('/api/cart/:sessionId/items/:productId', (req, res, { params }) =>
    sendJson(res, 200, { data: service.removeItem(params.sessionId, params.productId) }));
  router.delete('/api/cart/:sessionId', (req, res, { params }) =>
    sendJson(res, 200, { data: service.clear(params.sessionId) }));
}
