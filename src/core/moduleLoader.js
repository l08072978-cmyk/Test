// مُحمّل الوحدات (Module Loader) — جوهر الطابع المعياري للمشروع.
// يكتشف تلقائيًا كل مجلد داخل src/modules، ويستدعي ملف index.js فيه
// لتسجيل مساراته وبياناته الأولية. لإضافة ميزة جديدة لاحقًا:
// أنشئ مجلدًا جديدًا في src/modules يُصدّر register(router) — لا تعديل هنا.

import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modulesDir = join(__dirname, '..', 'modules');

export async function loadModules(router) {
  const entries = await readdir(modulesDir, { withFileTypes: true });
  const loaded = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const moduleEntry = join(modulesDir, entry.name, 'index.js');
    const moduleUrl = pathToFileURL(moduleEntry).href;

    const mod = await import(moduleUrl);
    if (typeof mod.register !== 'function') {
      console.warn(`⚠️  الوحدة "${entry.name}" لا تُصدّر دالة register — تم تخطّيها.`);
      continue;
    }

    // seed() اختيارية لتعبئة بيانات تجريبية أولية.
    if (typeof mod.seed === 'function') await mod.seed();

    mod.register(router);
    loaded.push(mod.name ?? entry.name);
  }

  return loaded;
}
