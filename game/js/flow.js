/* Game flow: wires each Stitch screen to the game (state, scoring, mini-games, weather branches, endings). */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$, M = J.mini;

  var TASKS = [
    {id:'t1', time:'08:00', name:'Morning Health Check'},
    {id:'t2', time:'09:00', name:'Breakfast Time'},
    {id:'t3', time:'10:00', name:'Suit Up'},
    {id:'t4', time:'11:00', name:'Lunar Exploration'},
    {id:'t5', time:'13:00', name:'Power Inspection'},
    {id:'t6', time:'15:00', name:'Report to Earth'},
    {id:'t7', time:'17:00', name:'Return & Rest'}
  ];
  J.TASKS = TASKS;
  var ENDING_SCREEN = {S:'endS', A:'endA', B:'endB', C:'endC'};

  function G(){ return J.G; }
  function ensureGame(){ if(!J.G) J.newGame(); return J.G; }

  /* Which screen comes next in the day (weather screens are inserted before Tasks 5 and 6). */
  function nextScreen(){
    var g = G();
    if(!g) return 'menu';
    if(g.task >= 7) return 'eval';
    if(g.task === 4 && g.scenario === 'B' && !g.weatherB) return 'wB';
    if(g.task === 5 && !g.weatherAC && g.scenario !== 'B') return g.scenario === 'C' ? 'wC' : 'wA';
    return TASKS[g.task].id;
  }
  J.nextScreen = nextScreen;

  /* ---------------- scoring ---------------- */
  J.score = function(){
    var g = G(), avg = (g.res.o + g.res.p + g.res.f + g.res.w) / 4;
    var mini = Math.min(35, g.mini);
    var res = Math.max(0, Math.min(10, Math.round((avg - 45) / 5)));
    var safe = Math.min(5, g.safety);
    var total = Math.min(50, mini + res + safe);
    var key = total >= 46 ? 'S' : total >= 40 ? 'A' : total >= 32 ? 'B' : 'C';
    return {mini:mini, res:res, safe:safe, total:total, key:key};
  };

  /* ---------------- helpers: modals for tasks ---------------- */
  function openMini(kicker, title){
    var h = J.openModal({cls:'wide', html:'<div class="gkicker">'+kicker+'</div><h2>'+title+'</h2><div id="mg"></div>'});
    h.host = h.box.querySelector('#mg');
    return h;
  }
  function failModal(hint, help, attempts, extraHtml){
    J.sfx.bad();
    return J.modal({cls:'warn', kicker:'Not yet', title:"Oops! Let's try again.",
      html:'<p>'+hint+'</p>'+(extraHtml||'')+((attempts >= 2 && help) ? '<div class="gwarn" style="border-color:#00e5ff;background:rgba(0,229,255,.1)">💡 Extra help: '+help+'</div>' : ''),
      actions:[{label:'TRY AGAIN 🔁', cls:'gold', value:true}]});
  }
  /* Run a scored mini-game in a modal until it succeeds. Points: 5, 3, 2, 1, 0 by attempt. */
  async function runScored(i, kicker, title, runner){
    var attempts = 0;
    while(true){
      attempts++;
      var m = openMini(kicker, title);
      var r = await runner(m.host, attempts);
      m.close();
      if(r.ok){
        var pts = [5,3,2,1][attempts-1] || 0;
        G().mini += pts; G().log.push({t:i, attempts:attempts, pts:pts}); J.save();
        return {attempts:attempts, pts:pts, r:r};
      }
      var fx = r.fx ? J.apply(r.fx) : null;
      await failModal(r.hint, r.help, attempts, fx ? '<div>'+J.chips(r.fx)+'</div>' : '');
    }
  }
  /* For on-screen (Stitch) interactions: failures are counted by the screen, success asks for points. */
  function failCount(i){ var g = G(); g.att = g.att || {}; g.att[i] = (g.att[i] || 0) + 1; J.save(); return g.att[i] + 1; }
  function awardTask(i){
    var g = G(), attempts = ((g.att && g.att[i]) || 0) + 1, pts = [5,3,2,1][attempts-1] || 0;
    g.mini += pts; g.log.push({t:i, attempts:attempts, pts:pts}); J.save();
    return {attempts:attempts, pts:pts};
  }
  /* Result card after a task. Returns 'next' or 'hub'. */
  async function taskResult(i, sc, o){
    var fx = o.fx ? J.apply(o.fx) : {};
    J.sfx.good();
    var chips = o.fx ? J.chips(o.fx) : '';
    var ptsChip = sc ? '<span class="gchip neutral">⭐ +'+sc.pts+' points ('+(sc.attempts === 1 ? 'first try!' : 'try '+sc.attempts)+')</span>' : '';
    var v = await J.modal({cls:o.cls || '', kicker:TASKS[i] ? (TASKS[i].time+' · '+TASKS[i].name) : 'Mission update', title:o.tag || 'Done!',
      html:'<p style="font-weight:700;font-size:1.05rem">'+o.story+'</p><div>'+chips+ptsChip+'</div>'+(o.extra||'')+J.lowWarning()+
        (o.fact ? '<div class="gfact"><span style="font-size:1.6rem">🔭</span><div><div class="gkicker">SPACE FACT</div>'+o.fact+'</div></div>' : ''),
      actions:[{label:(o.nextLabel || 'NEXT ➜'), cls:'gold', value:'next'},{label:'BASE HQ', cls:'dim', value:'hub'}]});
    return v;
  }
  async function finishTask(i, v){
    var g = G();
    if(g.task <= i) g.task = i + 1;
    J.save();
    if(v === 'hub') J.go('hub'); else J.go(nextScreen());
  }

  /* ================= 1. MAIN MENU ================= */
  J.screen('menu', 1, function(root){
    function startNew(){ J.newGame(); J.go('invitation'); }
    J.bindText(root, /START ADVENTURE/i, async function(){
      var s = J.loadSave();
      if(s && s.screen && s.screen !== 'menu' && (s.accepted || s.task > 0)){
        var v = await J.modal({kicker:'Saved mission', title:'Continue your mission?', html:'<p>You have a mission in progress.</p>',
          actions:[{label:'CONTINUE', cls:'cyan', value:'resume'},{label:'NEW MISSION', cls:'gold', value:'new'}]});
        if(v === 'resume'){ J.G = s; J.go(s.screen && J.screens[s.screen] ? s.screen : 'hub'); }
        else startNew();
      } else startNew();
    });
    J.bindText(root, /THE INVITATION/i, function(){ J.go('invitation'); });
    J.bindText(root, /TRAINING HUB/i, function(){ J.go('trainingHub'); });
    J.bindText(root, /NASA QUESTS/i, function(){ J.go('questHub'); });
    J.bindText(root, /HOW TO PLAY/i, function(){
      J.modal({kicker:'How to play', title:'You are a Junior Astronaut!',
        html:'<p>1. <b>Train</b> in 5 short challenges.</p><p>2. <b>Fly</b> to the Moon base.</p><p>3. Do <b>7 tasks</b> during one Moon day. Watch Oxygen, Power, Food and Water!</p><p>4. Your choices decide your <b>ending</b> (score out of 50).</p><p>5. Try the optional <b>NASA Science Quests</b>. They never change your score.</p><p style="font-size:.85rem;color:#bac9cc">All numbers are simulated game values, not real NASA measurements.</p>'});
    });
    J.bindText(root, /LORE/i, function(){
      J.modal({kicker:'Lore', title:'Artemis Base Alpha',
        html:'<p>Welcome to the Lunar Living Experience Camp, a fictional NASA training programme. You will spend one Moon day at a lunar base near the Moon\'s south pole, keeping the crew safe.</p><p style="font-size:.85rem;color:#bac9cc">Made for the NASA Space Apps Challenge. This is a game, not an official NASA product.</p>'});
    });
  });

  /* ================= 2. INVITATION ================= */
  J.screen('invitation', 2, function(root){
    J.bindText(root, /ACCEPT INVITATION/i, function(){ ensureGame().accepted = true; J.save(); J.go('trainingHub'); });
    J.bindText(root, /DECLINE INVITATION/i, function(){
      J.modal({kicker:'Stand by', title:'No problem!', html:'<p>The Moon will wait for you. Accept whenever you are ready.</p>',
        actions:[{label:'I CHANGED MY MIND! 🚀', cls:'gold', value:'yes'},{label:'MAIN MENU', cls:'dim', value:'menu'}]}).then(function(v){
          if(v === 'yes'){ ensureGame().accepted = true; J.save(); J.go('trainingHub'); } else J.go('menu');
        });
    });
  });

  /* ================= 3. TRAINING HUB ================= */
  J.screen('trainingHub', 3, function(root){
    J.bindText(root, /START TRAINING/i, function(){ J.go('training'); });
    J.bindText(root, /Back to Invitation/i, function(){ J.go('invitation'); });
    J.bindText(root, /TRAINING GUIDELINES/i, function(){
      J.modal({kicker:'Training', title:'5 short challenges', html:'<p>Answer questions and finish each station to earn a badge. Wrong answers just give a hint, so you can always try again!</p>'});
    });
  });

  /* ================= 4. TRAINING (5 interactive challenges, Stitch logic) ================= */
  J.screen('training', 4, function(root){
    J.bindText(root, /PROCEED TO ROCKET LAUNCH/i, function(){ ensureGame().trained = true; J.save(); J.go('rocket'); });
    window.resetTraining = function(){ J.render('training'); };
  });

  /* ================= 5. ROCKET LAUNCH ================= */
  J.screen('rocket', 5, function(root){
    ensureGame();
    var stages = ['Liftoff! Engines at full thrust.', 'Stage separation complete!', 'Trans-Lunar Injection: we are on our way to the Moon!'];
    var n = 0;
    J.bindText(root, /COMMENCE LIFTOFF|NEXT STAGE/i, function(){
      J.toast(stages[Math.min(n, stages.length-1)]); J.sfx.good(); n++;
      if(n >= stages.length) setTimeout(function(){ J.go('landing'); }, 900);
    });
    J.bindText(root, /Lunar Approach/i, function(){ J.go('landing'); });
    J.bindText(root, /Return to Training Hub/i, function(){ J.go('trainingHub'); });
  });

  /* ================= 6. MOON LANDING ================= */
  J.screen('landing', 6, function(root){
    ensureGame();
    J.bindText(root, /ENTER AIRLOCK/i, function(){ J.go('hub'); });
    J.bindText(root, /BACK TO ROCKET/i, function(){ J.go('rocket'); });
    J.bindText(root, /REPLAY LANDING/i, function(){ J.render('landing'); });
  });

  /* ================= 7. BASE HUB ================= */
  J.screen('hub', 7, function(root){
    var g = ensureGame();
    g.time = g.task < 7 ? TASKS[Math.min(g.task, 6)].time : '17:30'; J.refreshHeader(false);
    var t = g.task < 7 ? TASKS[g.task] : null;
    // routine list statuses
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while((n = tw.nextNode())){
      var m = /^(\d\d:00)\s*·\s*(CURRENT|UPCOMING|DONE|COMPLETE)/.exec(n.nodeValue.trim());
      if(m){
        var idx = TASKS.findIndex(function(x){ return x.time === m[1]; });
        if(idx >= 0) n.nodeValue = m[1]+' · '+(idx < g.task ? 'DONE' : idx === g.task ? 'CURRENT' : 'UPCOMING');
      }
      if(/^\s*0\s*\/\s*7\s*$/.test(n.nodeValue) || /^0 \/ 7/.test(n.nodeValue.trim())) n.nodeValue = n.nodeValue.replace(/0\s*\/\s*7/, g.task+' / 7');
    }
    var firstMsg = g.task === 0 ? '<p>'+g.condText+'</p>' : '';
    J.bindText(root, /BEGIN \d\d:00 ROUTINE/i, function(){ J.go(nextScreen()); }, 'button');
    var btn = Array.prototype.find.call(root.querySelectorAll('button'), function(b){ return /BEGIN \d\d:00 ROUTINE/i.test(b.textContent); });
    if(btn){
      var sp = Array.prototype.find.call(btn.querySelectorAll('span'), function(s){ return /BEGIN/.test(s.textContent); });
      if(g.task >= 7){ if(sp) sp.textContent = 'SEE MISSION EVALUATION'; }
      else if(g.task > 0 && sp){ sp.textContent = 'CONTINUE '+t.time+' ROUTINE'; }
    }
    if(g.task === 0 && !g.briefed){
      g.briefed = true; J.save();
      J.modal({kicker:'Base report', title:'Good morning, Commander!', html:firstMsg+'<p>Watch <b>Oxygen, Power, Food and Water</b> at the top. Press <b>BEGIN 08:00 ROUTINE</b> to start your Moon day.</p>',
        actions:[{label:'LET\'S GO ☀️', cls:'gold', value:true}]});
    }
  });

  /* ================= 8. TASK 1: MORNING HEALTH CHECK ================= */
  J.screen('t1', 8, function(root){
    var g = ensureGame(); g.time = '08:00'; J.refreshHeader(false);
    var calibrated = false;
    var origCal = window.calibrateDrift;
    window.calibrateDrift = function(){ calibrated = true; origCal.apply(this, arguments); J.sfx.good(); J.toast('Sector 2 recalibrated!'); };
    J.bindText(root, /COMPLETE 08:00 HEALTH CHECK/i, async function(){
      if(!calibrated){
        var a = failCount(0);
        await failModal('A sensor still needs attention! Look for the card marked <b>Action Needed</b> and press <b>Recalibrate</b>.', 'Find "Sector 2 Recalibration" (CH-05) and press Recalibrate.', a);
        return;
      }
      var sc = awardTask(0), slow = sc.attempts > 1;
      g.safety += 1; J.save();
      var v = await taskResult(0, sc, {
        tag: slow ? 'Found, but a bit late' : 'Problem found early!',
        story: slow ? 'You found the airflow drift after a few tries, so the base used extra power for repairs.' : 'You spotted the airflow drift right away and fixed it early. No extra repairs needed!',
        fx:{p: slow ? -8 : -3}, fact:'The air on the space station is about 21% oxygen, just like the air on Earth.'});
      finishTask(0, v);
    });
    J.bindText(root, /RETURN TO BASE HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 9. TASK 2: BREAKFAST ================= */
  J.screen('t2', 9, function(root){
    var g = ensureGame(); g.time = '09:00'; J.refreshHeader(false);
    var busy = false;
    J.bindText(root, /EAT BREAKFAST/i, async function(){
      if(busy) return; busy = true;
      var meals = [
        {ico:'🥣', t:'Hearty breakfast', d:'Egg bites, spinach and juice', fx:{f:-12,w:-8}},
        {ico:'🍎', t:'Light breakfast', d:'Fruit pouch and crackers', fx:{f:-6,w:-5}},
        {ico:'🍫', t:'Quick snack', d:'Energy bar and a drink', fx:{f:-4,w:-9}}
      ];
      var mi = await J.choose({kicker:'09:00 · Breakfast Time', title:'What will you eat?', text:'Every meal uses food and water. Pick wisely!', options:meals});
      var sc = await runScored(1, '09:00 · Breakfast Time', 'No gravity! Grab the floating food', function(host){
        return M.breakfast(host).then(function(r){ if(!r.ok) r.fx = {f:-2*r.lost}; return r; });
      });
      var v = await taskResult(1, sc, {tag:'Breakfast finished', story:'You finished your '+meals[mi].t.toLowerCase()+'. Food and water supplies went down.', fx:meals[mi].fx,
        fact:'Astronauts often eat food in sticky sauces or pouches so crumbs do not float into machines.'});
      busy = false; finishTask(1, v);
    });
    J.bindText(root, /BASE HUB|Base HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 10. TASK 3: SUIT UP ================= */
  J.screen('t3', 10, function(root){
    var g = ensureGame(); g.time = '10:00'; J.refreshHeader(false);
    var busy = false;
    J.bindText(root, /PRESSURIZE SUIT/i, async function(){
      if(busy) return; busy = true;
      var sc = await runScored(2, '10:00 · Suit Up', 'Choose the right outdoor gear, then check it for damage', function(host){
        return M.dressUp(host, {set:'eva', strict:true, damage:true, title:'🧑‍🚀 Suit up: choose the right outdoor gear'});
      });
      g.safety += 1; J.save();
      var v = await taskResult(2, sc, {tag:'Suit ready!', story:'Your spacesuit passed the 5-point inspection. The airlock used a little oxygen and power.', fx:{o:-3,p:-2},
        fact:'A spacesuit works like a tiny spaceship. It gives you air, controls temperature and protects you from dust.'});
      busy = false; finishTask(2, v);
    });
    J.bindText(root, /RE-INSPECT GEAR/i, function(){ J.toast('Press PRESSURIZE SUIT to start the inspection.'); });
    J.bindText(root, /RETURN TO BASE HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 11. TASK 4: LUNAR EXPLORATION ================= */
  var SITES = {
    rim:   {label:'Nearby Crater Rim',          fx:{p:-5,o:-2},  back:{p:-1},         key:'A'},
    ridge: {label:'Rock Formation Ridge',       fx:{p:-10,o:-4}, back:{p:-3,o:-2},    key:'B'},
    shadow:{label:'Permanently Shadowed Crater',fx:{p:-18,o:-5}, back:{p:-5,o:-3},    key:'C'},
    flat:  {label:'Flat Surface Survey',        fx:{p:-3,o:-1},  back:{p:-1},         key:'D'}
  };
  var ROCKS = [{name:'Basalt', e:'⬛', kind:'Dark rock'},{name:'Anorthosite', e:'⬜', kind:'Light rock'},{name:'Breccia', e:'🟫', kind:'Broken rock'}];
  var DATA = [{name:'Temperature', e:'🌡️', kind:'Heat data'},{name:'Dust', e:'🌫️', kind:'Dust data'},{name:'Radiation', e:'☢️', kind:'Radiation data'}];
  J.screen('t4', 11, function(root){
    var g = ensureGame(); g.time = '11:00'; J.refreshHeader(false);
    var site = 'rim', busy = false;
    var origSel = window.selectLocation;
    window.selectLocation = function(k){ site = k; origSel.apply(this, arguments); };
    window.confirmMission = async function(){
      if(busy) return; busy = true;
      var S = SITES[site];
      var cfg = {digs:9, required: site === 'flat' ? DATA : ROCKS, extras:[]};
      if(site === 'ridge') cfg.extras = [{name:'Bonus rock', e:'💎'}];
      if(site === 'shadow' && Math.random() < 0.6) cfg.extras = [{name:'Ice clue', e:'🧊'}];
      var sc = await runScored(3, '11:00 · '+S.label, 'Dig for 3 different samples. Use the numbers!', function(host){ return M.rocks(host, cfg); });
      var extras = sc.r.extras || [], ice = extras.indexOf('Ice clue') >= 0;
      g.loc = site; g.ice = ice;
      var gain = (site === 'flat' ? 2 : 3) + (extras.indexOf('Bonus rock') >= 0 ? 1 : 0) + (ice ? 2 : 0);
      var fx = {o:S.fx.o - (sc.attempts-1)*2, p:S.fx.p, r:gain};
      var story = {rim:'You collected ordinary rock samples close to the base. Low risk and low cost.',
        ridge:'You found more samples, but the rocky ridge used more oxygen and power.',
        shadow: ice ? 'Amazing! You found a (simulated) clue that could mean water ice, deep in the dark crater.' : 'You searched the dark crater but found no ice clue this time. Finding ice is never guaranteed.',
        flat:'You gathered surface data without long walks. Fewer samples, but very safe.'}[site];
      var fact = site === 'shadow' ? 'Some craters near the Moon\'s poles never see sunlight. Scientists think they may hold water ice.' :
                 site === 'flat' ? 'Instruments measure the Moon\'s temperature, dust and radiation to keep astronauts safe.' :
                 'Moon rocks brought back by Apollo astronauts are still studied by scientists today.';
      J.save();
      var v = await taskResult(3, sc, {tag:'Research done!', story:story, fx:fx, fact:fact});
      busy = false; finishTask(3, v);
    };
    J.bindText(root, /Base HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 12. TASK 5: POWER INSPECTION ================= */
  J.screen('t5', 12, function(root){
    var g = ensureGame(); g.time = '13:00'; J.refreshHeader(false);
    var busy = false;
    window.boostPower = async function(){
      if(busy) return;
      var cells = root.querySelectorAll('.hex-cell'), clean = 0;
      cells.forEach(function(c){ if(c.innerText.trim() === '✓') clean++; });
      if(cells.length && clean < cells.length){
        var a = failCount(4);
        await failModal('Some solar cells are still covered in dust! Tap each dusty cell, or press <b>AUTO-WIPE ALL</b>, then confirm the maintenance.', 'Cells turn into a check mark when they are clean.', a);
        return;
      }
      busy = true;
      var sc = await runScored(4, '13:00 · Power Inspection', 'Turn the cables to connect the panels to the battery', function(host){
        return M.power(host, {puzzleOnly:true});
      });
      // attempts spent on unclean confirmations also count
      var extraFails = (g.att && g.att[4]) || 0;
      var tot = sc.attempts + extraFails, pts = [5,3,2,1][tot-1] || 0;
      g.mini += (pts - sc.pts); J.save(); sc.attempts = tot; sc.pts = pts;
      var back = SITES[g.loc || 'rim'].back, fx = {p: (tot === 1 ? 12 : 8) + (back.p||0)}; if(back.o) fx.o = back.o;
      var v = await taskResult(4, sc, {tag:'Power restored!', story:'The panels are clean and the cables are connected. The walk back from the exploration site used some resources too.', fx:fx,
        fact:'Moon dust is sharp and sticky. It can scratch equipment and cover solar panels, so cleaning matters.'});
      busy = false; finishTask(4, v);
    };
    J.bindText(root, /RETURN TO BASE HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 13. TASK 6: REPORT TO EARTH ================= */
  J.screen('t6', 13, function(root){
    var g = ensureGame(); g.time = '15:00'; J.refreshHeader(false);
    var sel = 'B', busy = false;
    var COST = {A:{p:-12}, B:{p:-4}, C:{p:-16}};
    var cards = {};
    // find the three report cards by their headings
    Array.prototype.forEach.call(root.querySelectorAll('h4'), function(h){
      var card = h.closest('div[class*="rounded"]') ; var t = h.textContent;
      var k = /Full Mission/i.test(t) ? 'A' : /Safety Priority/i.test(t) ? 'B' : /Scientific Research/i.test(t) ? 'C' : null;
      if(k){ var c = h; while(c && !(c.querySelector && c.querySelector('button') ) && c.parentElement) c = c.parentElement; cards[k] = h.closest('div.flex-col, div[class*="p-"]') || card; }
    });
    function mark(){
      Object.keys(cards).forEach(function(k){ if(cards[k]) cards[k].style.outline = (k === sel) ? '4px solid #00e5ff' : 'none'; });
    }
    mark();
    J.bindText(root, /Select Full Report/i, function(){ sel = 'A'; mark(); J.toast('Full report selected (-12% Power).'); }, 'button');
    J.bindText(root, /Select Science Only/i, function(){ sel = 'C'; mark(); J.toast('Science report selected (-16% Power).'); }, 'button');
    Array.prototype.forEach.call(root.querySelectorAll('h4'), function(h){
      if(/Safety Priority/i.test(h.textContent)){ h.style.cursor = 'pointer'; h.addEventListener('click', function(){ sel = 'B'; mark(); J.toast('Safety report selected (-4% Power).'); }); }
    });
    J.bindText(root, /TRANSMIT REPORT/i, async function(){
      if(busy) return; busy = true;
      var fx = {p:COST[sel].p}, extraHtml = '';
      if(g.emergency && sel !== 'B'){
        await J.modal({cls:'warn', kicker:'Rule', title:'Safety report first!',
          html:'<p>There is an emergency, so the <b>Safety Priority Report</b> must go to Mission Control first. You cannot skip it to earn more science.</p><p>Your chosen report goes second.</p><div>'+J.chips({p:-4})+'</div>',
          actions:[{label:'SEND BOTH REPORTS', cls:'gold', value:true}]});
        fx.p += -4; extraHtml = '<p>Safety report was sent first.</p>';
      }
      if(sel === 'C') fx.r = 1;
      var sc = await runScored(5, '15:00 · Report to Earth', 'Aim the antenna at Earth', function(host){ return M.dish(host); });
      if(!g.emergency){ g.eventPts = (sel === 'C') ? 1 : 2; g.safety += g.eventPts; }
      J.save();
      var txt = (sel === 'B' || g.emergency) ? 'Mission Control received your safety information first.' : sel === 'A' ? 'Mission Control received your complete report.' : 'Mission Control received your science results. Safety news will come later.';
      var v = await taskResult(5, sc, {tag:'Report sent!', story:txt, fx:fx, extra:extraHtml, fact:'Radio signals take about 1.3 seconds to travel from Earth to the Moon.'});
      busy = false; finishTask(5, v);
    });
    J.bindText(root, /RETURN TO BASE HQ|Base HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 14. TASK 7: RETURN AND REST ================= */
  J.screen('t7', 14, function(root){
    var g = ensureGame(); g.time = '17:00'; J.refreshHeader(false);
    var items = root.querySelectorAll('#checklist-container > div');
    // start with everything unchecked: the player must inspect each step
    Array.prototype.forEach.call(items, function(card){
      var icon = card.querySelector('.material-symbols-outlined');
      if(icon && icon.textContent.trim() === 'check_circle') card.click();
    });
    function checkedCount(){
      var c = 0; Array.prototype.forEach.call(items, function(card){ var ic = card.querySelector('.material-symbols-outlined'); if(ic && ic.textContent.trim() === 'check_circle') c++; });
      return c;
    }
    var busy = false;
    J.bindText(root, /CONCLUDE SOL 04/i, async function(){
      if(busy) return;
      var c = checkedCount();
      if(c < items.length){
        var a = failCount(6);
        await failModal('You have checked <b>'+c+' of '+items.length+'</b> steps. Tap every card on the checklist to inspect it before ending the day.', 'Tap each of the 7 cards until all show a check mark.', a);
        return;
      }
      busy = true;
      var sc = awardTask(6); g.safety += 1; J.save();
      var v = await taskResult(6, sc, {tag:'Base is safe for the night', story:'Equipment is stored and the base is checked. Night heating, dinner and sleep use some supplies.',
        fx:{o:-4,p:-4,f:-6,w:-4}, fact:'A night on the Moon lasts about 14 Earth days, so bases need power to stay warm.', nextLabel:'MISSION DEBRIEF 🏁'});
      busy = false; finishTask(6, v);
    });
    J.bindText(root, /RETURN TO BASE HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 15. WEATHER A: NORMAL CONDITIONS ================= */
  J.screen('wA', 15, function(root){
    var g = ensureGame(); g.time = '14:30'; J.refreshHeader(false);
    J.setText(root, /Projected Outcome:.*$/, 'Projected Outcome:');
    var choice = null, origSel = window.selectChoice;
    window.selectChoice = function(el, k){ choice = k; origSel.apply(this, arguments); };
    J.bindText(root, /CONTINUE MISSION/i, async function(){
      if(!choice){ J.toast('Pick one action first!'); return; }
      var o = {A:{pts:2, fx:{}, story:'You completed the scheduled inspections. Routine checks help find problems early.', tag:'Inspections complete'},
               B:{pts:1, fx:{r:2}, story:'Rover-01 scanned the crater soil and found interesting minerals.', tag:'New observations'},
               C:{pts:1, fx:{p:5}, story:'The crew rested and saved some power. Morale is high!', tag:'Good rest'}}[choice];
      g.eventPts = o.pts; g.safety += o.pts; g.weatherAC = true; J.save();
      await J.modal({kicker:'14:30 · All systems go', title:o.tag, html:'<p style="font-weight:700">'+o.story+'</p><div>'+J.chips(o.fx)+'</div>', actions:[{label:'CONTINUE ➜', cls:'gold', value:true}]});
      if(o.fx.p || o.fx.r) J.apply(o.fx);
      J.go(nextScreen());
    }, 'button');
    J.bindText(root, /RETURN TO BASE HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 16. WEATHER B: POWER SHORTAGE ================= */
  J.screen('wB', 16, function(root){
    var g = ensureGame(); g.time = '12:30'; J.refreshHeader(false);
    J.setText(root, /\+?10 Resource Mgmt Points/, '+10 Power');
    if(!g.wbAnnounced){ g.wbAnnounced = true; J.apply({p:-15}); J.sfx.alarm(); J.toast('Power dropped by 15%!'); }
    var busy = false;
    var btn = root.querySelector('#restoreBtn');
    if(btn){
      var clone = btn.cloneNode(true); clone.removeAttribute('onclick'); btn.parentNode.replaceChild(clone, btn); btn = clone; // drop the demo alert handlers
      btn.addEventListener('click', async function(){
        if(busy) return;
        var sel = (root.querySelector('input[name="powerChoice"]:checked') || {}).value;
        if(sel === 'ignore'){
          var a = failCount(7);
          J.apply({p:-6});
          await failModal('Running the lab at full power empties the batteries! Choose <b>Choice A</b> or <b>Choice B</b> to protect the base.', 'Choice A cleans the panels. Choice B switches off non-essential loads.', a, '<div>'+J.chips({p:-6})+'</div>');
          return;
        }
        busy = true;
        var fx = {}, story = '', extra = '';
        if(sel === 'clean'){
          fx = {p:10, o:-2}; story = 'Rover-01 wiped the dust off the panels. Power is coming back!';
        } else {
          var d = await new Promise(function(res){
            var m = openMini('12:30 · Power Shortage', 'Switch off non-essential systems');
            M.distribution(m.host, 70).then(function(r){ m.close(); res(r); });
          });
          fx = {p:6}; if(!d.labOn) fx.r = -1;
          story = d.labOn ? 'You kept the science lab running and still protected the essentials. Well planned!' : 'The essentials stay on. The science lab is paused to save power.';
        }
        var att = ((g.att && g.att[7]) || 0) + 1;
        g.eventPts = att === 1 ? 2 : 1; g.safety += g.eventPts; g.weatherB = true; g.emergency = true; J.save();
        await taskResult(-1, null, {tag:'Power plan set', story:story, fx:fx, fact:'Solar panels need sunlight, so dust and the long Moon night are big challenges for lunar bases.', nextLabel:'CONTINUE ➜'});
        busy = false; J.go(nextScreen());
      });
    }
    J.bindText(root, /RETURN TO BASE HQ|Base HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 17. WEATHER C: SOLAR PARTICLE EVENT ================= */
  J.screen('wC', 17, function(root){
    var g = ensureGame(); g.time = '14:30'; J.refreshHeader(false);
    J.setText(root, /\+5 SAFETY PTS/, 'SAFE CHOICE');
    J.setText(root, /\(\+5 Safety Points\)/, '');
    g.emergency = true; J.save(); J.sfx.alarm();
    var solved = false, busy = false, origHandle = window.handleChoice;
    window.handleChoice = function(type){
      origHandle.apply(this, arguments);
      if(type === 'correct'){ solved = true; J.sfx.good(); }
      else { failCount(8); J.sfx.bad(); }
    };
    var cta = root.querySelector('#primaryCta');
    if(cta){
      var clone = cta.cloneNode(true); clone.removeAttribute('onclick'); cta.parentNode.replaceChild(clone, cta); cta = clone;
      cta.addEventListener('click', async function(){
        if(busy) return;
        if(!solved){ J.toast('Choose the safest action first!'); return; }
        busy = true;
        var opts = [
          {ico:'💧', t:'Move more water and food into the shelter', d:'More protective supplies. Less left for daily use.', fx:{f:-10,w:-10}},
          {ico:'⚖️', t:'Share supplies evenly', d:'Balance daily needs and the shelter.', fx:{f:-5,w:-5}},
          {ico:'🔌', t:'Turn off non-essential equipment', d:'Saves electricity. Some research is paused.', fx:{p:8,r:-1}}
        ];
        var ci = await J.choose({kicker:'Solar particle event', title:'How will you use your supplies?', options:opts});
        var attempts = 0, r;
        while(true){
          attempts++;
          var m = openMini('Solar particle event', 'Build the radiation shelter');
          r = await M.shelter(m.host, {once:true}); m.close();
          if(r.ok) break;
          await failModal('The shelter is not safe yet. Thick materials block radiation; thin foil, toys and umbrellas do not!', 'Pick water, food, storage boxes, Moon-soil bags and thick plastic panels.', attempts);
        }
        var att = ((g.att && g.att[8]) || 0) + attempts - 1;
        g.eventPts = att === 0 ? 2 : 1; g.safety += g.eventPts; g.weatherAC = true; J.save();
        await taskResult(-1, null, {tag:'Crew is safe!', story:'Everyone is inside the shelter. Thick materials block much of the radiation, and nobody goes outside until the storm has passed.', fx:opts[ci].fx,
          fact:'The Moon has no thick air or magnetic field to block radiation. Future bases may be covered with Moon soil for protection.'});
        busy = false; J.go(nextScreen());
      });
    }
    J.bindText(root, /RETURN TO BASE HQ|Base HQ/i, function(){ J.go('hub'); });
  });

  /* ================= 18. EVALUATION ================= */
  function patchNumbers(root, sc){
    var avg = Math.round(sc.total / 50 * 100);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while((n = tw.nextNode())) list.push(n);
    list.forEach(function(n){
      var v = n.nodeValue;
      v = v.replace(/\b\d{1,2}\s*\/\s*50\b/g, sc.total+' / 50');
      v = v.replace(/\b\d{1,2}\s*\/\s*35\b/g, sc.mini+' / 35');
      v = v.replace(/\b\d{1,2}\s*\/\s*10\b/g, function(m, off){ return m; });
      n.nodeValue = v;
    });
  }
  J.screen('eval', 18, function(root){
    var g = ensureGame(); g.time = '17:30'; J.refreshHeader(false);
    var sc = J.score();
    // total + the three categories (35 / 10 / 5) from the real game
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while((n = tw.nextNode())) list.push(n);
    list.forEach(function(n){
      var v = n.nodeValue;
      if(/\b\d+\s*\/\s*50\b/.test(v)) v = v.replace(/\b\d+\s*\/\s*50\b/, sc.total+' / 50');
      if(/\b\d+\s*\/\s*35\b/.test(v)) v = v.replace(/\b\d+\s*\/\s*35\b/, sc.mini+' / 35');
      if(/\b\d+\s*\/\s*10\b/.test(v)) v = v.replace(/\b\d+\s*\/\s*10\b/, sc.res+' / 10');
      if(/^\s*\d+\s*\/\s*5\s*$/.test(v) || /\b\d+\s*\/\s*5\s*PTS/.test(v)) v = v.replace(/\b\d+\s*\/\s*5\b/, sc.safe+' / 5');
      n.nodeValue = v;
    });
    // descriptions that were fixed text in the design
    Array.prototype.forEach.call(root.querySelectorAll('p'), function(p){
      var t = p.textContent;
      if(/Simulation Challenges completed/.test(t)) p.textContent = 'Points for how quickly you completed the 7 daily mini-games (fewer tries = more points).';
      if(/Perfect power load shedding/.test(t)) p.textContent = 'Based on your Oxygen, Power, Food and Water at the end of the day.';
      if(/Prompt response during Solar Particle/.test(t)) p.textContent = 'Points for safe inspections, reports and how you handled the space weather.';
    });
    Array.prototype.forEach.call(root.querySelectorAll('span,div'), function(el){
      if(el.children.length === 0 && /^(Accuracy \d|Preservation \d|Safety Rating)/.test(el.textContent.trim())) el.style.visibility = 'hidden';
    });
    J.bindText(root, /REVEAL MY MISSION ENDING/i, function(){
      g.finished = true; var s = J.score(); g.result = s; J.save(); J.go(ENDING_SCREEN[s.key]);
    });
    var rb = Array.prototype.find.call(root.querySelectorAll('button'), function(b){ return /REVEAL MY MISSION ENDING/i.test(b.textContent); });
    if(rb){
      var tw2 = document.createTreeWalker(rb, NodeFilter.SHOW_TEXT, null), t2;
      while((t2 = tw2.nextNode())) t2.nodeValue = t2.nodeValue.replace(/\s*\(ENDING [SABC] UNLOCKED\)/, '');
    }
    J.bindText(root, /Return to Base Overview/i, function(){ J.go('hub'); });
  });

  /* ================= 19-22. ENDINGS ================= */
  var END_INFO = {
    S:{title:'Outstanding Moon Explorer', n:19},
    A:{title:'Excellent Moon Explorer', n:20},
    B:{title:'Junior Moon Explorer', n:21},
    C:{title:'Future Astronaut', n:22}
  };
  function certificate(sc, key){
    var info = END_INFO[key];
    J.openModal({cls:'wide gold', html:
      '<div id="cert-print" style="background:#fffaf0;color:#2a2250;border:6px double #b8860b;border-radius:1rem;padding:1.5rem;text-align:center;font-family:Georgia,serif">'+
      '<div style="font-size:.8rem;letter-spacing:.15em">SIMULATED EDUCATIONAL GAME CERTIFICATE</div>'+
      '<h2 style="font-size:2rem;margin:.4rem 0;color:#2a2250">A Day on the Moon</h2><div>Junior Astronaut Mission Trainer</div>'+
      '<p style="margin:1rem 0 .3rem">This is proudly presented to</p><div style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2a2250;display:inline-block;padding:0 2rem">Cadet Explorer</div>'+
      '<p style="margin:1rem 0 .2rem">for completing one day at Artemis Base Alpha</p><div style="font-size:1.5rem;font-weight:700;color:#b8860b">'+info.title+'</div>'+
      '<p>Final score: <b>'+sc.total+' / 50</b></p>'+
      '<p style="font-size:.8rem">NASA Space Apps Challenge 2026 · Team AstroPath<br>This is a fictional training game. Values are simulated and not real NASA measurements.</p></div>'+
      '<div class="gactions"><button class="gbtn gold" id="certPrint">PRINT / SAVE AS PDF</button><button class="gbtn dim" id="certClose">CLOSE</button></div>'});
    var box = document.querySelector('#modal-root .gmodal');
    box.querySelector('#certPrint').onclick = function(){ window.print(); };
    box.querySelector('#certClose').onclick = function(){ document.querySelector('#modal-root .gmodal-scrim').remove(); $('modal-root').style.pointerEvents = 'none'; };
  }
  function bindEnding(key){
    return function(root){
      var g = ensureGame();
      if(!g.result){ g.result = J.score(); }
      var sc = g.result; g.time = '17:30'; J.refreshHeader(false);
      var list = [], n, tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      while((n = tw.nextNode())) list.push(n);
      var pct = Math.round(sc.total / 50 * 100);
      list.forEach(function(n){
        var v = n.nodeValue;
        v = v.replace(/\b\d+\s*\/\s*50\b/g, sc.total+' / 50');
        v = v.replace(/\b\d+\s*\/\s*35\b/g, sc.mini+' / 35');
        v = v.replace(/\b(\d+)%\s*Mission Excellence/, pct+'% Mission Excellence');
        v = v.replace(/SOLAR EFFICIENCY/, 'POWER LEFT').replace(/O2 LOOP INTEGRITY/, 'OXYGEN LEFT').replace(/LUNAR LAB SAMPLES/, 'RESEARCH POINTS');
        n.nodeValue = v;
      });
      // numbers beside those three labels
      Array.prototype.forEach.call(root.querySelectorAll('span,div,p'), function(el){
        if(el.children.length) return;
        var t = el.textContent.trim();
        var prev = el.previousElementSibling ? el.previousElementSibling.textContent.trim() : '';
        if(/^[\d.]+%$/.test(t) && /POWER LEFT/.test(prev)) el.textContent = g.res.p + '%';
        else if(/^[\d.]+%$/.test(t) && /OXYGEN LEFT/.test(prev)) el.textContent = g.res.o + '%';
        else if(/^\d+\s*\/\s*15$/.test(t) && /RESEARCH/.test(prev)) el.textContent = g.research + ' pts';
      });
      J.bindText(root, /CERTIFICATE|Download PNG|Scan QR/i, function(){ certificate(sc, key); });
      J.bindText(root, /NASA SCIENCE QUESTS|EXPLORE NASA SCIENCE QUESTS/i, function(){ J.go('questHub'); });
      J.bindText(root, /REPLAY MISSION|TRAIN AGAIN/i, function(){ J.newGame(); J.go('invitation'); });
      J.bindText(root, /RETURN TO MAIN MENU/i, function(){ J.go('menu'); });
      if(J.sfx && !g.endPlayed){ g.endPlayed = true; (key === 'S' || key === 'A') ? J.sfx.win() : J.sfx.good(); }
    };
  }
  J.screen('endS', 19, bindEnding('S'));
  J.screen('endA', 20, bindEnding('A'));
  J.screen('endB', 21, bindEnding('B'));
  J.screen('endC', 22, bindEnding('C'));
})();
