var CACHE='attendtrack-v3';
var SHELL=[
  './',
  './index.html',
  './images/AttendTrack.png',
  'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=Oswald:wght@500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-regular-400.woff2',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

var FIREBASE_DOMAINS=[
  'firebaseio.com','firebaseapp.com','googleapis.com',
  'securetoken.googleapis.com','identitytoolkit.googleapis.com','firebase.google.com'
];

function isFirebase(url){
  return FIREBASE_DOMAINS.some(function(d){return url.hostname.includes(d);});
}

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return Promise.allSettled(SHELL.map(function(url){
        return cache.add(url).catch(function(){});
      }));
    }).then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  if(isFirebase(url)){
    e.respondWith(
      fetch(e.request).catch(function(){
        return new Response(JSON.stringify({error:'offline'}),{status:503,headers:{'Content-Type':'application/json'}});
      })
    );
    return;
  }
  if(e.request.method!=='GET'){
    e.respondWith(fetch(e.request).catch(function(){return new Response('',{status:503});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var network=fetch(e.request).then(function(res){
        if(res&&res.status===200){
          var clone=res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,clone);});
        }
        return res;
      }).catch(function(){return null;});
      return cached||network||new Response('Offline',{status:503});
    })
  );
});

self.addEventListener('sync',function(e){
  if(e.tag==='attendtrack-sync'){
    e.waitUntil(
      self.clients.matchAll().then(function(clients){
        clients.forEach(function(c){c.postMessage({type:'SYNC_NEEDED'});});
      })
    );
  }
});

self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
