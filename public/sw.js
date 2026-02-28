const CACHE = "corto-v1";
const PRECACHE = ["/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

// Install: precache icons + manifest, activate immediately
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

// Activate: delete old caches, take control of all tabs immediately
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first for icons/manifest (always try fresh), fallback to cache
self.addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url);
  if (PRECACHE.includes(pathname)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request)),
    );
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Corto", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        // App already open: focus it and tell it to navigate via postMessage
        const client = list[0];
        client.focus();
        client.postMessage({ type: "navigate", url });
      } else {
        // App closed: open at the correct URL
        clients.openWindow(url);
      }
    })
  );
});
