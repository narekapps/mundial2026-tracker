// Mundial 2026 Tracker — Service Worker
const CACHE = "mundial2026-v5";

// Archivos que se cachean para uso offline
const ASSETS = [
  "/mundial2026-tracker/",
  "/mundial2026-tracker/index.html",
  "/mundial2026-tracker/manifest.json",
  "/mundial2026-tracker/icon-192.png",
  "/mundial2026-tracker/icon-512.png",
];

// Instalación: cachear assets esenciales
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: servir desde cache, fallback a red
self.addEventListener("fetch", e => {
  // Requests a APIs externas (Gemini) siempre van a la red
  if(e.request.url.includes("googleapis.com") ||
     e.request.url.includes("anthropic.com") ||
     e.request.url.includes("jsdelivr.net")){
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        // Cachear nuevas respuestas locales
        if(res.ok && e.request.url.startsWith(self.location.origin)){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback para navegación
        if(e.request.mode === "navigate")
          return caches.match("/index.html");
      });
    })
  );
});
