/* Mini-games. Each returns a Promise that resolves to {ok, hint, help, ...}.
   Scored ones resolve with ok:false when the attempt fails; story.js counts attempts. */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$;
  var M = J.mini = {};

  function overlay(arena, ico, how){
    return new Promise(function(resolve){
      var o = document.createElement('div'); o.className = 'overlay';
      o.innerHTML = '<div class="big">'+ico+' '+how+'</div><button class="btn">GO!</button>';
      arena.appendChild(o);
      var b = o.querySelector('button');
      b.onclick = function(){ o.remove(); J.sfx.alarm(); resolve(); };
      b.focus({preventScroll:true});
    });
  }
  function alive(el){ return document.body.contains(el); }

  /* ---------------------------------------------------------------
     1. LAUNCH CONTROL PANEL (training/journey, not scored)
     Set four gauges into the green safe zone.
  --------------------------------------------------------------- */
  M.launchPanel = function(host){
    return new Promise(function(resolve){
      var G = [
        {e:'💨', name:'Oxygen', unit:'%', min:10, max:30, step:1, safe:[20,22], v:J.pick([15,17,26,28])},
        {e:'🌡️', name:'Temperature', unit:'°C', min:10, max:35, step:1, safe:[20,24], v:J.pick([15,17,29,31])},
        {e:'🎈', name:'Cabin pressure', unit:' kPa', min:80, max:120, step:2, safe:[99,103], v:J.pick([88,92,110,114])},
        {e:'🔋', name:'Battery power', unit:'%', min:0, max:100, step:5, safe:[90,100], v:J.pick([55,60,65,70])}
      ];
      host.innerHTML = '<div class="panel"><h3>🎛️ Control panel: put every gauge in the green zone</h3><div id="gs"></div><div id="fb"></div>'+
        '<div class="cta"><button class="btn" id="chk">CHECK SYSTEMS ✔</button></div></div>';
      var gs = $('gs');
      function pct(g){ return (g.v-g.min)/(g.max-g.min)*100; }
      G.forEach(function(g,i){
        var row = document.createElement('div'); row.className = 'gauge';
        row.innerHTML = '<span class="g-name">'+g.e+' '+g.name+'</span>'+
          '<button class="g-btn" aria-label="Lower '+g.name+'">−</button>'+
          '<div class="g-bar"><div class="g-zone" style="left:'+((g.safe[0]-g.min)/(g.max-g.min)*100)+'%;width:'+((g.safe[1]-g.safe[0])/(g.max-g.min)*100)+'%"></div><div class="g-needle"></div></div>'+
          '<button class="g-btn" aria-label="Raise '+g.name+'">+</button><b class="g-val"></b>';
        gs.appendChild(row);
        var btns = row.querySelectorAll('.g-btn');
        function draw(){ row.querySelector('.g-needle').style.left = pct(g)+'%'; row.querySelector('.g-val').textContent = g.v+g.unit; row.classList.remove('bad'); }
        btns[0].onclick = function(){ g.v = Math.max(g.min, g.v-g.step); J.sfx.tap(); draw(); };
        btns[1].onclick = function(){ g.v = Math.min(g.max, g.v+g.step); J.sfx.tap(); draw(); };
        draw();
      });
      $('chk').onclick = function(){
        var rows = gs.querySelectorAll('.gauge'), bad = 0;
        G.forEach(function(g,i){
          var ok = g.v>=g.safe[0] && g.v<=g.safe[1];
          rows[i].classList.toggle('bad', !ok); if(!ok) bad++;
        });
        if(bad){ J.sfx.miss(); $('fb').innerHTML = '<div class="hintline">'+bad+' gauge'+(bad>1?'s are':' is')+' still outside the green zone. Use − and +.</div>'; }
        else { J.sfx.good(); $('chk').disabled = true; resolve({ok:true}); }
      };
    });
  };

  /* ---------------------------------------------------------------
     2. ASTRONAUT DRESS-UP (journey: lenient / suit-up task: strict + damage check)
  --------------------------------------------------------------- */
  var SETS = {
    journey:[
      {slot:'Helmet', e:'🪖', items:[{e:'⛑️',t:'Bike helmet',d:'for bikes, not space'},{e:'🧑‍🚀',t:'Space helmet',d:'keeps your air in',ok:1},{e:'🥽',t:'Swim goggles',d:'for the pool'}]},
      {slot:'Gloves', e:'🧤', items:[{e:'🌱',t:'Garden gloves',d:'for digging plants'},{e:'🧤',t:'Space gloves',d:'tough and warm',ok:1},{e:'🍳',t:'Oven mitts',d:'for the kitchen'}]},
      {slot:'Oxygen backpack', e:'🎒', items:[{e:'🎒',t:'School bag',d:'holds books, not air'},{e:'💨',t:'Oxygen backpack',d:'gives you air',ok:1},{e:'🏖️',t:'Beach bag',d:'holds towels'}]},
      {slot:'Boots', e:'🥾', items:[{e:'🩴',t:'Sandals',d:'toes get cold'},{e:'🌧️',t:'Rain boots',d:'for puddles'},{e:'🥾',t:'Space boots',d:'made for the Moon',ok:1}]}
    ],
    eva:[
      {slot:'Helmet', e:'🪖', items:[{e:'🔍',t:'Clear-visor helmet',d:'for inside the base'},{e:'😎',t:'Gold-visor helmet',d:'blocks the bright sun',ok:1},{e:'💔',t:'Scratched-visor helmet',d:'hard to see through'}]},
      {slot:'Gloves', e:'🧤', items:[{e:'🧤',t:'Thin indoor gloves',d:'for inside the base'},{e:'🧤',t:'Warm moon gloves',d:'tough and warm',ok:1},{e:'🧴',t:'Rubber gloves',d:'for washing dishes'}]},
      {slot:'Oxygen backpack', e:'🎒', items:[{e:'🫙',t:'Small spare tank',d:'runs out fast'},{e:'💨',t:'Full air backpack',d:'lots of air',ok:1},{e:'🕳️',t:'Empty pack',d:'no air left!'}]},
      {slot:'Boots', e:'🥾', items:[{e:'👟',t:'Slippery indoor shoes',d:'slide on Moon dust'},{e:'🥾',t:'Grippy moon boots',d:'grip the Moon dust',ok:1},{e:'🩴',t:'Light sandals',d:'toes get cold'}]}
    ]
  };

  M.dressUp = function(host, o){
    o = o || {};
    return new Promise(function(resolve){
      var set = SETS[o.set || 'journey'], eq = [null,null,null,null], sel = 0;
      host.innerHTML = '<div class="panel"><h3>'+(o.title||'🧑‍🚀 Dress up: choose the right gear for each slot')+'</h3>'+
        '<div class="dress"><svg viewBox="0 0 200 240" aria-hidden="true"><use href="#astro"/></svg><div class="slots" id="slots"></div></div>'+
        '<div class="mini-note" id="pickhint"></div><div class="tray" id="tray"></div><div id="fb"></div>'+
        '<div class="cta"><button class="btn" id="insp" disabled>SAFETY INSPECTION ✔</button></div></div>';
      function drawSlots(){
        var h = '';
        set.forEach(function(s,i){
          var it = eq[i] !== null ? s.items[eq[i]] : null;
          h += '<button class="slot '+(it?'full':'')+' '+(it && !it.ok ? 'bad' : '')+' '+(sel===i?'sel':'')+'" data-i="'+i+'"><span class="e">'+(it?it.e:s.e)+'</span>'+(it?it.t:s.slot+'?')+'</button>';
        });
        $('slots').innerHTML = h;
        var bs = $('slots').querySelectorAll('.slot');
        for(var i=0;i<bs.length;i++) bs[i].onclick = function(){ sel = +this.getAttribute('data-i'); J.sfx.tap(); drawSlots(); drawTray(); };
        $('insp').disabled = eq.indexOf(null) >= 0;
      }
      function drawTray(){
        var s = set[sel], h = '';
        s.items.forEach(function(it,i){ h += '<button class="item '+(eq[sel]===i?'pick':'')+'" data-i="'+i+'"><span class="e">'+it.e+'</span>'+it.t+(it.d ? '<small class="why">'+it.d+'</small>' : '')+'</button>'; });
        $('tray').innerHTML = h;
        $('pickhint').innerHTML = 'Pick the best <b>'+s.slot.toLowerCase()+'</b> for walking <b>outside</b> on the Moon:';
        var bs = $('tray').querySelectorAll('.item');
        for(var i=0;i<bs.length;i++) bs[i].onclick = function(){
          var picked = +this.getAttribute('data-i'), pit = set[sel].items[picked];
          eq[sel] = picked;
          // tell the child straight away if the pick is right, so they know what to do next
          if(pit.ok){ J.sfx.good(); $('fb').innerHTML = '<div class="hintline" style="border-left-color:#22ef7e">✅ Yes! '+(pit.t)+(pit.d ? ': '+pit.d : '')+'.</div>'; }
          else { J.sfx.miss(); $('fb').innerHTML = '<div class="hintline" style="border-left-color:#ff5d73">❌ Not this one'+(pit.d ? ' ('+pit.d+')' : '')+'. Tap it again or pick another piece.</div>'; }
          var nxt = pit.ok ? eq.indexOf(null) : -1; if(nxt >= 0) sel = nxt;
          drawSlots(); drawTray();
        };
      }
      drawSlots(); drawTray();

      function damageCheck(){
        var dmg = J.rand(0,3), seen = [false,false,false,false];
        host.innerHTML = '<div class="panel"><h3>🔍 Check the suit for damage: tap each piece</h3>'+
          '<div class="mini-note">Look closely! One piece may have a problem.</div><div class="igrid" style="grid-template-columns:repeat(2,1fr)" id="dg"></div><div id="fb"></div></div>';
        var grid = $('dg'), left = 4;
        set.forEach(function(s,i){
          var it = s.items[eq[i]];
          var b = document.createElement('button'); b.className = 'item';
          b.innerHTML = '<span class="e">'+it.e+'</span>'+it.t;
          b.onclick = function(){
            if(seen[i]) return; seen[i] = true; left--;
            if(i === dmg){ b.classList.add('bad'); b.innerHTML = '<span class="e">⚠️</span>Crack found! Replaced ✔'; J.sfx.alarm(); }
            else { b.classList.add('pick'); b.innerHTML = '<span class="e">✅</span>'+it.t+' OK'; J.sfx.tap(); }
            if(left === 0){ J.sfx.good(); setTimeout(function(){ resolve({ok:true, damaged:s.slot}); }, 700); }
          };
          grid.appendChild(b);
        });
      }

      $('insp').onclick = function(){
        var wrong = [];
        set.forEach(function(s,i){ if(!s.items[eq[i]].ok) wrong.push(i); });
        if(!wrong.length){ J.sfx.good(); if(o.damage) damageCheck(); else resolve({ok:true}); return; }
        J.sfx.miss();
        var names = wrong.map(function(i){ return set[i].slot; }).join(', ');
        if(o.strict){
          resolve({ok:false, hint:'The inspector says: wrong gear for the '+names+'.', help:'Pick the thing made for space. It keeps you safe and gives you air.'});
        } else {
          $('fb').innerHTML = '<div class="hintline">Inspector: check your '+names+'! Choose gear made for space.</div>';
          var ss = $('slots').querySelectorAll('.slot');
          wrong.forEach(function(i){ ss[i].classList.add('bad'); });
        }
      };
    });
  };

  /* ---------------------------------------------------------------
     3. HEALTH CHECK (Task 1): find the abnormal instrument, pick the right response
  --------------------------------------------------------------- */
  var INST = [
    {e:'❤️', name:'Heart rate', ok:'72 bpm', range:'Normal: 60–100', bad:'118 bpm',
     good:'Rest, drink water and tell Mission Control', wrong:'Go for a run', fix:'A fast heartbeat can mean stress or tiredness. Rest and report it.'},
    {e:'💨', name:'Cabin oxygen', ok:'21 %', range:'Normal: 20–22 %', bad:'16 %',
     good:'Check the oxygen tanks and start the backup', wrong:'Wait until tomorrow', fix:'Low oxygen is dangerous. Act early.'},
    {e:'🌡️', name:'Temperature', ok:'22 °C', range:'Normal: 18–25 °C', bad:'31 °C',
     good:'Check the cooling pipes and heaters', wrong:'Open the airlock to cool down', fix:'The air must stay inside. Fix the cooling system instead.'},
    {e:'🛠️', name:'Life support', ok:'Filters clean', range:'Normal: clean filters', bad:'Filter FULL',
     good:'Clean or replace the filter', wrong:'Switch life support off', fix:'Life support must stay on. Replace the full filter.'}
  ];
  M.INST = INST;

  M.healthCheck = function(host, abn){
    return new Promise(function(resolve){
      var strikes = 0, done = false;
      host.innerHTML = '<div class="panel"><h3>🩺 Morning check: tap the reading that is NOT normal</h3><div class="inst-grid" id="ig"></div><div id="fb"></div></div>';
      var ig = $('ig');
      INST.forEach(function(it,i){
        var b = document.createElement('button'); b.className = 'inst';
        b.innerHTML = '<span class="e">'+it.e+'</span><b>'+it.name+'</b><span class="v">'+(i===abn?it.bad:it.ok)+'</span><span class="r">'+it.range+'</span>';
        b.onclick = function(){
          if(done) return;
          if(i === abn){ done = true; b.classList.add('ok'); J.sfx.alarm(); respond(it); }
          else {
            strikes++; b.classList.add('shake'); J.sfx.miss();
            setTimeout(function(){ b.classList.remove('shake'); }, 450);
            if(strikes >= 2){ done = true; resolve({ok:false, hint:'You missed the abnormal reading. Compare each number with its "Normal" range.', help:'The abnormal one is the '+INST[abn].name+'.'}); }
            else $('fb').innerHTML = '<div class="hintline">That reading is normal. Compare the number with its range.</div>';
          }
        };
        ig.appendChild(b);
      });
      function respond(it){
        var opts = J.shuffle([{t:it.good, ok:true},{t:it.wrong, ok:false}]);
        $('fb').innerHTML = '<div class="hintline">Found it: '+it.name+' is abnormal! What is the right response?</div><div class="opts" id="resp"></div>';
        opts.forEach(function(o){
          var b = document.createElement('button'); b.className = 'opt'; b.textContent = o.t;
          b.onclick = function(){
            var all = $('resp').querySelectorAll('.opt'); for(var k=0;k<all.length;k++) all[k].disabled = true;
            if(o.ok){ b.classList.add('ok'); J.sfx.good(); setTimeout(function(){ resolve({ok:true}); }, 600); }
            else { b.classList.add('no'); J.sfx.miss(); setTimeout(function(){ resolve({ok:false, hint:'Not the best response. '+it.fix, help:'Choose the safe fix, not the quick one.'}); }, 900); }
          };
          $('resp').appendChild(b);
        });
        $('resp').scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    });
  };

  /* ---------------------------------------------------------------
     4. BREAKFAST (Task 2): grab floating food before it drifts away
  --------------------------------------------------------------- */
  M.breakfast = async function(host){
    host.innerHTML = '<div class="arena food" id="fa"><div class="hudline"><span class="score" id="fscore">Grabbed 0/6</span><div class="timer"><i id="ftimer"></i></div></div></div><div class="tray-row" id="trayRow" aria-label="Food in your tray"></div>';
    var arena = $('fa');
    await overlay(arena, '🍞', 'There is no gravity! Tap the floating food to grab it into your tray.');
    return new Promise(function(resolve){
      var emojis = ['🍞','🥕','🍎','🧃','🥜','🍪'], DUR = 14000, W = arena.clientWidth, H = arena.clientHeight, S = 56;
      var items = [], got = 0, over = false, t0 = performance.now(), last = t0;
      var tb = $('ftimer'); void tb.offsetWidth; tb.style.transition = 'width '+DUR+'ms linear'; tb.style.width = '0';
      emojis.forEach(function(e){
        var b = document.createElement('button'); b.className = 'float-item'; b.textContent = e; b.setAttribute('aria-label','Grab '+e);
        var it = {el:b, x:J.rand(10, W-S-10), y:J.rand(40, H-S-10), vx:(Math.random()<.5?-1:1)*J.rand(30,55), vy:(Math.random()<.5?-1:1)*J.rand(25,50), got:false};
        b.onclick = function(){
          if(it.got || over) return; it.got = true; got++; b.remove(); J.sfx.tap();
          $('fscore').textContent = 'Grabbed '+got+'/6'; $('trayRow').insertAdjacentHTML('beforeend', '<span>'+e+'</span>');
          if(got === 6) finish();
        };
        arena.appendChild(b); items.push(it);
      });
      function finish(){
        if(over) return; over = true;
        if(got === 6){ J.sfx.good(); setTimeout(function(){ resolve({ok:true, lost:0}); }, 500); }
        else { J.sfx.bad(); resolve({ok:false, lost:6-got, hint:'Some food floated away! Grab each item before the timer runs out.', help:'Tap the slow, close ones first. Food that floats off is wasted.'}); }
      }
      function frame(now){
        if(over || !alive(arena)) return;
        var dt = Math.min(.05,(now-last)/1000); last = now;
        var speed = 1 + (now-t0)/14000;
        items.forEach(function(it){
          if(it.got) return;
          it.x += it.vx*dt*speed; it.y += it.vy*dt*speed;
          if(it.x < 0){ it.x = 0; it.vx = Math.abs(it.vx); } if(it.x > W-S){ it.x = W-S; it.vx = -Math.abs(it.vx); }
          if(it.y < 34){ it.y = 34; it.vy = Math.abs(it.vy); } if(it.y > H-S){ it.y = H-S; it.vy = -Math.abs(it.vy); }
          it.el.style.transform = 'translate('+it.x+'px,'+it.y+'px)'; it.el.style.left = '0'; it.el.style.top = '0';
        });
        if(now - t0 >= DUR) finish(); else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  };

  /* ---------------------------------------------------------------
     5. MOON ROCK COLLECTOR (Task 4): dig for three different samples
  --------------------------------------------------------------- */
  M.rocks = function(host, cfg){
    return new Promise(function(resolve){
      var COLS = 4, N = 12, digs = cfg.digs || 9, over = false;
      var order = J.shuffle(Array.apply(null,Array(N)).map(function(_,i){ return i; }));
      var hidden = {}, req = cfg.required, extras = cfg.extras || [];
      req.forEach(function(r,i){ hidden[order[i]] = {name:r.name, e:r.e, req:true}; });
      extras.forEach(function(x,i){ hidden[order[req.length+i]] = {name:x.name, e:x.e, req:false}; });
      var found = {}, foundExtras = [];
      host.innerHTML = '<div class="arena rocks"><div class="mini-note" id="rinfo"></div><div class="rgrid" id="rg"></div>'+
        '<div class="rtray" id="rt"></div></div>';
      function near(i){
        var r = Math.floor(i/COLS), c = i%COLS, n = 0;
        for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++){
          if(!dr && !dc) continue; var rr=r+dr, cc=c+dc;
          if(rr<0||rr>=N/COLS||cc<0||cc>=COLS) continue; if(hidden[rr*COLS+cc]) n++;
        }
        return n;
      }
      function drawInfo(){ $('rinfo').innerHTML = '⛏️ Digs left: <b>'+digs+'</b>. A number tells how many samples hide <u>next to</u> that spot.'; }
      function drawTray(){
        $('rt').innerHTML = req.map(function(r){ return '<div class="rslot '+(found[r.name]?'got':'')+'">'+(found[r.name]?r.e+' '+r.name+' ✔':'? '+r.kind)+'</div>'; }).join('');
      }
      var grid = $('rg');
      for(var i=0;i<N;i++){
        (function(i){
          var b = document.createElement('button'); b.className = 'cell'; b.setAttribute('aria-label','Dig here'); b.textContent = '';
          b.onclick = function(){
            if(over || b.disabled) return; b.disabled = true; digs--;
            var h = hidden[i];
            if(h){
              b.className = 'cell found'; b.innerHTML = '<span class="e">'+h.e+'</span>'+h.name; J.sfx.good();
              if(h.req) found[h.name] = true; else foundExtras.push(h.name);
            } else { b.className = 'cell dug'; b.textContent = near(i); J.sfx.tap(); }
            drawInfo(); drawTray();
            var all = req.every(function(r){ return found[r.name]; });
            if(all){ over = true; setTimeout(function(){ resolve({ok:true, extras:foundExtras}); }, 900); }
            else if(digs <= 0){ over = true; J.sfx.bad(); setTimeout(function(){ resolve({ok:false, hint:'You ran out of digs. Use the numbers: a 0 means nothing is next to that spot!', help:'Dig where the numbers are high. Samples are never far from a 1, 2 or 3.'}); }, 900); }
          };
          grid.appendChild(b);
        })(i);
      }
      drawInfo(); drawTray();
    });
  };

  /* ---------------------------------------------------------------
     6. POWER CABLE PUZZLE (Task 5): find dusty panel, clean it, connect cables
  --------------------------------------------------------------- */
  var COLS = 4, ROWS = 3, BASE = {I:[1,3], L:[0,1]};
  function dirsOf(t){ return BASE[t.type].map(function(d){ return (d+t.rot)%4; }); }
  function sameSet(a,b){ return (a[0]===b[0]&&a[1]===b[1]) || (a[0]===b[1]&&a[1]===b[0]); }
  function dirTo(a,b){ if(b[0]>a[0]) return 1; if(b[0]<a[0]) return 3; if(b[1]>a[1]) return 2; return 0; }
  function buildPuzzle(){
    for(var attempt=0; attempt<200; attempt++){
      var r = J.rand(0,ROWS-1), src = r, cells = [];
      for(var c=0;c<COLS;c++){
        var out = J.rand(0,ROWS-1), step = out>=r?1:-1, rr = r;
        while(true){ cells.push([c,rr]); if(rr===out) break; rr += step; }
        r = out;
      }
      var dst = r, tiles = [], need = 0, row, col;
      for(row=0;row<ROWS;row++){ tiles[row] = []; for(col=0;col<COLS;col++) tiles[row][col] = {type:J.pick(['I','L']), rot:J.rand(0,3)}; }
      cells.forEach(function(cell,i){
        var prev = cells[i-1], next = cells[i+1];
        var inD = prev ? dirTo(cell,prev) : 3, outD = next ? dirTo(cell,next) : 1;
        var type = ((inD+2)%4===outD) ? 'I' : 'L', solved = 0;
        for(var rot=0;rot<4;rot++) if(sameSet(BASE[type].map(function(d){ return (d+rot)%4; }), [inD,outD])){ solved = rot; break; }
        var k = type==='I' ? J.rand(0,1) : J.rand(0,3);
        var t = {type:type, rot:(solved+k)%4};
        for(var n=0;n<4;n++){ if(sameSet(dirsOf({type:type, rot:(t.rot+n)%4}), [inD,outD])){ need += n; break; } }
        tiles[cell[1]][cell[0]] = t;
      });
      if(need >= 3 && need <= 10) return {tiles:tiles, src:src, dst:dst, need:need};
    }
    return null;
  }
  function trace(p){
    var c = 0, r = p.src, from = 3, path = [];
    for(var guard=0; guard<30; guard++){
      var opens = dirsOf(p.tiles[r][c]);
      if(opens.indexOf(from) < 0) return {ok:false, path:path};
      path.push(r*COLS+c);
      var out = opens[0]===from ? opens[1] : opens[0];
      if(out===1 && c===COLS-1 && r===p.dst) return {ok:true, path:path};
      var nc = c + (out===1?1:out===3?-1:0), nr = r + (out===2?1:out===0?-1:0);
      if(nc<0||nc>=COLS||nr<0||nr>=ROWS) return {ok:false, path:path};
      c = nc; r = nr; from = (out+2)%4;
    }
    return {ok:false, path:path};
  }
  var EDGE = {0:'M32 32L32 0', 1:'M32 32L64 32', 2:'M32 32L32 64', 3:'M32 32L0 32'};

  M.power = function(host, cfg){
    return new Promise(function(resolve){
      var strikes = 0, weak = cfg.weak;
      function phase1(){
        host.innerHTML = '<div class="panel"><h3>☀️ Step 1: which solar panel makes the least power?</h3><div class="panels" id="pn"></div><div id="fb"></div></div>';
        cfg.outputs.forEach(function(v,i){
          var b = document.createElement('button'); b.className = 'sp'; b.innerHTML = '▦ Panel '+(i+1)+'<small>Output '+v+'%</small>';
          b.onclick = function(){
            if(i === weak){ J.sfx.good(); phase2(); }
            else {
              strikes++; b.classList.add('shake'); J.sfx.miss();
              if(strikes >= 2) resolve({ok:false, hint:'The panel with the lowest output is the one with a problem.', help:'Look for the smallest "Output" number.'});
              else $('fb').innerHTML = '<div class="hintline">That panel is working well. Find the lowest output.</div>';
            }
          };
          $('pn').appendChild(b);
        });
      }
      function phase2(){
        host.innerHTML = '<div class="panel"><h3>🧹 Step 2: Moon dust is covering Panel '+(weak+1)+'. Tap it to brush the dust off!</h3><div class="panels" id="pn"></div><div class="mini-note" id="fb">Moon dust is sharp and sticky.</div></div>';
        var dust = 5;
        cfg.outputs.forEach(function(v,i){
          var b = document.createElement('button'); b.className = 'sp'; b.innerHTML = '▦ Panel '+(i+1)+'<small>Output '+(i===weak?'low':v+'%')+'</small>'+(i===weak?'<span class="dust" id="dst"></span>':'');
          if(i === weak){
            b.onclick = function(){
              dust--; J.sfx.tap(); $('dst').style.opacity = dust/5;
              if(dust <= 0){ J.sfx.good(); b.disabled = true; $('fb').textContent = 'Clean! Now fix the power cables.'; setTimeout(phase3, 700); }
            };
          } else b.disabled = true;
          $('pn').appendChild(b);
        });
      }
      function phase3(){
        var p = buildPuzzle(), limit = p.need + 8, taps = 0, over = false;
        host.innerHTML = '<div class="panel"><h3>🔌 Step 3: turn the cables to connect the panels to the battery</h3>'+
          '<div class="mini-note">Tap a piece to turn it. <b id="tl"></b></div><div class="pwrap"><div id="pg" class="pgrid" style="grid-template-columns:36px repeat(4,64px) 36px"></div></div><div id="fb"></div></div>';
        var grid = $('pg');
        function draw(){
          var tr = trace(p), on = {}; tr.path.forEach(function(i){ on[i] = true; });
          var h = '';
          for(var r=0;r<ROWS;r++){
            h += '<span class="pend">'+(r===p.src?'☀️':'')+'</span>';
            for(var c=0;c<COLS;c++){
              var t = p.tiles[r][c], idx = r*COLS+c;
              h += '<button class="tile '+(on[idx]?'on':'')+'" data-r="'+r+'" data-c="'+c+'" aria-label="Turn cable piece"><svg viewBox="0 0 64 64" aria-hidden="true">'+
                dirsOf(t).map(function(d){ return '<path d="'+EDGE[d]+'"/>'; }).join('')+'<circle cx="32" cy="32" r="8"/></svg></button>';
            }
            h += '<span class="pend">'+(r===p.dst?(tr.ok?'⚡':'🔋'):'')+'</span>';
          }
          grid.innerHTML = h; $('tl').textContent = 'Turns left: '+(limit-taps);
          var bs = grid.querySelectorAll('.tile');
          for(var i=0;i<bs.length;i++) bs[i].onclick = function(){
            if(over) return;
            var t = p.tiles[+this.getAttribute('data-r')][+this.getAttribute('data-c')];
            t.rot = (t.rot+1)%4; taps++; J.sfx.tap();
            var tr2 = trace(p);
            draw();
            if(tr2.ok){ over = true; J.sfx.good(); setTimeout(function(){ resolve({ok:true}); }, 800); }
            else if(taps >= limit){ over = true; J.sfx.bad(); setTimeout(function(){ resolve({ok:false, hint:'You ran out of turns. Plan the path from the sun to the battery first!', help:'Start at the sun and fix one piece at a time. Yellow pieces are already connected.'}); }, 700); }
          };
        }
        draw();
      }
      if(cfg.puzzleOnly) phase3(); else phase1();
    });
  };

  /* ---------------------------------------------------------------
     7. DISH AIMING (Task 6): lock the antenna when the marker is in the green zone
  --------------------------------------------------------------- */
  M.dish = async function(host){
    host.innerHTML = '<div class="arena" style="height:auto;min-height:0;padding:14px;background:#0d1642" id="da"><h3>📡 Aim the antenna at Earth</h3>'+
      '<div class="dishbar" id="db"><div class="dishzone" id="dz"></div><div class="dishmark" id="dm"></div></div>'+
      '<div class="cta" style="margin:0"><button class="btn" id="lock">LOCK SIGNAL 📡</button></div></div>';
    var arena = $('da');
    var w = 24, left = J.rand(15, 100-w-15);
    $('dz').style.left = left+'%'; $('dz').style.width = w+'%';
    $('lock').disabled = true;
    await overlay(arena, '📡', 'Tap LOCK when the white line is inside the green zone!');
    $('lock').disabled = false; $('lock').focus({preventScroll:true});
    return new Promise(function(resolve){
      var pos = 0, dir = 1, last = performance.now(), over = false;
      function frame(now){
        if(over || !alive(arena)) return;
        var dt = Math.min(.05,(now-last)/1000); last = now;
        pos += dir*dt*85; if(pos>100){ pos=100; dir=-1; } if(pos<0){ pos=0; dir=1; }
        $('dm').style.left = pos+'%'; requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      $('lock').onclick = function(){
        if(over) return; over = true; $('lock').disabled = true;
        if(pos >= left && pos <= left+w){ J.sfx.good(); setTimeout(function(){ resolve({ok:true}); }, 600); }
        else { J.sfx.bad(); setTimeout(function(){ resolve({ok:false, hint:'The signal missed Earth. Wait for the white line to reach the green zone.', help:'Watch the line swing back and forth, then tap just as it enters the green zone.'}); }, 700); }
      };
    });
  };

  /* ---------------------------------------------------------------
     8. RETURN SEQUENCE (Task 7): tap the steps in the right order
  --------------------------------------------------------------- */
  var STEPS = ['Enter the airlock','Return and store outdoor equipment','Inspect the spacesuit','Check base oxygen and temperature','Check the remaining electricity','Prepare night-time protection','Enter the sleeping quarters'];
  M.sequence = function(host){
    return new Promise(function(resolve){
      var next = 0, strikes = 0, over = false;
      host.innerHTML = '<div class="panel"><h3>🛬 Coming home: tap the steps in the right order</h3><div class="mini-note">Step <b id="sn">1</b> of 7. Two mistakes are OK, a third ends the attempt.</div><div class="seq" id="sq"></div></div>';
      J.shuffle(STEPS.map(function(t,i){ return {t:t,i:i}; })).forEach(function(s){
        var b = document.createElement('button'); b.className = 'seqbtn'; b.innerHTML = '<span class="num">?</span>'+s.t;
        b.onclick = function(){
          if(over || b.classList.contains('done')) return;
          if(s.i === next){
            b.classList.add('done'); b.querySelector('.num').textContent = next+1; next++; J.sfx.tap();
            $('sn').textContent = Math.min(7, next+1);
            if(next === 7){ over = true; J.sfx.good(); setTimeout(function(){ resolve({ok:true, strikes:strikes}); }, 700); }
          } else {
            strikes++; b.classList.add('shake'); J.sfx.miss();
            setTimeout(function(){ b.classList.remove('shake'); }, 450);
            if(strikes >= 3){ over = true; setTimeout(function(){ resolve({ok:false, hint:'Wrong order! Air and pressure come first, then equipment, then checks, then bed.', help:'Order: airlock, store gear, inspect suit, check air, check power, night protection, sleep.'}); }, 500); }
          }
        };
        $('sq').appendChild(b);
      });
    });
  };

  /* ---------------------------------------------------------------
     9. BUILD A SAFE SHELTER (Solar Particle Event): pick the 5 right items
  --------------------------------------------------------------- */
  var SHELTER = [
    {e:'💧',t:'Water containers',ok:1},{e:'🍱',t:'Food packs',ok:1},{e:'📦',t:'Storage boxes',ok:1},
    {e:'🪨',t:'Moon-soil shield bags',ok:1},{e:'🧱',t:'Thick plastic wall panels',ok:1},
    {e:'🎞️',t:'Thin foil blanket'},{e:'🧸',t:'Toys'},{e:'⛱️',t:'Beach umbrella'},{e:'🎈',t:'Party balloons'}
  ];
  M.shelter = function(host, o){
    o = o || {};
    return new Promise(function(resolve){
      var picked = {}, count = 0;
      host.innerHTML = '<div class="panel"><h3>🏠 Build the radiation shelter: choose 5 items</h3>'+
        '<div class="mini-note">You need <b>water, food, storage</b> and <b>2 things that block space rays</b>. Picked: <b id="pc">0</b>/5</div>'+
        '<div class="igrid" id="sg"></div><div id="fb"></div><div class="cta"><button class="btn" id="build" disabled>BUILD SHELTER 🏗️</button></div></div>';
      var items = J.shuffle(SHELTER.map(function(s,i){ return {s:s,i:i}; }));
      items.forEach(function(x){
        var b = document.createElement('button'); b.className = 'item'; b.innerHTML = '<span class="e">'+x.s.e+'</span>'+x.s.t;
        b.onclick = function(){
          if(picked[x.i]){ delete picked[x.i]; count--; b.classList.remove('pick'); }
          else if(count < 5){ picked[x.i] = true; count++; b.classList.add('pick'); }
          J.sfx.tap(); $('pc').textContent = count; $('build').disabled = count !== 5;
        };
        $('sg').appendChild(b);
      });
      $('build').onclick = function(){
        var wrong = Object.keys(picked).filter(function(i){ return !SHELTER[i].ok; });
        if(!wrong.length){ J.sfx.good(); $('build').disabled = true; setTimeout(function(){ resolve({ok:true}); }, 600); return; }
        J.sfx.miss();
        var bs = $('sg').querySelectorAll('.item');
        items.forEach(function(x,k){ if(picked[x.i] && !x.s.ok){ bs[k].classList.add('bad'); } });
        $('fb').innerHTML = '<div class="hintline">'+wrong.length+' item'+(wrong.length>1?'s are':' is')+' not right for a radiation shelter. Thick things block space rays. Thin foil, toys and umbrellas do not!</div>';
        if(o.once) resolve({ok:false});
      };
    });
  };

  /* ---------------------------------------------------------------
     10. POWER SHARING (Scenario B): keep the essentials, stay in budget
  --------------------------------------------------------------- */
  var SYS = [
    {e:'🫁',t:'Life support',w:25,ess:true},{e:'🔥',t:'Heater',w:15,ess:true},{e:'📡',t:'Communications',w:10,ess:true},
    {e:'🔬',t:'Science lab',w:20},{e:'💡',t:'Extra lights',w:10},{e:'🎮',t:'Entertainment',w:10},{e:'🚙',t:'Rover charger',w:15}
  ];
  M.distribution = function(host, budget){
    return new Promise(function(resolve){
      var on = SYS.map(function(){ return true; }), mistakes = 0;
      host.innerHTML = '<div class="panel"><h3>🔋 Power shortage: tap systems to switch them off</h3>'+
        '<div class="mini-note">Available power: <b>'+budget+' units</b>. Keep the air machine, heater and radio ON!</div>'+
        '<div class="budget" id="bd"><i></i></div><div class="mini-note" id="bt"></div><div id="sy"></div><div id="fb"></div>'+
        '<div class="cta"><button class="btn" id="setp">SET POWER PLAN ✔</button></div></div>';
      function use(){ return SYS.reduce(function(a,s,i){ return a + (on[i]?s.w:0); }, 0); }
      function draw(){
        var u = use();
        $('bd').classList.toggle('over', u > budget); $('bd').firstChild.style.width = Math.min(100, u/budget*100)+'%';
        $('bt').textContent = 'Using '+u+' of '+budget+' units';
        $('sy').innerHTML = '';
        SYS.forEach(function(s,i){
          var b = document.createElement('button'); b.className = 'sysrow '+(on[i]?'':'off');
          b.innerHTML = '<span style="font-size:1.4rem">'+s.e+'</span>'+s.t+' <small>('+s.w+' units)</small><span class="sw">'+(on[i]?'ON':'OFF')+'</span>';
          b.onclick = function(){ on[i] = !on[i]; J.sfx.tap(); draw(); };
          $('sy').appendChild(b);
        });
      }
      draw();
      $('setp').onclick = function(){
        var offEss = SYS.filter(function(s,i){ return s.ess && !on[i]; });
        if(offEss.length){ mistakes++; J.sfx.miss(); $('fb').innerHTML = '<div class="hintline">Do not switch off '+offEss[0].t+'! The crew needs it to stay safe.</div>'; return; }
        if(use() > budget){ mistakes++; J.sfx.miss(); $('fb').innerHTML = '<div class="hintline">Too much power in use! Switch off more non-essential systems.</div>'; return; }
        J.sfx.good(); $('setp').disabled = true;
        setTimeout(function(){ resolve({ok:true, labOn:on[3], mistakes:mistakes}); }, 500);
      };
    });
  };
})();
