const V = "slb-v1";
const SHELL = ["./", "index.html", "manifest.json", "Icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then(res => {
          if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put("index.html", cp)); }
          return res;
        })
        .catch(() => caches.match("index.html").then(m => m || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(m => {
      const net = fetch(r)
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
        .catch(() => m);
      return m || net;
    })
  );
});
