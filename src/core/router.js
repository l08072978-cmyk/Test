// موجّه (Router) بسيط مبني على وحدة http المدمجة في Node — بدون أي اعتماديات خارجية.
// يدعم متغيرات المسار مثل /products/:id ويجمع المسارات المسجّلة من كل الوحدات.

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler) {
    const { regex, keys } = compile(path);
    this.routes.push({ method: method.toUpperCase(), regex, keys, handler });
  }

  get(path, handler) { this.register('GET', path, handler); }
  post(path, handler) { this.register('POST', path, handler); }
  put(path, handler) { this.register('PUT', path, handler); }
  patch(path, handler) { this.register('PATCH', path, handler); }
  delete(path, handler) { this.register('DELETE', path, handler); }

  /** يبحث عن أول مسار مطابق للطلب ويعيد المعالج مع متغيرات المسار. */
  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const m = route.regex.exec(pathname);
      if (!m) continue;
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(m[i + 1]); });
      return { handler: route.handler, params };
    }
    return null;
  }
}

// يحوّل '/products/:id' إلى تعبير نمطي مع استخراج أسماء المتغيرات.
function compile(path) {
  const keys = [];
  const pattern = path.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${pattern}$`), keys };
}
