/* Story flow: invitation → training → journey → base tour → 7 daily tasks (3 branches) → ending */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$, M = J.mini, S;
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

  var CONDITIONS = [
    {id:'normal', t:'Everything looks normal today.', fx:{}},
    {id:'dusty', t:'The solar panels look a bit dusty (power starts lower).', fx:{p:-10}},
    {id:'oxy', t:'The oxygen tanks are slightly low (oxygen starts lower).', fx:{o:-8}},
    {id:'cold', t:'The heaters are working hard (power and water start lower).', fx:{p:-6, w:-4}}
  ];
  var SCENARIOS = {
    A:'Normal conditions ☀️', B:'Power shortage ⚡', C:'Solar particle event ☢️'
  };

  function newState(){
    var q = new URLSearchParams(location.search), forced = q.get('scenario');
    var cond = J.pick(CONDITIONS);
    S = J.S = {
      res:{o:100,p:100,f:100,w:100}, cond:cond,
      scenario: (forced && SCENARIOS[forced]) ? forced : J.pick(['A','B','C']),
      mini:0, safety:0, research:0, log:[], emergency:false, loc:null, ice:false,
      abn: J.rand(0,3), eventPts:0
    };
    ['o','p','f','w'].forEach(function(k){ S.res[k] = J.clamp(S.res[k] + (cond.fx[k]||0)); });
  }

  /* ---------- Helpers ---------- */
  var TASKS = [
    {time:'08:00', ico:'🩺', name:'Morning Health Check'},
    {time:'09:00', ico:'🍳', name:'Breakfast Time'},
    {time:'10:00', ico:'🧑‍🚀', name:'Suit Up'},
    {time:'11:00', ico:'🌕', name:'Lunar Exploration'},
    {time:'13:00', ico:'☀️', name:'Power Inspection'},
    {time:'15:00', ico:'📡', name:'Report to Earth'},
    {time:'17:00', ico:'🛬', name:'Return & Rest'}
  ];
  function setTask(i){
    J.hud({title:'A Day on the Moon', dots:[7,i], meters:true, clock:TASKS[i].time});
  }
  function banner(i){
    var t = TASKS[i];
    return '<div class="banner"><span style="font-size:1.8rem" aria-hidden="true">'+t.ico+'</span><div><span class="t">'+t.time+'</span> <span class="n">Task '+(i+1)+': '+t.name+'</span><small>Mini-game '+(i+1)+' of 7</small></div></div>';
  }
  function ptsChip(pts, attempts){
    return '<div class="chips"><span class="chip neutral">⭐ +'+pts+' points ('+(attempts===1?'first try!':'try '+attempts)+')</span></div>';
  }

  /* Run a scored mini-game until it succeeds. Points depend on the attempt number (5,3,2,1,0). */
  async function scored(task, intro, runner){
    var attempts = 0;
    while(true){
      attempts++;
      J.stage(banner(task)+J.say(intro)+'<div id="miniHost"></div>');
      var r = await runner($('miniHost'), attempts);
      if(r.ok){
        var pts = [5,3,2,1][attempts-1] || 0;
        S.mini += pts; S.log.push({task:task, attempts:attempts, pts:pts});
        return {attempts:attempts, pts:pts, r:r};
      }
      J.sfx.bad();
      var fx = r.fx ? J.apply(r.fx) : null;
      var help = (attempts >= 2 && r.help) ? '<div class="hintline">💡 Extra help: '+r.help+'</div>' : '';
      J.stage(banner(task)+J.say("Oops! Let's try again."));
      J.append('<div class="card"><p class="story">'+r.hint+'</p>'+(fx?'<div class="chips">'+J.chips(r.fx)+'</div>':'')+help+J.lowWarning()+'</div>');
      await J.cta('TRY AGAIN 🔁');
    }
  }
  async function taskResult(task, sc, o){
    J.stage(banner(task));
    o.extra = ptsChip(sc.pts, sc.attempts) + (o.extra||'');
    await J.result(o);
  }

  /* ---------- Opening ---------- */
  async function welcome(){
    var mode = 'full';
    var best = +J.store('jamt_best_score');
    if(best) $('best').textContent = 'Your best score: '+best+' / 50';
    await new Promise(function(resolve){
      $('startBtn').onclick = function(){ J.sfx.tap(); resolve(); };
      $('demoBtn').onclick = function(){ J.sfx.tap(); mode = 'day'; resolve(); };
    });
    return mode;
  }

  async function invitation(){
    J.show('game'); J.hud({title:'Mission Invitation'});
    while(true){
      J.stage('<div class="letter"><span class="seal">🚀</span><h3>Dear Future Astronaut,</h3>'+
        '<p>You have been invited to join the <b>Lunar Living Experience Camp</b>!</p>'+
        '<p>Before travelling to the Moon, you must complete our astronaut training programme.</p>'+
        '<p><b>Are you ready for this adventure?</b></p></div>');
      var i = await J.choose([
        {ico:'✅', label:'Accept Invitation', desc:'Start astronaut training'},
        {ico:'❌', label:'Decline Invitation', desc:'Maybe later'}
      ], '');
      if(i === 0) return;
      J.stage(J.say('No problem! The Moon will wait for you. Come back when you are ready.'));
      await J.cta('I CHANGED MY MIND! 🚀');
    }
  }

  async function journey(){
    J.hud({title:'Journey to the Moon', dots:[3,0]});
    J.stage(J.say('Time to suit up! Choose the right gear, then pass the safety inspection.')+'<div id="miniHost"></div>');
    await M.dressUp($('miniHost'), {set:'journey', strict:false});
    J.hud({title:'Journey to the Moon', dots:[3,1]});
    J.stage(J.say('Now check the rocket systems before launch.')+'<div id="miniHost"></div>');
    await M.launchPanel($('miniHost'));
    J.hud({title:'Journey to the Moon', dots:[3,2]});
    J.stage(J.say('All checks passed! Strap in…')+
      '<div class="sky"><span class="earth" aria-hidden="true">🌍</span><span class="moonp" aria-hidden="true">🌕</span><span class="rocket" id="rk" aria-hidden="true">🚀</span></div><div class="status" id="st" aria-live="polite"></div>');
    var say = function(t){ if($('st')) $('st').textContent = t; };
    await J.cta('LAUNCH! 🚀');
    say('3… 2… 1…'); J.sfx.alarm(); await sleep(900);
    say('Liftoff!'); J.sfx.good(); $('rk').classList.add('go'); await sleep(1500);
    say('Leaving Earth…'); await sleep(1700);
    say('Travelling to the Moon…'); await sleep(1700);
    say('Landing…'); await sleep(1100);
    say('Touchdown on the Moon! 🌕'); J.sfx.win();
    await J.cta('STEP OUT ONTO THE MOON ➜');
  }

  var FAC = [
    {e:'🛋️', n:'Living Area', t:'The crew relaxes, exercises and eats together here.'},
    {e:'🛏️', n:'Sleeping Quarters', t:'Small, quiet rooms where the crew sleeps.'},
    {e:'🔬', n:'Laboratory', t:'Scientists study Moon rocks and run experiments.'},
    {e:'🎛️', n:'Control Room', t:'Screens show oxygen, power and temperature. The radio to Earth is here.'},
    {e:'🍳', n:'Kitchen', t:'Food is stored and heated here. Water is carefully saved.'},
    {e:'🚪', n:'Airlock', t:'A small room between inside and outside, so the air stays in.'},
    {e:'☀️', n:'Solar Power System', t:'Solar panels make electricity. Batteries store it for the Moon night.'}
  ];
  async function tour(){
    J.hud({title:'Welcome to the Moon Base', dots:[3,3]});
    var seen = 0;
    J.stage('<div class="say"><svg viewBox="0 0 200 240" aria-hidden="true"><use href="#astro"/></svg><div class="bubble" id="tsay">Welcome to the lunar base! Tap all 7 places to explore.</div></div>'+
      '<div class="tour" id="tr"></div><div class="cta"><button class="btn" id="restBtn" disabled>Explore all 7 to continue (0/7)</button></div>');
    await new Promise(function(resolve){
      FAC.forEach(function(f){
        var b = document.createElement('button'); b.className = 'fac'; b.innerHTML = '<span class="e">'+f.e+'</span>'+f.n;
        b.onclick = function(){
          J.sfx.tap(); $('tsay').innerHTML = '<b>'+f.n+':</b> '+f.t;
          if(!b.classList.contains('seen')){
            b.classList.add('seen'); seen++;
            if(seen === 7){ $('restBtn').disabled = false; $('restBtn').textContent = 'REST FOR THE NIGHT 🌙'; $('restBtn').focus({preventScroll:true}); J.sfx.good(); }
            else $('restBtn').textContent = 'Explore all 7 to continue ('+seen+'/7)';
          }
        };
        $('tr').appendChild(b);
      });
      $('restBtn').onclick = function(){ J.sfx.tap(); resolve(); };
    });
    J.stage('<div class="card night"><div class="z" aria-hidden="true">😴</div><h2>Good night!</h2><p class="story">The journey was tiring. Rest now. The real experience starts tomorrow morning.</p></div>');
    await J.cta('GOOD MORNING! ☀️');
  }

  /* ---------- Daily tasks ---------- */
  async function dayIntro(){
    J.show('game');
    J.hud({title:'A Day on the Moon', dots:[7,0], meters:true, clock:'07:30'});
    J.buildMeters();
    J.stage(J.say('Good morning, Commander! Base report: '+S.cond.t+' Keep an eye on oxygen, power, food and water.'));
    await J.cta('START THE DAY ☀️');
  }

  async function task1(){
    setTask(0);
    var sc = await scored(0, 'Good morning! Check every reading on the control panel.', function(host){ return M.healthCheck(host, S.abn); });
    S.safety += 1;
    var it = M.INST[S.abn];
    var slow = sc.attempts > 1;
    await taskResult(0, sc, {
      tag:slow ? '🙂 Found, but a bit late' : '✅ Problem found early', tagClass:slow ? 'mixed' : 'good',
      story: slow ? 'You found the '+it.name.toLowerCase()+' problem after a few tries, so the base used extra power for repairs.'
                  : 'You spotted the '+it.name.toLowerCase()+' problem right away and fixed it early. No extra repairs needed!',
      fx: {p: slow ? -8 : -3},
      fact:'The air on the space station is about 21% oxygen, just like the air on Earth.'
    });
  }

  async function task2(){
    setTask(1);
    J.stage(banner(1)+J.say('Time for breakfast! What will you eat?'));
    var meals = [
      {ico:'🥣', label:'Hearty breakfast', desc:'Oatmeal and juice', fx:{f:-12,w:-8}},
      {ico:'🍎', label:'Light breakfast', desc:'Fruit pouch and crackers', fx:{f:-6,w:-5}},
      {ico:'🍫', label:'Quick snack', desc:'Energy bar and a drink', fx:{f:-4,w:-9}}
    ];
    var mi = await J.choose(meals);
    var sc = await scored(1, 'There is no gravity! Grab the floating food before it drifts away.', function(host){
      return M.breakfast(host).then(function(r){ if(!r.ok) r.fx = {f:-2*r.lost}; return r; });
    });
    await taskResult(1, sc, {
      tag:'🍽️ Breakfast finished', tagClass:'good',
      story:'You finished your '+meals[mi].label.toLowerCase()+'. Food and water supplies went down.',
      fx: meals[mi].fx,
      fact:'Astronauts often eat food in sticky sauces or pouches so crumbs do not float into machines.'
    });
  }

  async function task3(){
    setTask(2);
    var sc = await scored(2, 'Suit up for the moonwalk! Choose the right gear, then check it for damage.', function(host){
      return M.dressUp(host, {set:'eva', strict:true, damage:true, title:'🧑‍🚀 Suit up: choose the right outdoor gear'});
    });
    S.safety += 1;
    await taskResult(2, sc, {
      tag:'✅ Suit ready', tagClass:'good',
      story:'Your spacesuit passed the inspection. You can safely go outside. The airlock used a little oxygen and power.',
      fx:{o:-3, p:-2},
      fact:'A spacesuit works like a tiny spaceship. It gives you air, controls temperature and protects you from dust.'
    });
  }

  var LOCS = [
    {id:'A', ico:'🕳️', label:'Nearby crater', desc:'Ordinary rocks. Low use of resources.', fx:{o:-10,p:-4,w:-2}, back:{p:-2}},
    {id:'B', ico:'🪨', label:'Rock formation', desc:'More samples. Medium use of resources.', fx:{o:-18,p:-8,w:-4}, back:{o:-4,p:-6}},
    {id:'C', ico:'🌑', label:'Shadowed area', desc:'Special clues. High use of resources.', fx:{o:-26,p:-12,w:-6}, back:{o:-6,p:-9}},
    {id:'D', ico:'📡', label:'Surface survey', desc:'Environment data. Low risk, fewer samples.', fx:{o:-6,p:-3}, back:{p:-1}}
  ];
  var ROCKS = [
    {name:'Basalt', e:'⬛', kind:'Dark rock'},
    {name:'Anorthosite', e:'⬜', kind:'Light rock'},
    {name:'Breccia', e:'🟫', kind:'Broken rock'}
  ];
  var DATA = [
    {name:'Temperature', e:'🌡️', kind:'Heat data'},
    {name:'Dust', e:'🌫️', kind:'Dust data'},
    {name:'Radiation', e:'☢️', kind:'Radiation data'}
  ];

  async function task4(){
    setTask(3);
    J.stage(banner(3)+J.say('Where will you explore? Bigger trips find more but use more oxygen!'));
    var li = await J.choose(LOCS.map(function(l){ return {ico:l.ico, label:l.label, desc:l.desc, fx:l.fx}; }), '');
    var loc = LOCS[li]; S.loc = loc;
    var cfg = {digs:9, required: loc.id==='D' ? DATA : ROCKS, extras:[]};
    if(loc.id === 'B') cfg.extras = [{name:'Bonus rock', e:'💎'}];
    if(loc.id === 'C' && Math.random() < 0.6) cfg.extras = [{name:'Ice clue', e:'🧊'}];
    var sc = await scored(3, 'Dig for 3 different samples. Use the numbers to search carefully!', function(host){ return M.rocks(host, cfg); });
    var extras = sc.r.extras || [];
    var ice = extras.indexOf('Ice clue') >= 0;
    S.ice = ice;
    var base = loc.id==='D' ? 2 : 3;
    var gain = base + (extras.indexOf('Bonus rock')>=0 ? 1 : 0) + (ice ? 2 : 0);
    var extraO = (sc.attempts-1)*3;
    var fx = {o: loc.fx.o - extraO, p: loc.fx.p, r: gain}; if(loc.fx.w) fx.w = loc.fx.w;
    var story = {
      A:'You collected ordinary rock samples close to the base. Low risk and low cost.',
      B:'You found more samples, but the rocky ground took more oxygen and the walk back will cost more.',
      C: ice ? 'Amazing! You found a (simulated) clue that could mean water ice. It took lots of oxygen to get there.'
             : 'You searched the dark area but found no ice clue this time. Finding ice is never guaranteed.',
      D:'You gathered data about the Moon\'s surface without long walks. Fewer samples, but very safe.'
    }[loc.id];
    var fact = loc.id==='C' ? 'Some craters near the Moon\'s poles never see sunlight. Scientists think they may hold water ice.'
             : loc.id==='D' ? 'Instruments measure the Moon\'s temperature, dust and radiation to keep astronauts safe.'
             : 'Moon rocks brought back by Apollo astronauts are still studied by scientists today.';
    await taskResult(3, sc, {tag:'🔬 Research done', tagClass:'good', story:story, fx:fx, fact:fact,
      extra:'<div class="chips"><span class="chip neutral">Research total: '+S.research+(gain?'':'')+'</span></div>'});
  }

  async function task5(){
    setTask(4);
    J.stage(banner(4));
    var back = S.loc.back;
    await J.result({tag:'🚶 Walking back', tagClass:'mixed', story:'Coming back from the '+S.loc.label.toLowerCase()+' used more resources.', fx:back, warn:false, btn:'GO TO THE SOLAR PANELS ➜'});
    var weakOut = 38;
    if(S.scenario === 'B'){
      J.stage(banner(4));
      await J.result({tag:'⚡ POWER SHORTAGE', tagClass:'bad', story:'The solar panels are working much worse than expected! The base does not have enough electricity.', fx:{p:-15}, btn:'SHARE THE POWER ➜'});
      J.stage(banner(4)+J.say('Choose which systems to switch off. Keep the essentials ON!')+'<div id="miniHost"></div>');
      var d = await M.distribution($('miniHost'), 70);
      S.eventPts = d.mistakes === 0 ? 2 : 1; S.safety += S.eventPts; S.emergency = true;
      var rfx = {p:6}; if(!d.labOn) rfx.r = -1;
      J.stage(banner(4));
      await J.result({tag:'✅ Power plan set', tagClass:'good', story:d.labOn ? 'You kept the science lab running and still protected the essentials. Well planned!' : 'The essentials stay on. The science lab is paused to save power.',
        fx:rfx, fact:'On the Moon there is no air to hold heat, so the base heater and insulation are very important.'});
      weakOut = 22;
    }
    var outs = [J.rand(88,94), J.rand(86,92), J.rand(87,93), J.rand(88,94)], weak = J.rand(0,3);
    outs[weak] = weakOut;
    var sc = await scored(4, 'The solar panels make less power than expected. Find the problem and fix it!', function(host){ return M.power(host, {outputs:outs, weak:weak}); });
    await taskResult(4, sc, {
      tag:'🔧 Power restored', tagClass:'good',
      story: sc.attempts===1 ? 'You cleaned the dusty panel and reconnected the cables. Power is much better!' : 'After some tries, the panel is clean and the cables are connected. Power is better.',
      fx:{p: sc.attempts===1 ? 12 : 8},
      fact:'Moon dust is sharp and sticky. It can scratch equipment and cover solar panels, so cleaning matters.'
    });
  }

  async function radiationEvent(){
    S.emergency = true;
    J.stage('<div class="card" style="border-color:var(--red)"><span class="tag bad">⚠ WARNING</span><p class="story">SOLAR PARTICLE EVENT DETECTED.<br>Please return to the habitat and prepare the radiation shelter.</p></div>');
    J.sfx.alarm(); J.T(J.sfx.alarm, 600);
    await J.cta('STOP WORK AND RETURN TO BASE 🏃');
    J.stage(J.say('Safety first! No more outdoor exploring. How will you use your supplies?'));
    var opts = [
      {ico:'💧', label:'Move more water and food into the shelter', desc:'More protective supplies. Less left for daily use.', fx:{f:-10,w:-10}},
      {ico:'⚖️', label:'Share supplies evenly', desc:'Balance daily needs and the shelter.', fx:{f:-5,w:-5}},
      {ico:'🔌', label:'Turn off non-essential equipment', desc:'Saves electricity. Some research is paused.', fx:{p:8,r:-1}}
    ];
    var ci = await J.choose(opts);
    J.stage(J.say('Now build the radiation shelter.')+'<div id="miniHost"></div>');
    var attempts = 0, r;
    while(true){
      attempts++;
      r = await M.shelter($('miniHost'), {once:true});
      if(r.ok) break;
      J.stage(J.say('Not safe yet! Try again.')+'<div id="miniHost"></div>');
    }
    S.eventPts = attempts === 1 ? 2 : 1; S.safety += S.eventPts;
    J.stage(J.say('The shelter is ready!'));
    await J.result({tag:'🏠 Crew is safe', tagClass:'good',
      story:'Everyone is inside the shelter. Thick materials block much of the radiation. You must not go outside until the storm has passed.',
      fx:opts[ci].fx,
      fact:'The Moon has no thick air or magnetic field to block radiation. Future bases may be covered with Moon soil for protection.'});
  }

  async function task6(){
    setTask(5);
    if(S.scenario === 'C') await radiationEvent();
    setTask(5);
    J.stage(banner(5)+J.say('Time to report to Mission Control. Electricity is limited, so choose wisely!'));
    var picks = [];  // report kinds sent
    var fxTotal = {}, research = 0;
    if(S.emergency){
      J.append('<div class="card"><span class="tag bad">⚠ RULE</span><p class="story">There is an emergency. You must send the <b>safety report first</b>. You cannot skip it for extra research points.</p></div>');
      await J.cta('SEND SAFETY REPORT 📡');
      picks.push('E'); fxTotal.p = -4;
      J.stage(banner(5)+J.say('Safety report ready! Do you also want to send another report?'));
      var ex = await J.choose([
        {ico:'📋', label:'Add the full report', desc:'Everything, but uses more power.', fx:{p:-10}},
        {ico:'🔬', label:'Add the research report', desc:'Science results go to Earth.', fx:{p:-7, r:1}},
        {ico:'✋', label:'Send nothing more', desc:'Save electricity.'}
      ]);
      if(ex === 0){ picks.push('F'); fxTotal.p -= 10; }
      if(ex === 1){ picks.push('R'); fxTotal.p -= 7; research = 1; }
    } else {
      var ci = await J.choose([
        {ico:'📋', label:'Full report', desc:'Complete information. Uses more power.', fx:{p:-12}},
        {ico:'🚨', label:'Emergency report', desc:'Oxygen, power and safety first. Other info incomplete.', fx:{p:-4}},
        {ico:'🔬', label:'Research report', desc:'Science first. Non-emergency news is delayed.', fx:{p:-8, r:1}}
      ]);
      picks.push(['F','E','R'][ci]);
      fxTotal.p = [-12,-4,-8][ci]; research = ci === 2 ? 1 : 0;
      S.eventPts = ci === 2 ? 1 : 2; S.safety += S.eventPts;
    }
    if(research) fxTotal.r = research;
    var sc = await scored(5, 'Aim the antenna at Earth to send your report.', function(host){ return M.dish(host); });
    var txt = picks.indexOf('E')>=0 ? 'Mission Control received your safety information first.' :
              picks.indexOf('F')>=0 ? 'Mission Control received your complete report.' : 'Mission Control received your science results. Safety news will come later.';
    await taskResult(5, sc, {tag:'📡 Report sent', tagClass:'good', story:txt, fx:fxTotal,
      fact:'Radio signals take about 1.3 seconds to travel from Earth to the Moon.'});
  }

  async function task7(){
    setTask(6);
    var sc = await scored(6, 'You are back at the base. Follow the right order to finish the day safely.', function(host){ return M.sequence(host); });
    S.safety += 1;
    await taskResult(6, sc, {
      tag:'🌙 Base is safe for the night', tagClass:'good',
      story:'Equipment is stored and the base is checked. Night heating, dinner and sleep use some supplies.',
      fx:{o:-5,p:-4,f:-6,w:-4},
      fact:'A night on the Moon lasts about 14 Earth days, so bases need power to stay warm.',
      btn:'SEE MISSION EVALUATION 🏁'
    });
  }

  /* ---------- Ending ---------- */
  var ENDINGS = {
    S:{icon:'🏆', title:'Ending S: Outstanding Astronaut', award:'Outstanding Moon Explorer',
       story:'You completed all tasks, achieved valuable research results and kept the base resources stable.',
       quote:'Outstanding work, Astronaut! Your excellent decisions and resource management have made this mission a great success.'},
    A:{icon:'🥇', title:'Ending A: Excellent Astronaut', award:'Excellent Moon Explorer',
       story:'You completed the lunar living experience and obtained good research results.',
       quote:'Excellent work! You have successfully completed your lunar living experience. Your mission decisions showed great responsibility.'},
    B:{icon:'🥈', title:'Ending B: Good Astronaut', award:'Junior Moon Explorer',
       story:'You completed the day, but the scientific results were limited and more base resources were used.',
       quote:'Good job! You completed your mission. With more practice and better planning, you can become an even better astronaut.'},
    C:{icon:'🌟', title:'Ending C: Mission Completed', award:'Future Astronaut',
       story:'With help from the system, you completed all the necessary tasks. There is room to improve, and you learned a lot about living on the Moon.',
       quote:'Mission Completed! Every astronaut starts somewhere. Keep learning and exploring!'}
  };

  function ending(){
    var avg = (S.res.o + S.res.p + S.res.f + S.res.w) / 4;
    var miniPts = Math.min(35, S.mini);
    var resPts = Math.max(0, Math.min(10, Math.round((avg - 40) / 6)));
    var safePts = Math.min(5, S.safety);
    var total = miniPts + resPts + safePts;
    var key = total >= 46 ? 'S' : total >= 40 ? 'A' : total >= 32 ? 'B' : 'C';
    var E = ENDINGS[key];

    var tip = '';
    if(key === 'B' || key === 'C'){
      if(miniPts < 25) tip = 'Next time: take your time in the mini-games. Fewer tries means more points.';
      else if(resPts < 5) tip = 'Next time: try a nearby crater and a light breakfast to save resources.';
      else tip = 'Next time: follow safety steps carefully and respond quickly to alerts.';
    } else if(key === 'A'){ tip = 'So close to Ending S! Try to win each mini-game on the first try.'; }
    else tip = 'Try a different research location and report next time. The weather changes every game!';

    var lesson = S.scenario==='C' ? 'Solar storms are a real risk in space. Shelters and thick materials help protect astronauts.' :
                 S.scenario==='B' ? 'A Moon base needs reliable power. When power is short, keep life support, heat and radio first.' :
                 'Every decision on the Moon uses oxygen, power, food or water. Good planning keeps a crew safe.';
    var best = +J.store('jamt_best_score') || 0;
    if(total > best) J.store('jamt_best_score', String(total));

    var fm = '';
    ['o','p','f','w'].forEach(function(k){
      var v = S.res[k], st = J.stateOf(v);
      fm += '<div class="meter '+st+'" data-k="'+k+'"><div class="m-top"><span aria-hidden="true">'+J.RES[k].icon+'</span><span class="m-name">'+J.RES[k].name+'</span><span class="m-val"><b>'+v+'</b><small>%</small></span></div>'+
        '<div class="bar"><div class="fill" style="width:'+v+'%"></div></div></div>';
    });
    function row(label, val, max){
      return '<div class="srow"><span>'+label+'</span><div class="bar"><div class="fill" style="width:'+(val/max*100)+'%;background:var(--yellow)"></div></div><b>'+val+'/'+max+'</b></div>';
    }
    var firstTry = S.log.filter(function(l){ return l.attempts === 1; }).length;
    var loc = S.loc ? S.loc.label : '';

    J.hud({title:'Mission Evaluation'});
    $('results').innerHTML =
      '<div class="card"><div class="res-head"><div class="ending-s" aria-hidden="true">'+E.icon+'</div>'+
      '<h2 class="res-title">'+E.title+'</h2><div class="award">🎖️ '+E.award+'</div></div>'+
      '<p class="story" style="text-align:center">'+E.story+'</p>'+
      '<div class="quote">Mission Control: “'+E.quote+'”</div>'+
      '<div class="scorebox">'+row('Mini-games', miniPts, 35)+row('Resources', resPts, 10)+row('Safety', safePts, 5)+
        '<div class="srow"><b style="text-align:left;grid-column:1/3;font-size:1.1rem">Total score</b><b style="font-size:1.2rem">'+total+'/50</b></div></div>'+
      '<div class="final">'+fm+'</div>'+
      '<p class="sim" style="margin:0">Simulated game values, not real NASA measurements.</p>'+
      '<ul class="picks"><li>🎮 Mini-games won on the first try: '+firstTry+' of 7</li>'+
      '<li>🔬 Research: '+S.research+' points'+(loc?' ('+loc+')':'')+(S.ice?' · found an ice clue!':'')+'</li>'+
      '<li>🌤️ Space weather today: '+SCENARIOS[S.scenario]+'</li></ul>'+
      '<div class="learn"><b>🌟 YOU LEARNED</b>'+lesson+'</div>'+
      '<div class="hintline">💡 '+tip+'</div>'+
      '<div class="res-actions"><button class="btn" id="againBtn">PLAY AGAIN 🔄</button></div>'+
      '<details class="grown"><summary>👨‍👩‍👧 For grown-ups</summary><ul>'+
      '<li><b>Life support:</b> the ISS recycles water and air, and makes oxygen from water with electricity.</li>'+
      '<li><b>Radiation:</b> beyond Earth\'s magnetic field, solar storms are a real risk. NASA forecasts space weather and plans shelters.</li>'+
      '<li><b>Power:</b> a Moon night lasts about 14 Earth days, so bases need batteries or other sources.</li>'+
      '<li><b>Trade-offs:</b> every fix costs something. Real mission teams balance air, power and safety the same way.</li>'+
      '</ul></details></div>';
    J.show('results');
    if(key === 'S' || key === 'A'){ J.sfx.win(); J.confetti(); } else J.sfx.good();
    $('againBtn').onclick = function(){ location.hash = '#play'; location.reload(); };
    $('againBtn').focus({preventScroll:true});
  }

  /* ---------- Main ---------- */
  async function main(){
    var mode = 'full';
    if(location.hash === '#play'){ /* replay: skip welcome */ }
    else if(location.hash === '#day'){ mode = 'day'; }
    else mode = await welcome();
    newState();
    if(mode === 'full'){
      await invitation();
      await J.training();
      await journey();
      await tour();
    }
    await dayIntro();
    await task1(); await task2(); await task3(); await task4();
    await task5(); await task6(); await task7();
    ending();
  }

  var best = +J.store('jamt_best_score');
  if(best) $('best').textContent = 'Your best score: '+best+' / 50';
  if(location.hash === '#play' || location.hash === '#day'){ J.show('game'); }
  main();
})();
