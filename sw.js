const CACHE = "ppk-v11";
// Must-have files: the app itself.
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192-tiles.png", "icon-512-tiles.png", "apple-touch-icon-tiles.png"];
// Nice-to-have files: Bible text. A missing one never blocks an update.
const EXTRA = ["bible-kjv.json", "bible-web.json", "bible-asv.json", "bible-bbe.json", "bible-ylt.json"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE.map(u => new Request(u, {cache: "reload"})));
    await Promise.all(EXTRA.map(u => fetch(u, {cache: "reload"}).then(r => r.ok && c.put(u, r)).catch(() => {})));
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Pages: network first so updates show right away; saved copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return res; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Everything else: saved copy first, then network.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
