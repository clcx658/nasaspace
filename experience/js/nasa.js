/* Real NASA pictures: a small "Real NASA photo" strip on the menu (Picture of the Day) and on each Moon-day task.
   Photos come from our own /api/nasa function (the NASA key stays on the server). If NASA cannot be reached the strip
   simply does not appear, so nothing breaks. These pictures are for learning only: they never change the score. */
(function(){
  'use strict';
  var J = window.JAM;
  var TOPIC = {t1:'lab', t2:'food', t3:'suit', t4:'crater', t5:'panels', t6:'earth', t7:'moon'};
  var cache = {};

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function get(url){
    if(cache[url]) return cache[url];
    cache[url] = new Promise(function(resolve){
      var done = false, timer = setTimeout(function(){ finish(null); }, 9000);
      function finish(v){ if(done) return; done = true; clearTimeout(timer); if(!v) delete cache[url]; resolve(v); }
      try{
        fetch(url, {headers:{accept:'application/json'}})
          .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('http')); })
          .then(function(d){ finish(d && d.ok ? d : null); })
          .catch(function(){ finish(null); });
      }catch(e){ finish(null); }
    });
    return cache[url];
  }
  function fmtDate(iso){
    var d = new Date(iso); if(isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
  }

  /* big picture in a pop-up; "ANOTHER PHOTO" walks through the list */
  function openPhoto(list, i, label){
    var p = list[i % list.length];
    var more = list.length > 1;
    var html = '<div data-nosimple="1">'+
      '<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" style="width:100%;max-height:52vh;object-fit:contain;border-radius:1rem;background:#0b0d1b;margin:.2rem 0 .6rem">'+
      '<p style="font-weight:800;font-size:1.05rem;margin:.1rem 0">'+esc(p.title)+'</p>'+
      (p.text ? '<p style="margin:.3rem 0">'+esc(p.text)+'</p>' : '')+
      '<p style="font-size:.8rem;color:#bac9cc;margin:.3rem 0">'+(p.date ? esc(fmtDate(p.date))+' · ' : '')+(p.credit ? 'Photo: '+esc(p.credit)+' · ' : '')+'Picture from NASA. '+
      '<a href="'+esc(p.link)+'" target="_blank" rel="noopener" style="color:#00e5ff;font-weight:800">See it on NASA ↗</a></p></div>';
    var actions = more ? [{label:'ANOTHER PHOTO', cls:'gold', value:'next'}, {label:'CLOSE', cls:'cyan', value:true}] : [{label:'CLOSE', cls:'cyan', value:true}];
    J.modal({kicker:label || 'Real NASA photo', title:'', html:html, actions:actions}).then(function(v){
      if(v === 'next') openPhoto(list, i + 1, label);
    });
  }

  /* the compact strip. It is added at the end of the screen so it never pushes the real task away. */
  function strip(root, url, label, intro, pick){
    var host = root.querySelector('main') || root;
    var box = document.createElement('div');
    box.setAttribute('data-nasa-photo', '1');
    box.setAttribute('data-nosimple', '1');
    box.style.display = 'none';
    host.appendChild(box);
    get(url).then(function(d){
      if(!document.body.contains(box)) return;
      var list = d ? (d.photos || (d.title ? [d] : [])) : [];
      if(!list.length) return;                      // NASA not reachable: show nothing
      var start = pick === 'random' ? Math.floor(Math.random() * list.length) : 0;
      var p = list[start % list.length];
      box.className = 'nasa-strip';
      box.style.display = '';
      if(d.fallback) intro = 'A real NASA space picture';
      box.innerHTML = '<button type="button" class="nasa-strip-btn" aria-label="Open the NASA photo: '+esc(p.title)+'">'+
        '<img src="'+esc(p.image)+'" alt="" loading="lazy">'+
        '<span class="nasa-strip-t"><b>'+esc(label)+'</b><span>'+esc(intro)+'</span><em>'+esc(p.title)+'</em></span>'+
        '<span class="nasa-strip-go" aria-hidden="true">Look ›</span></button>';
      var img = box.querySelector('img');
      img.onerror = function(){ box.style.display = 'none'; };
      box.querySelector('button').onclick = function(){ J.sfx.tap(); openPhoto(list, start, label); };
    });
  }

  J.nasaTaskPhoto = function(root, topic){ strip(root, '/api/nasa?kind=photo&topic='+encodeURIComponent(topic), 'REAL NASA PHOTO', 'See the real thing!', 'random'); };
  J.nasaDaily = function(root){ strip(root, '/api/nasa?kind=apod', 'TODAY FROM NASA', 'Space picture of the day', 'first'); };

  /* add the strips to the screens without touching their own code */
  function wrap(name, fn){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){ var r = old ? old.apply(this, arguments) : undefined; try{ fn(root); }catch(e){ console.warn('nasa strip:', e.message); } return r; };
  }
  wrap('menu', function(root){ J.nasaDaily(root); });
  Object.keys(TOPIC).forEach(function(id){ wrap(id, function(root){ J.nasaTaskPhoto(root, TOPIC[id]); }); });
})();
