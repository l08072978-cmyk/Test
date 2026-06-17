// مُحمّل الوحدات (Module Loader).
// يمرّ على سجلّ الوحدات بالترتيب، يُعبّئ بياناتها الأولية (إن وُجدت)،
// ثم يسجّل مساراتها في الموجّه. لإضافة وحدة: عدّل modules/registry.js فقط.

import { modules } from '../modules/registry.js';

export async function loadModules(router) {
  const loaded = [];

  for (const mod of modules) {
    if (typeof mod.register !== 'function') {
      console.warn(`⚠️  الوحدة "${mod.name ?? '?'}" لا تُصدّر دالة register — تم تخطّيها.`);
      continue;
    }

    // seed() اختيارية لتعبئة بيانات تجريبية أولية.
    if (typeof mod.seed === 'function') await mod.seed();

    mod.register(router);
    loaded.push(mod.name ?? 'module');
  }

  return loaded;
}
