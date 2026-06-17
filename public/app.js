// واجهة المتجر — تتواصل مع الـ API. مبنية بـ JavaScript صرف دون مكتبات.

const SESSION_ID = localStorage.getItem('sessionId') || crypto.randomUUID();
localStorage.setItem('sessionId', SESSION_ID);

const api = {
  get: (path) => fetch(path).then((r) => r.json()),
  post: (path, body) =>
    fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
  del: (path) => fetch(path, { method: 'DELETE' }).then((r) => r.json()),
};

const els = {
  products: document.getElementById('products'),
  categories: document.getElementById('categories'),
  search: document.getElementById('search'),
  cartCount: document.getElementById('cart-count'),
  cartItems: document.getElementById('cart-items'),
  cartTotal: document.getElementById('cart-total'),
  cartPanel: document.getElementById('cart-panel'),
  modal: document.getElementById('product-modal'),
};

// إغلاق نافذة التفاصيل بالنقر على الخلفية
els.modal.addEventListener('click', (e) => { if (e.target === els.modal) els.modal.classList.add('hidden'); });

let state = { categoryId: null, search: '' };

async function loadCategories() {
  const { data } = await api.get('/api/categories');
  els.categories.innerHTML =
    `<li data-id="" class="active">الكل</li>` +
    data.map((c) => `<li data-id="${c.id}">${c.name}</li>`).join('');
  els.categories.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => {
      els.categories.querySelectorAll('li').forEach((x) => x.classList.remove('active'));
      li.classList.add('active');
      state.categoryId = li.dataset.id || null;
      loadProducts();
    });
  });
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.categoryId) params.set('categoryId', state.categoryId);
  if (state.search) params.set('search', state.search);
  const { data } = await api.get(`/api/products?${params}`);

  els.products.innerHTML = data.length
    ? data.map(productCard).join('')
    : '<p class="empty">لا توجد منتجات مطابقة.</p>';

  els.products.querySelectorAll('button[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(btn.dataset.add); });
  });
  els.products.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', () => openProduct(card.dataset.id));
  });
}

function stars(rating = { average: 0, count: 0 }) {
  const full = Math.round(rating.average);
  return `<span class="stars">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>
          <span class="rating-num">${rating.average} (${rating.count})</span>`;
}

function productCard(p) {
  const badge = p.discountPercent > 0 ? `<span class="badge">-${p.discountPercent}%</span>` : '';
  const old = p.oldPrice && p.oldPrice > p.price ? `<span class="old-price">${p.oldPrice}</span>` : '';
  const tags = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join('');
  const lowStock = p.stock <= 15 ? `<span class="low-stock">باقٍ ${p.stock} فقط</span>` : '';
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="thumb">${badge}${p.emoji || '🧰'}</div>
      <div class="brand">${p.brand || ''}</div>
      <h3>${p.name}</h3>
      <div class="rating">${stars(p.rating)}</div>
      <div class="tags">${tags}</div>
      <p class="desc">${p.description || ''}</p>
      <div class="price-row"><span class="price">${p.price} د.إ</span> ${old} ${lowStock}</div>
      <button data-add="${p.id}">أضف إلى السلة</button>
    </div>`;
}

async function openProduct(id) {
  const { data: p } = await api.get(`/api/products/${id}`);
  const specs = Object.entries(p.specifications || {})
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const old = p.oldPrice && p.oldPrice > p.price ? `<span class="old-price">${p.oldPrice} د.إ</span>` : '';
  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" id="modal-close">✕</button>
    <div class="modal-emoji">${p.emoji || '🧰'}</div>
    <div class="brand">${p.brand || ''} · ${p.sku || ''}</div>
    <h2>${p.name}</h2>
    <div class="rating">${stars(p.rating)}</div>
    <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
    <p>${p.description || ''}</p>
    <div class="price-row"><span class="price big">${p.price} د.إ</span> ${old}
      ${p.discountPercent > 0 ? `<span class="badge">-${p.discountPercent}%</span>` : ''}</div>
    <p class="stock-line">المخزون: ${p.stock} قطعة ${p.warranty ? `· 🛡️ ${p.warranty}` : ''}</p>
    ${specs ? `<h3>المواصفات</h3><table class="specs">${specs}</table>` : ''}
    <button class="add-modal" data-add="${p.id}">أضف إلى السلة</button>`;

  els.modal.classList.remove('hidden');
  document.getElementById('modal-close').onclick = () => els.modal.classList.add('hidden');
  document.querySelector('.add-modal').onclick = () => { addToCart(p.id); els.modal.classList.add('hidden'); };
}

async function addToCart(productId) {
  await api.post(`/api/cart/${SESSION_ID}/items`, { productId, quantity: 1 });
  await refreshCart();
  els.cartPanel.classList.remove('hidden');
}

async function refreshCart() {
  const { data } = await api.get(`/api/cart/${SESSION_ID}`);
  const count = data.items.reduce((s, i) => s + i.quantity, 0);
  els.cartCount.textContent = count;
  els.cartTotal.textContent = data.total;
  els.cartItems.innerHTML = data.items.length
    ? data.items.map((i) => `
        <div class="cart-item">
          <span>${i.name} ×${i.quantity}</span>
          <span>${i.lineTotal} د.إ <button data-remove="${i.productId}">حذف</button></span>
        </div>`).join('')
    : '<p class="empty">السلة فارغة.</p>';

  els.cartItems.querySelectorAll('button[data-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api.del(`/api/cart/${SESSION_ID}/items/${btn.dataset.remove}`);
      refreshCart();
    });
  });
}

// أحداث الواجهة
els.search.addEventListener('input', (e) => {
  state.search = e.target.value.trim();
  loadProducts();
});
document.getElementById('cart-toggle').addEventListener('click', () => els.cartPanel.classList.toggle('hidden'));
document.getElementById('cart-close').addEventListener('click', () => els.cartPanel.classList.add('hidden'));
document.getElementById('checkout').addEventListener('click', () =>
  alert('إتمام الشراء سيُضاف في وحدة الطلبات (orders) لاحقًا.'));

// تشغيل أولي
loadCategories();
loadProducts();
refreshCart();
