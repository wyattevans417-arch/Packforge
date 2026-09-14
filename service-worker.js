const CACHE='packforge-localonly-v3-11-chase-stability';
const ASSETS=['./','./css/game.bundle.v3.11.css?v=3.11.0','./js/game.bundle.v3.11.js?v=3.11.0','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'force-cache'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith(caches.match('./').then(cached=>cached||fetch(r).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./',copy))}return resp}).catch(()=>caches.match('./'))));return;
  }
  e.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return resp})));
});
