/* PackForge v3.14 — Ascendant Expansion + ultra-low-request static shell.
   The page is self-contained. After install, normal navigations are served from Cache Storage. */
const CACHE='packforge-shell-v3-14-clean-ui';
const SHELL='./index.html';
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.add(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(caches.match(SHELL).then(cached=>cached||fetch(request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(SHELL,copy));}
      return response;
    })));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
    return response;
  })));
});
