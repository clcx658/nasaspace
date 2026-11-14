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
  /* Pictures of the gear (drawn here so every picture really looks like the thing it names). */
  var G = (function(){
    function svg(inner){ return '<svg viewBox="0 0 64 64" aria-hidden="true">'+inner+'</svg>'; }
    function helmet(visor, extra){
      return svg('<circle cx="32" cy="31" r="23" fill="#f1f3fb" stroke="#7986cb" stroke-width="3"/>'+
        '<rect x="20" y="49" width="24" height="8" rx="3" fill="#9fa8da" stroke="#5c6bc0" stroke-width="2"/>'+
        '<ellipse cx="32" cy="31" rx="16" ry="13" fill="'+visor+'" stroke="#3949ab" stroke-width="2.5"/>'+(extra||''));
    }
    var shine = '<path d="M22 27 Q25 21 32 21" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
    function glove(o){
      var w = o.w, g = 1.5, total = 4*w + 3*g, x0 = 32 - total/2, hs = [20,26,24,18], out = '';
      out += '<ellipse cx="'+(x0-1)+'" cy="42" rx="'+(w*0.6)+'" ry="9" transform="rotate(-28 '+(x0-1)+' 42)" fill="'+o.fill+'" stroke="'+o.stroke+'" stroke-width="2.5"/>';
      for(var i=0;i<4;i++) out += '<rect x="'+(x0 + i*(w+g))+'" y="'+(34-hs[i])+'" width="'+w+'" height="'+(hs[i]+8)+'" rx="'+(w/2)+'" fill="'+o.fill+'" stroke="'+o.stroke+'" stroke-width="2.5"/>';
      out += '<rect x="'+x0+'" y="30" width="'+total+'" height="22" rx="6" fill="'+o.fill+'" stroke="'+o.stroke+'" stroke-width="2.5"/>';
      out += '<rect x="'+(x0+1)+'" y="50" width="'+(total-2)+'" height="9" rx="3" fill="'+o.cuff+'" stroke="'+o.stroke+'" stroke-width="2.5"/>';
      return svg(out + (o.deco||''));
    }
    function boot(o){
      return svg('<path d="M22 8 H40 V37 L53 42 Q60 44 60 51 V57 H22 Z" fill="'+o.fill+'" stroke="'+o.stroke+'" stroke-width="3" stroke-linejoin="round"/>'+
        '<rect x="22" y="8" width="18" height="7" fill="'+(o.cuff||o.stroke)+'" stroke="'+o.stroke+'" stroke-width="2"/>'+(o.deco||''));
    }
    var treads = '<path d="M22 60 L26 54 L30 60 L34 54 L38 60 L42 54 L46 60 L50 54 L54 60 L58 54" stroke="#ff9800" stroke-width="3" fill="none" stroke-linejoin="round"/>';
    var spacePack = svg('<rect x="14" y="8" width="14" height="46" rx="7" fill="#4dd0e1" stroke="#00838f" stroke-width="2.5"/><rect x="36" y="8" width="14" height="46" rx="7" fill="#4dd0e1" stroke="#00838f" stroke-width="2.5"/>'+
      '<rect x="12" y="24" width="40" height="24" rx="6" fill="#eceff1" stroke="#607d8b" stroke-width="2.5"/>'+
      '<circle cx="32" cy="36" r="8" fill="#fff" stroke="#455a64" stroke-width="2"/><path d="M26.5 40.5 A8 8 0 0 1 37.5 40.5" stroke="#43a047" stroke-width="3" fill="none"/><path d="M32 36 L37 31" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round"/>'+
      '<rect x="18" y="49" width="28" height="5" rx="2" fill="#90a4ae"/>');
    return {
      slotHelmet: helmet('#b3e5fc', shine),
      slotGloves: glove({w:8, fill:'#eceff1', stroke:'#78909c', cuff:'#b0bec5'}),
      slotPack: spacePack,
      slotBoots: boot({fill:'#eceff1', stroke:'#78909c', cuff:'#b0bec5', deco:'<rect x="22" y="52" width="38" height="5" fill="#90a4ae"/>'}),
      // helmets
      visorClear: helmet('#b3e5fc', shine),
      visorGold: helmet('#ffb300', '<path d="M22 27 Q25 21 32 21" stroke="#fff3c4" stroke-width="3" fill="none" stroke-linecap="round"/>'),
      visorScratched: helmet('#b3e5fc', shine+'<path d="M23 38 L31 29 L28 25 M31 29 L41 33 M31 29 L37 22" stroke="#455a64" stroke-width="2.2" fill="none" stroke-linecap="round"/>'),
      bikeHelmet: svg('<path d="M8 40 Q8 12 32 12 Q56 12 56 40 Z" fill="#ef5350" stroke="#b71c1c" stroke-width="3"/><path d="M20 17 L18 37 M32 13 L32 37 M44 17 L46 37" stroke="#ffcdd2" stroke-width="4" stroke-linecap="round"/><path d="M14 40 V50 Q32 60 50 50 V40" stroke="#37474f" stroke-width="3" fill="none"/><rect x="28" y="49" width="8" height="6" rx="1.5" fill="#ffd54f"/>'),
      goggles: svg('<path d="M3 31 H13 M51 31 H61" stroke="#263238" stroke-width="4"/><circle cx="22" cy="32" r="11" fill="#4fc3f7" stroke="#0277bd" stroke-width="3"/><circle cx="42" cy="32" r="11" fill="#4fc3f7" stroke="#0277bd" stroke-width="3"/><path d="M33 32 H31" stroke="#0277bd" stroke-width="4"/><path d="M16 28 Q18 25 22 25 M36 28 Q38 25 42 25" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>'),
      // gloves
      gloveThin: glove({w:6, fill:'#cfd8dc', stroke:'#78909c', cuff:'#b0bec5'}),
      gloveWarm: glove({w:9, fill:'#ffffff', stroke:'#5c6bc0', cuff:'#ff9800', deco:'<path d="M20 40 H44" stroke="#c5cae9" stroke-width="2.5" stroke-dasharray="3 3"/>'}),
      gloveRubber: glove({w:7, fill:'#ffee58', stroke:'#f9a825', cuff:'#fff59d'}),
      gloveGarden: glove({w:8, fill:'#81c784', stroke:'#2e7d32', cuff:'#a5d6a7', deco:'<circle cx="26" cy="40" r="1.6" fill="#2e7d32"/><circle cx="34" cy="43" r="1.6" fill="#2e7d32"/><circle cx="40" cy="38" r="1.6" fill="#2e7d32"/>'}),
      ovenMitt: svg('<path d="M16 56 V28 Q16 10 32 10 Q48 10 48 28 V56 Z" fill="#ef5350" stroke="#b71c1c" stroke-width="3"/><ellipse cx="50" cy="38" rx="7" ry="11" transform="rotate(18 50 38)" fill="#ef5350" stroke="#b71c1c" stroke-width="3"/><path d="M16 42 H48 M26 22 V56 M38 22 V56" stroke="#ffcdd2" stroke-width="2.5"/><path d="M32 10 V4" stroke="#b71c1c" stroke-width="3"/><circle cx="32" cy="5" r="3" fill="none" stroke="#b71c1c" stroke-width="2.5"/>'),
      // backpacks
      schoolBag: svg('<path d="M24 10 Q32 2 40 10" stroke="#1565c0" stroke-width="3.5" fill="none"/><rect x="12" y="10" width="40" height="46" rx="12" fill="#42a5f5" stroke="#1565c0" stroke-width="3"/><rect x="19" y="34" width="26" height="16" rx="5" fill="#90caf9" stroke="#1565c0" stroke-width="2.5"/><path d="M14 24 H50" stroke="#1565c0" stroke-width="2.5"/><circle cx="32" cy="42" r="2.5" fill="#1565c0"/>'),
      airPack: spacePack,
      spareTank: svg('<rect x="22" y="22" width="20" height="34" rx="9" fill="#b0bec5" stroke="#607d8b" stroke-width="3"/><rect x="28" y="12" width="8" height="10" rx="2" fill="#90a4ae" stroke="#607d8b" stroke-width="2.5"/><circle cx="32" cy="8" r="3.5" fill="#ef5350"/><rect x="24" y="34" width="16" height="8" rx="2" fill="#eceff1"/>'),
      emptyPack: svg('<rect x="14" y="10" width="14" height="44" rx="7" fill="#eceff1" stroke="#90a4ae" stroke-width="2.5" stroke-dasharray="4 3"/><rect x="36" y="10" width="14" height="44" rx="7" fill="#eceff1" stroke="#90a4ae" stroke-width="2.5" stroke-dasharray="4 3"/><rect x="12" y="24" width="40" height="24" rx="6" fill="#eceff1" stroke="#607d8b" stroke-width="2.5"/><circle cx="32" cy="36" r="8" fill="#fff" stroke="#455a64" stroke-width="2"/><path d="M26.5 40.5 A8 8 0 0 1 28 29.5" stroke="#e53935" stroke-width="3" fill="none"/><path d="M32 36 L26 33" stroke="#c62828" stroke-width="2.5" stroke-linecap="round"/>'),
      beachBag: svg('<path d="M20 20 Q22 6 32 6 Q42 6 44 20" stroke="#a1887f" stroke-width="3.5" fill="none"/><path d="M12 20 H52 L48 56 H16 Z" fill="#fff8e1" stroke="#f57f17" stroke-width="3" stroke-linejoin="round"/><path d="M23 20 L22 56 M32 20 V56 M41 20 L42 56" stroke="#ffb300" stroke-width="5"/><path d="M16 20 Q22 12 30 18" fill="#f48fb1" stroke="#c2185b" stroke-width="2"/>'),
      // boots and shoes
      bootMoon: boot({fill:'#ffffff', stroke:'#5c6bc0', cuff:'#ff9800', deco:'<rect x="22" y="50" width="38" height="7" fill="#37474f" stroke="#37474f" stroke-width="2"/>'+treads}),
      bootRain: boot({fill:'#ffd54f', stroke:'#f57f17', cuff:'#ffb300', deco:'<path d="M50 16 q5 7 0 11 q-5 -4 0 -11 Z" fill="#4fc3f7" stroke="#0277bd" stroke-width="1.5"/><path d="M12 62 H58" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="6 3"/>'}),
      shoeIndoor: svg('<path d="M8 38 Q8 28 20 28 L32 33 L50 37 Q60 40 60 48 V52 H8 Z" fill="#90caf9" stroke="#1565c0" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="50" width="52" height="5" rx="2" fill="#ffffff" stroke="#90a4ae" stroke-width="2"/><path d="M10 61 Q17 56 24 61 T38 61 T52 61" stroke="#80deea" stroke-width="3" fill="none"/>'),
      sandals: svg('<path d="M6 42 Q6 32 18 32 L48 38 Q60 41 60 51 Q60 58 52 58 H14 Q6 58 6 42 Z" fill="#ffcc80" stroke="#ef6c00" stroke-width="3" stroke-linejoin="round"/><path d="M21 34 L27 56 M35 37 L41 57" stroke="#e65100" stroke-width="6" stroke-linecap="round"/><path d="M21 34 L27 56 M35 37 L41 57" stroke="#ffe0b2" stroke-width="2" stroke-linecap="round"/>')
    };
  })();

  var SETS = {
    journey:[
      {slot:'Helmet', e:G.slotHelmet, items:[{e:G.bikeHelmet,t:'Bike helmet'},{e:G.visorClear,t:'Space helmet',ok:1},{e:G.goggles,t:'Swim goggles'}]},
      {slot:'Gloves', e:G.slotGloves, items:[{e:G.gloveGarden,t:'Garden gloves'},{e:G.gloveWarm,t:'Space gloves',ok:1},{e:G.ovenMitt,t:'Oven mitt'}]},
      {slot:'Oxygen backpack', e:G.slotPack, items:[{e:G.schoolBag,t:'School bag'},{e:G.airPack,t:'Oxygen backpack',ok:1},{e:G.beachBag,t:'Beach bag'}]},
      {slot:'Boots', e:G.slotBoots, items:[{e:G.sandals,t:'Sandals'},{e:G.bootRain,t:'Rain boots'},{e:G.bootMoon,t:'Space boots',ok:1}]}
    ],
    eva:[
      {slot:'Helmet', e:G.slotHelmet, items:[{e:G.visorClear,t:'Clear visor'},{e:G.visorGold,t:'Gold sun visor',ok:1},{e:G.visorScratched,t:'Scratched visor'}]},
      {slot:'Gloves', e:G.slotGloves, items:[{e:G.gloveThin,t:'Thin gloves'},{e:G.gloveWarm,t:'Warm moon gloves',ok:1},{e:G.gloveRubber,t:'Rubber gloves'}]},
      {slot:'Oxygen backpack', e:G.slotPack, items:[{e:G.spareTank,t:'Small spare tank'},{e:G.airPack,t:'Full air backpack',ok:1},{e:G.emptyPack,t:'Empty backpack'}]},
      {slot:'Boots', e:G.slotBoots, items:[{e:G.shoeIndoor,t:'Slippery shoes'},{e:G.bootMoon,t:'Grippy moon boots',ok:1},{e:G.sandals,t:'Light sandals'}]}
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
          h += '<button class="slot '+(it?'full':'')+' '+' '+(sel===i?'sel':'')+'" data-i="'+i+'"><span class="e">'+(it?it.e:s.e)+'</span>'+(it?it.t:s.slot+'?')+'</button>';
        });
        $('slots').innerHTML = h;
        var bs = $('slots').querySelectorAll('.slot');
        for(var i=0;i<bs.length;i++) bs[i].onclick = function(){ sel = +this.getAttribute('data-i'); J.sfx.tap(); drawSlots(); drawTray(); };
        $('insp').disabled = eq.indexOf(null) >= 0;
      }
      function drawTray(){
        var s = set[sel], h = '';
        s.items.forEach(function(it,i){ h += '<button class="item '+(eq[sel]===i?'pick':'')+'" data-i="'+i+'"><span class="e">'+it.e+'</span>'+it.t+'</button>'; });
        $('tray').innerHTML = h;
        $('pickhint').innerHTML = 'Pick the best <b>'+s.slot.toLowerCase()+'</b> for walking <b>outside</b> on the Moon:';
        var bs = $('tray').querySelectorAll('.item');
        for(var i=0;i<bs.length;i++) bs[i].onclick = function(){
          eq[sel] = +this.getAttribute('data-i'); J.sfx.tap();
          var nxt = eq.indexOf(null); if(nxt >= 0) sel = nxt;
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
