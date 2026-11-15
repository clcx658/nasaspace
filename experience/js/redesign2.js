/* More hands-on screens:
   t5  rub the dust off three solar panels with your finger (no auto button)
   t6  tap one of three report cards (nothing is chosen for you)
   eval a short "day done" screen
   and the bottom bar (Mission / Base HQ / Quests) is hidden while a task is running */
(function(){
  'use strict';
  var J = window.JAM;
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function wrapScreen(name, fn){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){ var r = old ? old.apply(this, arguments) : undefined; try{ fn(root); }catch(e){ console.warn('redesign2 ' + name + ':', e.message); } return r; };
  }
  function findBtn(root, re){
    var all = root.querySelectorAll('button, a');
    for(var i = 0; i < all.length; i++){ var b = all[i]; if(re.test((b.textContent || '').replace(/\s+/g, ' ')) || (b.__orig && re.test(b.__orig))) return b; }
    return null;
  }
  /* hide everything the old screen had, put our own box first */
  function takeOver(root, box){
    var main = root.querySelector('main'); if(!main) return null;
    Array.prototype.forEach.call(Array.prototype.slice.call(main.children), function(k){ k.style.display = 'none'; });
    main.insertBefore(box, main.firstChild);
    return main;
  }

  /* ---------- no bottom bar during tasks ---------- */
  var NONAV = /^(t[1-7]|wA|wB|wC|eval)$/;
  Object.keys(J.screens).forEach(function(name){
    var d = J.screens[name], old = d.bind;
    d.bind = function(root){ document.body.classList.toggle('no-nav', NONAV.test(name)); return old ? old.apply(this, arguments) : undefined; };
  });

  /* ================= t5: rub the dust off ================= */
  var CSS5 =
    '#scrub{width:100%;box-sizing:border-box;max-width:66rem;margin:0 auto 1rem;padding:1rem;border:3px solid #00e5ff;border-radius:1.8rem;background:rgba(14,16,42,.82);box-shadow:0 0 30px rgba(0,229,255,.2);color:#fff}'+
    '#scrub h2{font-size:1.9rem;font-weight:900;margin:0;text-align:center}#scrub .sc-sub{text-align:center;font-weight:700;color:#bac9cc;margin:.2rem 0 .8rem}'+
    '#scrub .sc-pw{max-width:30rem;margin:.2rem auto 1rem}#scrub .sc-pw-t{display:flex;justify-content:space-between;font-weight:900;font-size:1.05rem}'+
    '#scrub .sc-bar{height:1.1rem;border-radius:9999px;background:#1d2138;border:2px solid #3b494c;overflow:hidden;margin-top:.2rem}'+
    '#scrub .sc-fill{height:100%;width:8%;background:linear-gradient(90deg,#ff5d73,#ffb300 55%,#22ef7e);transition:width .25s}'+
    '#scrub .sc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem}'+
    '#scrub .sc-card{border:3px solid rgba(255,255,255,.2);border-radius:1.2rem;padding:.5rem;background:rgba(255,255,255,.04)}'+
    '#scrub .sc-card.clean{border-color:#22ef7e;background:rgba(34,239,126,.08)}'+
    '#scrub .sc-head{display:flex;justify-content:space-between;align-items:center;font-weight:900;margin:0 .2rem .4rem}'+
    '#scrub .sc-badge{font-size:.78rem;padding:.1rem .6rem;border-radius:9999px;background:rgba(255,179,0,.18);color:#ffb300}#scrub .sc-card.clean .sc-badge{background:rgba(34,239,126,.2);color:#22ef7e}'+
    '#scrub .sc-stage{position:relative;aspect-ratio:8/5;border-radius:.9rem;overflow:hidden;background:#0a1030;touch-action:none}'+
    '#scrub .sc-cells{position:absolute;inset:6%;display:grid;grid-template-columns:repeat(3,1fr);gap:5%;transition:filter .6s}'+
    '#scrub .sc-cells i{border-radius:.35rem;background:linear-gradient(135deg,#2b6cff,#0c2a7a);border:2px solid #7aa8ff;box-shadow:inset 0 0 10px rgba(255,255,255,.25)}'+
    '#scrub .sc-card.clean .sc-cells i{background:linear-gradient(135deg,#43e3ff,#1a73ff);box-shadow:0 0 14px rgba(67,227,255,.8),inset 0 0 12px rgba(255,255,255,.5)}'+
    '#scrub canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab;touch-action:none;transition:opacity .6s}#scrub .sc-card.clean canvas{opacity:0;pointer-events:none}'+
    '#scrub .sc-hint{position:absolute;left:10%;top:42%;font-size:3rem;pointer-events:none;animation:schint 1.6s ease-in-out infinite;z-index:3;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))}'+
    '@keyframes schint{0%,100%{transform:translateX(0) rotate(-12deg)}50%{transform:translateX(9rem) rotate(12deg)}}'+
    '#scrub .sc-ok{position:absolute;inset:0;display:none;place-items:center;font-size:3.6rem;font-weight:900;color:#fff;pointer-events:none;z-index:3;text-shadow:0 0 20px #22ef7e,0 2px 6px rgba(0,0,0,.5)}#scrub .sc-card.clean .sc-ok{display:grid}'+
    '#scrub .sc-win{display:none;text-align:center;margin:1rem auto 0;max-width:36rem;font-weight:800;font-size:1.15rem;line-height:1.4}'+
    '#scrub .sc-foot{display:flex;justify-content:center;gap:.8rem;flex-wrap:wrap;margin-top:1rem}'+
    '.sc-back{border:2px solid #3b494c;background:#1d2138;color:#e1e1f7;border-radius:9999px;padding:.5rem 1.1rem;font-weight:800;cursor:pointer;font-family:inherit}'+
    '@media (max-width:760px){#scrub .sc-grid{grid-template-columns:1fr}#scrub h2{font-size:1.5rem}#scrub .sc-hint{font-size:2.2rem}}'+
    '@media (prefers-reduced-motion:reduce){#scrub .sc-hint{animation:none}}';
  wrapScreen('t5', function(root){
    var finish = findBtn(root, /FINISH CLEANING|CONFIRM POWER/i), auto = root.querySelector('#auto-clean-btn');
    var box = document.createElement('section'); box.id = 'scrub'; box.setAttribute('data-nosimple', '1');
    box.innerHTML = '<style>'+CSS5+'</style><h2>Wipe the dust off the panels! 🧽</h2><p class="sc-sub">Rub each dusty panel with your finger or mouse.</p>'+
      '<div class="sc-pw"><div class="sc-pw-t"><span>⚡ Power from the panels</span><span id="scKw">6 kW</span></div><div class="sc-bar"><div class="sc-fill" id="scFill"></div></div></div>'+
      '<div class="sc-grid" id="scGrid"></div><div class="sc-win" id="scWin">🌟 All clean! Clean panels make more power. Moon dust is sticky, so astronauts wipe it off often.</div>'+
      '<div class="sc-foot" id="scFoot"></div>';
    var main = takeOver(root, box); if(!main) return;
    var grid = box.querySelector('#scGrid'), foot = box.querySelector('#scFoot'), win = box.querySelector('#scWin');
    var back = document.createElement('button'); back.type = 'button'; back.className = 'sc-back'; back.textContent = '← Base HQ';
    back.onclick = function(){ J.sfx.tap(); J.go('hub'); }; foot.appendChild(back);
    if(finish){ finish.style.display = 'none'; foot.appendChild(finish); finish.style.minWidth = '16rem'; finish.__orig = (finish.__orig ? finish.__orig + ' ' : '') + 'FINISH CLEANING CONFIRM POWER MAINTENANCE'; finish.innerHTML = '<span>FINISH CLEANING ›</span>'; }
    var W = 480, H = 300, frac = [0, 0, 0], clean = [false, false, false], all = false;
    function kw(){ var t = 0; frac.forEach(function(f){ t += 2 + 6.5 * Math.min(1, f); }); return t; }
    function paintPower(){ var t = kw(); box.querySelector('#scKw').textContent = t.toFixed(1) + ' kW'; box.querySelector('#scFill').style.width = Math.round(t / 25.5 * 100) + '%'; }
    paintPower();
    function dust(ctx){
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#8b7a69'; ctx.fillRect(0, 0, W, H);
      var cols = ['rgba(110,95,80,.55)', 'rgba(165,150,130,.45)', 'rgba(70,60,52,.4)', 'rgba(190,175,155,.35)'];
      for(var i = 0; i < 700; i++){ ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 13, 0, 6.3); ctx.fill(); }
    }
    ['A', 'B', 'C'].forEach(function(lab, idx){
      var card = document.createElement('div'); card.className = 'sc-card';
      card.innerHTML = '<div class="sc-head"><span>Panel '+lab+'</span><span class="sc-badge">Dusty</span></div>'+
        '<div class="sc-stage"><div class="sc-cells"><i></i><i></i><i></i><i></i><i></i><i></i></div><canvas width="'+W+'" height="'+H+'" class="sc-canvas" aria-label="Dusty panel '+lab+'. Rub to clean."></canvas><div class="sc-ok">✓</div>'+(idx === 0 ? '<div class="sc-hint" id="scHint">🧽</div>' : '')+'</div>';
      grid.appendChild(card);
      var cv = card.querySelector('canvas'), ctx = cv.getContext('2d'); dust(ctx);
      var down = false, lx = 0, ly = 0, lastCheck = 0;
      function pos(e){ var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
      function measure(){
        var d = ctx.getImageData(0, 0, W, H).data, hit = 0, n = 0;
        for(var y = 0; y < H; y += 6) for(var x = 0; x < W; x += 6){ n++; if(d[(y * W + x) * 4 + 3] < 40) hit++; }
        return hit / n;
      }
      function done(){
        clean[idx] = true; frac[idx] = 1; card.classList.add('clean'); card.querySelector('.sc-badge').textContent = 'Clean ✓';
        J.sfx.good(); paintPower();
        if(clean.every(Boolean) && !all){ all = true; finishAll(); }
      }
      function check(){
        if(clean[idx]) return; var f = measure(); frac[idx] = f; paintPower();
        if(f >= 0.82) done();
      }
      cv.addEventListener('pointerdown', function(e){
        e.preventDefault(); down = true; var p = pos(e); lx = p[0]; ly = p[1];
        try{ cv.setPointerCapture(e.pointerId); }catch(x){}
        var h = box.querySelector('#scHint'); if(h) h.remove();
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(lx, ly, 28, 0, 6.3); ctx.fill();
      });
      cv.addEventListener('pointermove', function(e){
        if(!down) return; var p = pos(e);
        ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 58; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p[0], p[1]); ctx.stroke(); lx = p[0]; ly = p[1];
        var now = Date.now(); if(now - lastCheck > 140){ lastCheck = now; check(); }
      });
      function up(){ if(!down) return; down = false; check(); }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', function(){ if(down) up(); });
    });
    function finishAll(){
      win.style.display = 'block';
      setTimeout(function(){
        if(auto) auto.click();                       // tell the old screen logic that every cell is clean
        if(finish){ finish.style.display = ''; }
        J.coachSet('✅ All clean! Press <b>FINISH CLEANING</b>.', /FINISH CLEANING|CONFIRM POWER/i);
      }, 500);
    }
    J.coachFor.t5 = ['Rub each dusty panel with your finger to clean it.', null];
  });

  /* ================= t6: choose a report ================= */
  var CSS6 =
    '#reports{width:100%;box-sizing:border-box;max-width:66rem;margin:0 auto 1rem;padding:1rem;border:3px solid #00e5ff;border-radius:1.8rem;background:rgba(14,16,42,.82);box-shadow:0 0 30px rgba(0,229,255,.2);color:#fff}'+
    '#reports h2{font-size:1.9rem;font-weight:900;margin:0;text-align:center}#reports .rp-sub{text-align:center;font-weight:700;color:#bac9cc;margin:.2rem 0 1rem}'+
    '#reports .rp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}'+
    '#reports .rp-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.4rem;padding:1.2rem .8rem;border-radius:1.4rem;border:4px solid rgba(255,255,255,.22);background:rgba(30,34,78,.9);color:#fff;cursor:pointer;font-family:inherit;transition:transform .12s,border-color .15s}'+
    '#reports .rp-card:hover{border-color:#00e5ff;transform:translateY(-3px)}#reports .rp-card:active{transform:translateY(1px)}'+
    '#reports .rp-card.sel{border-color:#22ef7e;background:rgba(34,239,126,.16);box-shadow:0 0 26px rgba(34,239,126,.35)}'+
    '#reports .rp-ico{font-size:4rem;line-height:1}#reports .rp-name{font-size:1.35rem;font-weight:900}#reports .rp-d{font-size:1rem;font-weight:700;color:#d8def5}'+
    '#reports .rp-pw{font-size:.72rem;font-weight:900;letter-spacing:.08em;color:#ffb300;margin-top:.4rem}#reports .rp-b{font-size:1.5rem}'+
    '#reports .rp-tick{height:1.5rem;font-weight:900;color:#22ef7e}'+
    '#reports .rp-foot{display:flex;justify-content:center;gap:.8rem;flex-wrap:wrap;margin-top:1.2rem}'+
    '#reports .rp-send{border:0;border-radius:9999px;padding:1rem 2.4rem;font-weight:900;font-size:1.2rem;letter-spacing:.03em;text-transform:uppercase;color:#0b0d1b;background:#00e5ff;box-shadow:0 5px 0 #009bb0;cursor:pointer;font-family:inherit}'+
    '#reports .rp-send.off{background:#3b494c;color:#9aa3b5;box-shadow:none}'+
    '@media (max-width:760px){#reports .rp-grid{grid-template-columns:1fr}#reports .rp-card{flex-direction:row;text-align:left;padding:.8rem}#reports .rp-ico{font-size:2.8rem}#reports h2{font-size:1.5rem}}';
  var REPORTS = [
    {k:'A', e:'📋', t:'Full report', d:'Everything: science, health and pictures.', b:3},
    {k:'B', e:'🛡️', t:'Safety report', d:'Air and water news and storm warnings.', b:1},
    {k:'C', e:'🔬', t:'Science report', d:'Rock results and pictures of the dark crater.', b:4}
  ];
  wrapScreen('t6', function(root){
    var send = findBtn(root, /TRANSMIT REPORT/i);
    var box = document.createElement('section'); box.id = 'reports'; box.setAttribute('data-nosimple', '1');
    box.innerHTML = '<style>'+CSS6+'</style><h2>Send a report to Earth 🛰️</h2><p class="rp-sub">Mission Control is waiting. Tap one report.</p><div class="rp-grid" id="rpGrid"></div><div class="rp-foot" id="rpFoot"></div>';
    var main = takeOver(root, box); if(!main) return;
    var grid = box.querySelector('#rpGrid'), foot = box.querySelector('#rpFoot');
    var cards = {};
    REPORTS.forEach(function(r){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rp-card'; b.setAttribute('data-k', r.k);
      var bat = ''; for(var i = 1; i <= 4; i++) bat += '<span style="opacity:'+(i <= r.b ? 1 : .2)+'">🔋</span>';
      b.innerHTML = '<span class="rp-ico">'+r.e+'</span><span class="rp-name">'+r.t+'</span><span class="rp-d">'+r.d+'</span><span class="rp-pw">POWER USED</span><span class="rp-b">'+bat+'</span><span class="rp-tick"></span>';
      b.onclick = function(){
        J.sfx.tap();
        // press the matching hidden control of the old screen so its scoring logic knows the choice
        var real = r.k === 'A' ? findBtn(root, /Select Full Report/i) : r.k === 'C' ? findBtn(root, /Select Science Only/i) : null;
        if(real) real.click();
        else Array.prototype.forEach.call(root.querySelectorAll('h4'), function(h){ if(/Safety Priority/i.test(h.textContent)) h.click(); });
        Object.keys(cards).forEach(function(k){ cards[k].classList.toggle('sel', k === r.k); cards[k].querySelector('.rp-tick').textContent = k === r.k ? '✅ Chosen' : ''; });
        if(send){ send.classList.remove('off'); }
      };
      cards[r.k] = b; grid.appendChild(b);
    });
    var back = document.createElement('button'); back.type = 'button'; back.className = 'sc-back'; back.textContent = '← Base HQ';
    back.onclick = function(){ J.sfx.tap(); J.go('hub'); }; foot.appendChild(back);
    if(send){
      send.className = 'rp-send off'; send.style.cssText = ''; send.innerHTML = 'SEND REPORT ›'; send.__orig = 'TRANSMIT REPORT'; foot.appendChild(send); send.style.display = '';
    }
    J.coachFor.t6 = ['Tap <b>one report</b>, then press <b>SEND REPORT</b>.', null];
  });

  /* ================= eval: the day is done ================= */
  var CSSE =
    '#evalDone{width:100%;box-sizing:border-box;max-width:44rem;margin:1rem auto;padding:1.4rem 1rem 1.2rem;border:3px solid #ffb300;border-radius:1.8rem;background:rgba(14,16,42,.82);box-shadow:0 0 34px rgba(255,179,0,.25);color:#fff;text-align:center}'+
    '#evalDone h2{font-size:2.2rem;font-weight:900;margin:.2rem 0}#evalDone .ev-sub{font-weight:700;color:#bac9cc;margin:0 0 1rem}'+
    '#evalDone .ev-row{display:grid;grid-template-columns:repeat(7,1fr);gap:.4rem;margin:.6rem 0 1.2rem}'+
    '#evalDone .ev-t{position:relative;font-size:2.2rem;padding:.5rem 0;border-radius:1rem;background:rgba(255,255,255,.07)}'+
    '#evalDone .ev-t b{position:absolute;right:2px;bottom:-2px;font-size:1rem;background:#22ef7e;color:#04210f;border-radius:50%;width:1.3rem;height:1.3rem;line-height:1.3rem}'+
    '#evalDone .ev-big{font-size:4rem;font-weight:900;color:#ffb300;line-height:1}#evalDone .ev-of{font-size:1.1rem;font-weight:800;color:#bac9cc}'+
    '#evalDone .ev-go{display:inline-block;margin-top:1.2rem;border:0;border-radius:9999px;padding:1.1rem 2.4rem;font-weight:900;font-size:1.25rem;text-transform:uppercase;color:#0b0d1b;background:#ffb300;box-shadow:0 6px 0 #c68400;cursor:pointer;font-family:inherit;animation:evp 1.5s ease-in-out infinite}'+
    '@keyframes evp{50%{box-shadow:0 6px 0 #c68400,0 0 34px 8px rgba(255,179,0,.5)}}'+
    '@media (max-width:600px){#evalDone h2{font-size:1.6rem}#evalDone .ev-t{font-size:1.5rem}}@media (prefers-reduced-motion:reduce){#evalDone .ev-go{animation:none}}';
  wrapScreen('eval', function(root){
    var reveal = findBtn(root, /REVEAL MY MISSION ENDING/i);
    var sc = J.score();
    var box = document.createElement('section'); box.id = 'evalDone'; box.setAttribute('data-nosimple', '1');
    var icons = ['🩺', '🍽️', '🧑‍🚀', '🧭', '🔋', '📡', '🛏️'];
    box.innerHTML = '<style>'+CSSE+'</style><div style="font-size:3.2rem">🌙</div><h2>Your Moon day is done!</h2><p class="ev-sub">You finished all 7 tasks.</p>'+
      '<div class="ev-row">'+icons.map(function(i){ return '<div class="ev-t">'+i+'<b>✓</b></div>'; }).join('')+'</div>'+
      '<div class="ev-big">'+sc.total+'</div><div class="ev-of">points out of 50</div><div id="evGo"></div>';
    var main = takeOver(root, box); if(!main) return;
    if(reveal){ reveal.className = 'ev-go'; reveal.style.cssText = ''; reveal.innerHTML = 'See my ending ›'; reveal.__orig = 'REVEAL MY MISSION ENDING'; box.querySelector('#evGo').appendChild(reveal); reveal.style.display = ''; }
    J.coachFor.eval = ['Press <b>See my ending</b>.', null];
  });
})();
