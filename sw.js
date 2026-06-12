const CACHE_NAME = 'fathalla-receiving-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './logo.png'
];

// التثبيت المبدئي للملفات في الذاكرة
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل المحرك وتصفية النسخ القديمة تلقائياً
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// إستراتيجية (Network-First): جلب البيانات من الإنترنت أولاً للتحديث الفوري، والرجوع للكاش عند انقطاع الشبكة
self.addEventListener('fetch', (e) => {
  // حماية وتصفية الطلبات لمنع توقف نظام الأوفلاين بسبب إضافات المتصفحات
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
