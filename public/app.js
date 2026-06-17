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
};

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
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
}

function productCard(p) {
  return `
    <div class="product-card">
      <div class="thumb">🧰</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.description || ''}</p>
      <div class="price">${p.price} د.إ</div>
      <button data-add="${p.id}">أضف إلى السلة</button>
    </div>`;
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
