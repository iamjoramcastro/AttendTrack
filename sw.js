var CACHE='at-v12';
var SHELL=[
  './',
  './index.html',
  './manifest.json',
  './images/AttendTrack.png',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=Oswald:wght@500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-solid-900.woff2',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];
var FB_HOSTS=['firebaseio.com','googleapis.com','securetoken.googleapis.com','identitytoolkit.googleapis.com','firebaseapp.com'];

function isCacheable(url){
  return url.protocol==='http:'||url.protocol==='https:';
}

function isFB(url){
  return FB_HOSTS.some(function(h){return url.hostname.indexOf(h)>-1;});
}

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return Promise.allSettled(SHELL.map(function(u){
        return cache.add(u).catch(function(err){console.warn('[SW] Failed to cache:',u,err);});
      }));
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  var url;
  try{url=new URL(req.url);}catch(err){return;}

  if(!isCacheable(url)){
    return;
  }

  if(isFB(url)){
    e.respondWith(fetch(req).catch(function(){return new Response('{"error":"offline"}',{status:503,headers:{'Content-Type':'application/json'}});}));
    return;
  }

  if(req.method!=='GET'){
    e.respondWith(fetch(req).catch(function(){return new Response('',{status:503});}));
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached){
      var networkFetch=fetch(req).then(function(res){
        if(res&&res.status===200&&(res.type==='basic'||res.type==='cors')&&isCacheable(url)){
          var clone=res.clone();
          caches.open(CACHE).then(function(cache){cache.put(req,clone);});
        }
        return res;
      }).catch(function(){return null;});
      if(cached)return cached;
      return networkFetch.then(function(res){return res||caches.match('./index.html');});
    })
  );
});

self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
