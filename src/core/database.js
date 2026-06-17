// طبقة تخزين مجرّدة (Repository) قائمة على الذاكرة.
// الغرض منها عزل منطق الأعمال عن قاعدة البيانات الفعلية،
// بحيث يمكن لاحقًا استبدالها بـ PostgreSQL أو MongoDB دون تغيير الوحدات.

let nextId = 1;

/**
 * يُنشئ مجموعة (collection) جديدة في الذاكرة لكل كيان.
 * كل وحدة (module) تطلب مجموعتها الخاصة عبر db.collection('name').
 */
class Collection {
  constructor(name) {
    this.name = name;
    this.items = new Map();
  }

  all() {
    return [...this.items.values()];
  }

  find(predicate) {
    return this.all().filter(predicate);
  }

  findOne(predicate) {
    return this.all().find(predicate) ?? null;
  }

  getById(id) {
    return this.items.get(String(id)) ?? null;
  }

  insert(data) {
    const id = String(data.id ?? nextId++);
    const record = { id, ...data, createdAt: new Date().toISOString() };
    this.items.set(id, record);
    return record;
  }

  update(id, patch) {
    const existing = this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date().toISOString() };
    this.items.set(String(id), updated);
    return updated;
  }

  remove(id) {
    return this.items.delete(String(id));
  }

  count() {
    return this.items.size;
  }
}

class Database {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection(name));
    }
    return this.collections.get(name);
  }
}

// نسخة واحدة مشتركة (singleton) عبر التطبيق.
export const db = new Database();
