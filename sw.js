/* AI Video Studio v4.0 — scoped, update-friendly cache */
const CACHE_NAME = "aivs-v4-0-0";
const OWN_CACHE_PREFIX = "aivs-";
const CORE = ["./", "./index.html", "./styles.css", "./app.js?v=4.0.0", "./manifest.json"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE.map(async path => {
      try { const response = await fetch(path, { cache: "reload" }); if (response.ok) await cache.put(path, response); }
      catch (error) { console.warn("Не удалось предварительно сохранить:", path, error); }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(OWN_CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isAppShell = request.mode === "navigate" || /\/(index\.html|app\.js|styles\.css|manifest\.json)$/.test(url.pathname);
  if (isAppShell) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(request, { cache: "no-store" });
        if (fresh.ok) await cache.put(request, fresh.clone());
        return fresh;
      } catch (error) {
        return (await cache.match(request)) || (await cache.match("./index.html")) || Response.error();
      }
    })());
  }
});
