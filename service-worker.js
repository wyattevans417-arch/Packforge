/* PackForge v4.0.1 Arena Season 2 + Admin Core production cache shell. */
const CACHE='packforge-v4-0-1-s2-admin';
const SHELL=[
  './index.html',
  './css/packforge.css?v=4.0.1-s2-admin',
  './js/packforge-core.js?v=4.0.1-s2-admin'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{
      if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}
      return resp;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{
    if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
    return resp;
  })));
});
