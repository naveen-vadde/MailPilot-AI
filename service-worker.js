
const CACHE_NAME = "mailpilot-shell-v1";

const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/styles.css",
  "/js/app.js",
  "/js/config.js",
  "/js/gmail.js",
  "/js/categorizer.js",
  "/js/demo-data.js",
  "/js/icons.js",
  "/js/store.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache Gmail API or Google authentication requests.
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && url.pathname !== "/") {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy);
        });
      }

      return response;
    }).catch(async () => {
      return await caches.match(request) ||
        await caches.match("/index.html");
    })
  );
});
