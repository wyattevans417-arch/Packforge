/* PackForge v3.29 performance shell. Core/styles cached; tutorial remains lazy. */
const CACHE='packforge-shell-v3-29-apology-integrity-r1';
const SHELL=['./index.html','./css/packforge.css','./css/v317.css','./css/v318.css','./css/v319.css','./css/v320.css','./css/v321.css','./css/v322.css','./css/v323.css','./css/v324.css','./css/v325.css','./css/v326.css','./css/v327.css','./css/v328.css','./js/packforge-core.js?v=3.29'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==self.location.origin)return;if(r.mode==='navigate'){event.respondWith(caches.match('./index.html').then(c=>c||fetch(r)));return}event.respondWith(caches.match(r).then(c=>c||fetch(r).then(resp=>{if(resp&&resp.ok){const cp=resp.clone();caches.open(CACHE).then(cache=>cache.put(r,cp))}return resp}))) });
