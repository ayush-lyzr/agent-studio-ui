// No-op Service Worker to kill old SW
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());