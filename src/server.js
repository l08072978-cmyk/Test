// نقطة الدخول: تشغيل الخادم.
import { createApp } from './app.js';
import { config } from './config/index.js';

const server = await createApp();

server.listen(config.port, config.host, () => {
  console.log(`🛒 ${config.store.name} يعمل على: http://localhost:${config.port}`);
});
