/* Hands-on versions of four task screens: every screen has one clear thing to DO and teaches something by doing it.
   t1  health check: tap a body check, see a gauge with a green "normal" zone
   t2  breakfast: choose the space-safe food for each slot of your tray
   t3  suit: bigger picture
   t4  exploration: tap a place on the map and see risk and power as icons
   wB  power shortage: one clear column and big plan cards */
(function(){
  'use strict';
  var J = window.JAM;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function wrapScreen(name, fn){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){ var r = old ? old.apply(this, arguments) : undefined; try{ fn(root); }catch(e){ console.warn('redesign ' + name + ':', e.message); } return r; };
  }
  function hide(e){ if(e) e.style.display = 'none'; }
  function after0(fn){ setTimeout(fn, 0); }

  /* ================= t1: Health check ================= */
  var GAUGES = {
    vitals:  {e:'❤️', t:'Your heart', v:72, unit:'beats a minute', lo:60, hi:100, min:30, max:140, say:'Your heart pumps blood round your body. 60 to 100 beats a minute is healthy.'},
    pressure:{e:'💨', t:'Air in the base', v:101.3, unit:'kPa (air pressure)', lo:95, hi:105, min:80, max:120, say:'The base air pressure is about the same as on Earth, so you can breathe easily.'},
    temp:    {e:'🌡️', t:'Room warmth', v:21.5, unit:'°C', lo:20, hi:23, min:5, max:40, say:'20 to 23 degrees is a comfy room. Not too hot and not too cold.'},
    hepa:    {e:'🫧', t:'Air cleaners', v:98, unit:'% clean', lo:90, hi:100, min:50, max:100, say:'Clean filters catch dust, so the air you breathe stays fresh.'},
    drift:   {e:'⚠️', t:'Room 2 airflow', v:2.4, unit:'% off', lo:0, hi:1, min:0, max:4, say:'The air should flow evenly. Here it is a little off, so it needs fixing!', problem:true}
  };
  function gaugeHTML(g){
    var span = g.max - g.min, a = (g.lo - g.min) / span * 100, b = (g.hi - g.min) / span * 100, m = Math.max(0, Math.min(100, (g.v - g.min) / span * 100));
    var ok = g.v >= g.lo && g.v <= g.hi;
    return '<div style="text-align:center"><div style="font-size:3.4rem;line-height:1">'+g.e+'</div>'+
      '<div style="font-size:1.1rem;font-weight:800;margin:.3rem 0">'+esc(g.t)+'</div>'+
      '<div style="font-size:2.6rem;font-weight:900;color:'+(ok ? '#22ef7e' : '#ff5d73')+'">'+g.v+' <span style="font-size:1rem;font-weight:700">'+esc(g.unit)+'</span></div>'+
      '<div style="position:relative;height:1.1rem;border-radius:9999px;margin:1.2rem .4rem .4rem;background:linear-gradient(90deg,#ff5d73 0 '+a+'%,#22ef7e '+a+'% '+b+'%,#ff5d73 '+b+'% 100%)">'+
      '<div style="position:absolute;left:'+m+'%;top:-.55rem;transform:translateX(-50%);font-size:1.5rem;line-height:1">▼</div></div>'+
      '<div style="display:flex;justify-content:space-between;font-size:.8rem;font-weight:700;color:#bac9cc;margin:0 .4rem"><span>too low</span><span style="color:#22ef7e">normal: '+g.lo+' to '+g.hi+'</span><span>too high</span></div>'+
      '<p style="font-size:1.05rem;font-weight:700;margin:1rem 0 .2rem;line-height:1.4">'+(ok ? '✅ Normal. ' : '❌ Not normal. ')+esc(g.say)+'</p></div>';
  }
  wrapScreen('t1', function(root){
    var cal = window.calibrateDrift;
    var orig = window.selectDiagnostic;
    window.selectDiagnostic = function(key){
      try{ if(orig) orig.apply(this, arguments); }catch(e){}
      var g = GAUGES[key]; if(!g) return;
      var fixed = !!(document.getElementById('quick-recal-btn') && /Verified/i.test(document.getElementById('quick-recal-btn').textContent));
      var gg = g.problem && fixed ? {e:'✅', t:'Room 2 airflow', v:0.4, unit:'% off', lo:0, hi:1, min:0, max:4, say:'Fixed! The air flows evenly again.'} : g;
      var actions = (g.problem && !fixed) ? [{label:'FIX IT ›', cls:'gold', value:'fix'}, {label:'LATER', cls:'dim', value:'no'}] : [{label:'GOT IT', cls:'cyan', value:true}];
      J.modal({kicker:'Body and base check', title:'', html:gaugeHTML(gg), actions:actions}).then(function(v){
        if(v === 'fix'){ var rb = document.getElementById('quick-recal-btn'); if(rb) rb.click(); }
      });
    };
    after0(function(){
      // the long side panel is replaced by the gauge pop-up: hide it and let the cards fill the width
      var cols = root.querySelectorAll('main div[class*="lg:col-span-5"], main div[class*="lg:col-span-7"]');
      var left = null, right = null;
      Array.prototype.forEach.call(cols, function(c){ if(c.querySelector('#card-vitals')) left = c; else right = c; });
      if(right) hide(right);
      if(left){
        left.style.gridColumn = '1 / -1'; left.style.display = 'grid'; left.style.gridTemplateColumns = 'repeat(auto-fit,minmax(18rem,1fr))'; left.style.gap = '1rem';
        var h = left.firstElementChild; if(h && !h.id){ h.style.gridColumn = '1 / -1'; }
      }
      // cards: only the picture, the name and the button. The numbers come in the pop-up.
      Array.prototype.forEach.call(root.querySelectorAll('[id^="card-"]'), function(card){
        Array.prototype.forEach.call(card.querySelectorAll('div, span'), function(e){
          var cl = e.className && e.className.toString ? e.className.toString() : '';
          if(/text-body-sm/.test(cl) && /text-on-surface-variant/.test(cl)) e.style.display = 'none';          // the small description
          if(/overflow-hidden/.test(cl) && /h-3/.test(cl)) e.style.display = 'none';                           // the progress bar
          if(/text-label-sm/.test(cl) && /rounded-full/.test(cl) && !/ACTION NEEDED/i.test(e.textContent || '')) e.style.display = 'none';   // small status badges
        });
        card.style.cursor = 'pointer';
      });
      var t = null; Array.prototype.forEach.call(root.querySelectorAll('main *'), function(e){ if(!t && !e.children.length && /TOUCH TO INSPECT/i.test(e.textContent || '')) t = e; });
      if(t) t.textContent = 'TAP A CARD TO SEE THE NUMBER';
    });
  });

  /* ================= t2: Breakfast tray ================= */
  J.tray = {done:false, mistakes:0};
  var ROWS = [
    {cat:'Protein', e:'💪', opts:[{e:'🌯', t:'Egg tortilla wrap', ok:1, why:'The tortilla holds it together, so no crumbs float away.'}, {e:'🍪', t:'Crumbly cookie', why:'Crumbs float into the air filters and can break machines!'}]},
    {cat:'Veggies', e:'🥬', opts:[{e:'🥬', t:'Greenhouse spinach', ok:1, why:'Grown right here on the base. Full of iron and vitamin C.'}, {e:'🍟', t:'Loose chips', why:'Chips break into tiny crumbs that float away.'}]},
    {cat:'Fruit', e:'🍑', opts:[{e:'🍑', t:'Freeze-dried peach', ok:1, why:'Very light for the rocket. Add water and it is juicy again.'}, {e:'🍎', t:'Whole apple', why:'Biting makes crumbs and juice drops that float.'}]},
    {cat:'Drink', e:'🥤', opts:[{e:'🧃', t:'Sealed pouch with a straw', ok:1, why:'The drink cannot float out of the pouch.'}, {e:'🥛', t:'Open cup', why:'With no gravity the water floats out in round blobs!'}]}
  ];
  var TRAY_CSS =
    '#tray{max-width:62rem;margin:0 auto 1rem;padding:1rem;border:3px solid #00e5ff;border-radius:1.8rem;background:rgba(14,16,42,.8);box-shadow:0 0 30px rgba(0,229,255,.2)}'+
    '#tray h2{font-size:1.8rem;font-weight:900;margin:0 0 .2rem;text-align:center}#tray .tr-sub{text-align:center;font-weight:700;color:#bac9cc;margin:0 0 .8rem}'+
    '#tray .tr-slots{display:flex;justify-content:center;gap:.7rem;margin:.4rem 0 1rem}'+
    '#tray .tr-slot{width:4.6rem;height:4.6rem;border-radius:1rem;border:3px dashed #5a6fe0;background:#14206a;display:grid;place-items:center;font-size:2.4rem}'+
    '#tray .tr-slot.full{border-style:solid;border-color:#22ef7e;background:rgba(34,239,126,.15)}'+
    '#tray .tr-row{margin:.6rem 0;padding:.6rem;border-radius:1.2rem;background:rgba(255,255,255,.05)}'+
    '#tray .tr-row.done{opacity:.55}'+
    '#tray .tr-cat{font-weight:900;letter-spacing:.06em;text-transform:uppercase;font-size:.8rem;color:#ffb300;margin:0 0 .4rem}'+
    '#tray .tr-opts{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}'+
    '#tray .tr-opt{display:flex;align-items:center;gap:.7rem;padding:.7rem .8rem;border-radius:1.1rem;border:3px solid rgba(255,255,255,.22);background:rgba(30,34,78,.9);color:#fff;font-weight:800;font-size:1.05rem;cursor:pointer;font-family:inherit;text-align:left}'+
    '#tray .tr-opt .em{font-size:2.4rem;flex:none}#tray .tr-opt:hover{border-color:#00e5ff}'+
    '#tray .tr-opt.good{border-color:#22ef7e;background:rgba(34,239,126,.18)}#tray .tr-opt.bad{border-color:#ff5d73;background:rgba(255,93,115,.16);animation:trshake .35s}'+
    '@keyframes trshake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'+
    '#tray .tr-why{min-height:2.6rem;margin-top:.8rem;text-align:center;font-weight:800;font-size:1.05rem;line-height:1.35}'+
    '#tray .tr-why.good{color:#22ef7e}#tray .tr-why.bad{color:#ff8a98}'+
    '@media (max-width:640px){#tray .tr-opts{grid-template-columns:1fr}#tray h2{font-size:1.4rem}}';
  wrapScreen('t2', function(root){
    J.tray = {done:false, mistakes:0};
    var main = root.querySelector('main'); if(!main) return;
    var cta = null;
    Array.prototype.forEach.call(main.querySelectorAll('button'), function(b){ if(!cta && /EAT BREAKFAST/i.test(b.textContent)) cta = b; });
    var ctaBox = cta ? (cta.closest('div.flex-col') || cta.parentElement) : null;
    var box = document.createElement('section'); box.id = 'tray'; box.setAttribute('data-nosimple', '1');
    box.innerHTML = '<style>'+TRAY_CSS+'</style><h2>Pick your space breakfast 🍽️</h2><p class="tr-sub">Tap the food that is safe to eat in space.</p><div class="tr-slots" id="trSlots"></div><div id="trRows"></div><div class="tr-why" id="trWhy"></div>';
    // everything else on the old screen is hidden; the real "eat" button moves under the tray
    Array.prototype.forEach.call(Array.prototype.slice.call(main.children), function(k){ k.style.display = 'none'; });
    main.insertBefore(box, main.firstChild);
    if(ctaBox){
      main.appendChild(ctaBox); ctaBox.style.display = ''; ctaBox.style.maxWidth = '34rem'; ctaBox.style.margin = '0 auto';
      Array.prototype.forEach.call(ctaBox.children, function(c){ if(c !== cta && !c.contains(cta)) c.style.display = 'none'; });
    }
    var slots = box.querySelector('#trSlots'), rows = box.querySelector('#trRows'), why = box.querySelector('#trWhy');
    var picked = [null, null, null, null];
    function drawSlots(){ slots.innerHTML = picked.map(function(p){ return '<div class="tr-slot '+(p ? 'full' : '')+'">'+(p || '')+'</div>'; }).join(''); }
    drawSlots();
    ROWS.forEach(function(r, i){
      var opts = Math.random() < .5 ? r.opts.slice() : r.opts.slice().reverse();
      var row = document.createElement('div'); row.className = 'tr-row';
      row.innerHTML = '<div class="tr-cat">'+r.e+' '+r.cat+'</div><div class="tr-opts">'+opts.map(function(o, n){ return '<button type="button" class="tr-opt" data-ok="'+(o.ok ? 1 : 0)+'" data-n="'+n+'"><span class="em">'+o.e+'</span><span>'+esc(o.t)+'</span></button>'; }).join('')+'</div>';
      Array.prototype.forEach.call(row.querySelectorAll('.tr-opt'), function(b, n){
        b.onclick = function(){
          if(row.classList.contains('done')) return;
          var o = opts[n];
          why.className = 'tr-why ' + (o.ok ? 'good' : 'bad'); why.textContent = (o.ok ? '✅ ' : '❌ ') + o.why;
          if(o.ok){
            J.sfx.good(); b.classList.add('good'); row.classList.add('done'); picked[i] = o.e; drawSlots();
            Array.prototype.forEach.call(row.querySelectorAll('.tr-opt'), function(x){ x.disabled = true; });
            if(picked.every(Boolean)){ J.tray.done = true; why.className = 'tr-why good'; why.textContent = '🎉 Your tray is ready! Now eat your breakfast.'; J.coachSet('Your tray is ready! Press <b>EAT BREAKFAST</b>.', /EAT BREAKFAST/i); }
          } else { J.sfx.miss(); J.tray.mistakes++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); }
        };
      });
      rows.appendChild(row);
    });
    // the real button waits until the tray is full
    if(cta) cta.addEventListener('click', function(e){
      if(!J.tray.done){ e.stopImmediatePropagation(); e.preventDefault(); J.sfx.miss(); J.toast('Fill your tray first. Pick one food in each row.'); }
    }, true);
    J.coachFor.t2 = ['Tap the <b>safe food</b> in each row.', null];
  });

  /* ================= t3: bigger suit picture ================= */
  wrapScreen('t3', function(root){
    after0(function(){
      var pins = null;
      Array.prototype.forEach.call(root.querySelectorAll('main div'), function(e){ if(!pins && /max-w-\[340px\]/.test(e.className)) pins = e; });
      if(!pins) return;
      pins.style.zoom = '1.7';
      var area = pins.parentElement; if(area){ area.style.height = 'auto'; area.style.minHeight = '620px'; }
    });
  });

  /* ================= t4: exploration places as picture cards ================= */
  var PLACES = {
    rim:    {e:'🌋', t:'Crater rim', risk:1, power:1, find:'Close to the base. Plain rocks.'},
    ridge:  {e:'⛰️', t:'Rock ridge', risk:2, power:2, find:'Broken rocks. More to find, but farther.'},
    shadow: {e:'❄️', t:'Dark crater', risk:3, power:3, find:'Always dark and freezing. Maybe ice!'},
    flat:   {e:'📏', t:'Flat ground', risk:1, power:1, find:'Very safe. Measure heat and dust.'}
  };
  function meter(n, icon){ var s = ''; for(var i = 1; i <= 3; i++) s += '<span style="opacity:'+(i <= n ? 1 : .22)+'">'+icon+'</span>'; return s; }
  wrapScreen('t4', function(root){
    var orig = window.selectLocation;
    var cardEl = null;
    function show(k){
      var p = PLACES[k]; if(!p || !cardEl) return;
      cardEl.innerHTML = '<div style="display:flex;align-items:center;gap:1rem"><div style="font-size:3.6rem">'+p.e+'</div><div><div style="font-size:1.7rem;font-weight:900">'+esc(p.t)+'</div>'+
        '<div style="font-weight:700;color:#e1e1f7">'+esc(p.find)+'</div></div></div>'+
        '<div style="display:flex;gap:2rem;margin-top:.9rem;font-size:1.7rem;flex-wrap:wrap"><div><div style="font-size:.72rem;font-weight:900;letter-spacing:.08em;color:#ffb300">DANGER</div>'+meter(p.risk, '⚠️')+'</div>'+
        '<div><div style="font-size:.72rem;font-weight:900;letter-spacing:.08em;color:#ffb300">POWER USED</div>'+meter(p.power, '🔋')+'</div></div>';
    }
    window.selectLocation = function(k){ try{ if(orig) orig.apply(this, arguments); }catch(e){} show(k); };
    after0(function(){
      var det = root.querySelector('#detail-title'); var col = det ? det.closest('div[class*="lg:col-span-5"]') : null;
      if(!col) return;
      cardEl = document.createElement('div'); cardEl.id = 'placeCard'; cardEl.setAttribute('data-nosimple', '1');
      cardEl.style.cssText = 'padding:1.1rem 1.2rem;border:3px solid #00e5ff;border-radius:1.6rem;background:rgba(14,16,42,.85);box-shadow:0 0 26px rgba(0,229,255,.25);color:#fff';
      Array.prototype.forEach.call(Array.prototype.slice.call(col.children), function(c){
        if(!c.querySelector('#confirm-btn') && !/CHOOSE THIS PLACE|SEND THE ROVER|RETURN TO BASE/i.test(c.textContent)) c.style.display = 'none';
      });
      col.insertBefore(cardEl, col.firstChild);
      show('rim');
      // the four small site tiles under the map repeat the same facts
      Array.prototype.forEach.call(root.querySelectorAll('main *'), function(e){ if(e.children.length < 6 && /Dark Rock Layers|Site 1/i.test(e.textContent || '') && e.className && /grid-cols-4/.test(e.className)) hide(e); });
    });
  });

  /* ================= wB: one clear column ================= */
  wrapScreen('wB', function(root){
    after0(function(){
      var cols = root.querySelectorAll('main div[class*="lg:col-span-5"], main div[class*="lg:col-span-7"]');
      var left = null, right = null;
      Array.prototype.forEach.call(cols, function(c){ if(c.querySelector('#decisionGroup')) right = c; else left = c; });
      if(left){ hide(left); }
      if(right){ right.style.gridColumn = '1 / -1'; }
      var g = root.querySelector('#decisionGroup');
      if(g){ g.style.display = 'grid'; g.style.gridTemplateColumns = 'repeat(auto-fit,minmax(16rem,1fr))'; g.style.gap = '1rem'; }
    });
  });
})();
