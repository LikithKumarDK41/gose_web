const APP_CACHE = "tourist-v1";
const SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(SHELL)));
    self.skipWaiting();
});
self.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k === APP_CACHE ? null : caches.delete(k)))));
    self.clients.claim();
});
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    // Opportunistic cache for map tiles/styles (allowed by many open providers; check TOS)
    if (url.hostname.includes("maplibre") || url.pathname.includes("/tiles") || url.pathname.endsWith(".pbf") || url.pathname.endsWith(".png")) {
        event.respondWith((async () => {
            try {
                const net = await fetch(event.request);
                const cache = await caches.open(APP_CACHE);
                cache.put(event.request, net.clone());
                return net;
            } catch {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                throw new Error("offline");
            }
        })());
        return;
    }
    // default: cache-first for shell, else network
    event.respondWith(caches.match(event.request).then(c => c || fetch(event.request)));
});
