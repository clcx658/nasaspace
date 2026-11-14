/* Real space-weather context from NASA's DONKI database, via our own /api/donki function (the NASA key stays on the server).
   If the live feed is not available (offline, GitHub Pages, no key yet) a clearly labelled EXAMPLE is shown instead,
   so the experience never breaks. This real data is for context only: it never changes the mission or the evaluation. */
(function(){
  'use strict';
  var J = window.JAM;
  var SAMPLE = {ok:true, sample:true, type:'FLR', days:30, count:0, strongest:null, items:[]};

  function fetchFlares(){
    return new Promise(function(resolve){
      var done = false;
      function finish(v){ if(done) return; done = true; clearTimeout(timer); resolve(v); }
      var timer = setTimeout(function(){ finish(SAMPLE); }, 5000);
      try{
        fetch('/api/donki?type=FLR&days=30', {headers:{accept:'application/json'}})
          .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('http')); })
          .then(function(d){ finish(d && d.ok ? d : SAMPLE); })
          .catch(function(){ finish(SAMPLE); });
      }catch(e){ finish(SAMPLE); }
    });
  }
  function fmtDate(iso){
    var d = new Date(iso); if(isNaN(d)) return null;
    return d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function panelHTML(d){
    var live = !d.sample && d.count > 0 && d.strongest && d.strongest.classType;
    var head = live ? 'REAL NASA DATA · DONKI' : 'EXAMPLE · LIVE NASA FEED NOT AVAILABLE';
    var body;
    if(live){
      var when = fmtDate(d.strongest.beginTime);
      body = 'In the last <b>'+d.days+' days</b>, NASA recorded <b>'+d.count+' solar flare'+(d.count === 1 ? '' : 's')+'</b>. The strongest was class <b>'+esc(d.strongest.classType)+'</b>'+(when ? ' on <b>'+when+'</b>' : '')+'.';
    } else if(!d.sample){
      body = 'NASA recorded <b>no solar flares</b> in the last <b>'+d.days+' days</b>. Quiet Sun!';
      head = 'REAL NASA DATA · DONKI';
    } else {
      body = 'Scientists record solar flares every day in NASA\'s DONKI database. A strong <b>X-class</b> flare is the kind of event this mission practises for.';
    }
    return '<div class="flex items-start gap-3">'+
      '<span class="material-symbols-outlined text-primary-container" style="font-size:2rem;font-variation-settings:\'FILL\' 1">'+(live ? 'satellite_alt' : 'wb_sunny')+'</span>'+
      '<div class="flex-1"><div class="text-label-sm font-label-sm font-extrabold tracking-wider '+(live ? 'text-tertiary-container' : 'text-secondary-container')+'">'+head+'</div>'+
      '<p class="text-body-md font-body-md text-on-surface mt-1">'+body+'</p>'+
      '<p class="text-body-sm font-body-sm text-on-surface-variant mt-1">Flares are ranked A, B, C, M and X. <b>X</b> is the strongest. The storm in this mission is <b>simulated</b>; this note is real science for context.</p>'+
      '<a class="inline-block mt-2 underline text-primary-container text-label-md font-label-md font-extrabold" href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener">Explore NASA DONKI ↗</a></div></div>';
  }

  /* Insert the card near the top of the screen's main area, then fill it in when the data arrives. */
  J.donkiPanel = function(root){
    var host = root.querySelector('main') || root;
    var box = document.createElement('div');
    box.setAttribute('data-donki', '1');
    box.className = 'rounded-3xl border-2 border-primary-container bg-surface-container-low p-4 my-4 mx-auto max-w-5xl shadow-[0_0_16px_rgba(0,229,255,0.15)]';
    box.innerHTML = '<div class="text-body-md font-body-md text-on-surface-variant">Checking NASA\'s space-weather database…</div>';
    var first = host.firstElementChild;
    if(first && first.nextSibling) host.insertBefore(box, first.nextSibling); else host.appendChild(box);
    fetchFlares().then(function(d){ if(document.body.contains(box)) box.innerHTML = panelHTML(d); });
    return box;
  };
  J.donki = {flares:fetchFlares, panelHTML:panelHTML};
})();
