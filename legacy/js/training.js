/* Astronaut Training: 5 short levels. Not scored. Wrong answers give a hint; players can always try again. */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$;
  var TOTAL = 5;

  var L1 = { title:'1. Meet the Moon', ico:'🌕', kind:'Multiple choice', qs:[
    { q:'How long does the Moon take to travel once around Earth?', opts:['About 1 day','About 27 days','About 1 year'], a:1,
      hint:'Think "moon-th": about a month.', fact:'The Moon circles Earth about once a month.' },
    { q:'Where does moonlight come from?', opts:['The Moon makes its own light','It reflects sunlight','It comes from city lights on Earth'], a:1,
      hint:'The Moon is a big rock. It cannot glow by itself.', fact:'The Moon shines because sunlight bounces off it.' },
    { q:'Moon gravity compared to Earth is about…', opts:['The same','One sixth','Zero'], a:1,
      hint:'Astronauts on the Moon could jump much higher, but they did not float away.', fact:'On the Moon you would weigh about one sixth of your Earth weight.' }
  ]};

  var L2 = { title:'2. Life in Space', ico:'🛰️', kind:'True or false', qs:[
    { q:'Astronauts float on the space station because there is no gravity at all.', a:false,
      why:'False! Gravity is still there. The station and the astronauts are falling around Earth together, so they float.' },
    { q:'Astronauts exercise about two hours a day to keep their muscles and bones strong.', a:true,
      why:'True! In space, muscles and bones get weaker without exercise.' },
    { q:'Astronauts take a bath in a big tub in space.', a:false,
      why:'False! Water floats in blobs. They clean up with wipes and rinseless soap.' },
    { q:'The space station recycles water, even moisture from the air.', a:true,
      why:'True! Water is very precious in space, so it is cleaned and used again.' }
  ]};

  var L3 = { title:'3. Astronaut Equipment', ico:'🧤', kind:'Matching', pairs:[
    ['🪖 Helmet','Protects your head and gives clear sight'],
    ['🧤 Gloves','Protect hands and help hold tools'],
    ['🎒 Oxygen backpack','Supplies air to breathe'],
    ['🥾 Boots','Protect feet on rocky ground']
  ]};

  var L4 = { title:'4. Lunar Environment', ico:'🌡️', kind:'What would you do?', qs:[
    { q:'Sunlit Moon ground is very hot and shadows are very cold. What must your spacesuit do?',
      opts:['Keep your body at a safe temperature','Only look cool','Nothing. It is always warm.'], a:0,
      hint:'Your suit is like a tiny spaceship you wear.', fact:'Temperatures on the Moon can swing by hundreds of degrees between sun and shadow.' },
    { q:'There is no air on the Moon. How can you talk to a friend outside?',
      opts:['Shout loudly','Use the radio in your suit','Wave your arms'], a:1,
      hint:'Sound needs air to travel through.', fact:'Sound cannot travel through empty space, so astronauts talk by radio.' }
  ]};

  var L5 = { title:'5. Space Safety', ico:'🚨', kind:'What would you do?', qs:[
    { q:'Your suit alarm says OXYGEN LOW. What do you do first?',
      opts:['Keep working to finish the job','Stop, tell Mission Control and head to the airlock','Take off your helmet'], a:1,
      hint:'Safety comes first, and never take your helmet off outside!', fact:'Astronauts always follow safety steps, even when they are very busy.' },
    { q:'Mission Control warns: SOLAR STORM! What do you do?',
      opts:['Go to the radiation shelter','Take photos of the Sun outside','Keep digging for rocks'], a:0,
      hint:'Radiation can harm the body. Get under cover.', fact:'Solar storms send out fast particles. Shelters help to block them.' }
  ]};

  function progress(level){ J.hud({title:'Astronaut Training', dots:[TOTAL, level]}); }

  function header(L, sub){
    return '<div class="banner"><span style="font-size:2rem" aria-hidden="true">'+L.ico+'</span><div><span class="n">'+L.title+'</span><small>'+L.kind+(sub?' · '+sub:'')+'</small></div></div>';
  }

  /* Multiple-choice question. Resolves when answered correctly and "Next" pressed. */
  function mcQuestion(L, q, idx, n){
    return new Promise(function(resolve){
      J.stage(header(L, 'Question '+(idx+1)+' of '+n)+
        '<div class="card"><div class="q-text">'+q.q+'</div><div class="opts" id="opts"></div><div id="fb"></div></div>');
      var box = $('opts'), done = false;
      q.opts.forEach(function(text,i){
        var b = document.createElement('button'); b.className = 'opt'; b.textContent = text;
        b.onclick = function(){
          if(done) return;
          if(i === q.a){
            done = true; b.classList.add('ok'); J.sfx.good();
            $('fb').innerHTML = '<div class="fact"><span class="fi" aria-hidden="true">✅</span><div><b>CORRECT!</b>'+q.fact+'</div></div>';
            J.cta(idx+1<n ? 'NEXT ➜' : 'FINISH LEVEL ✔').then(resolve);
          } else {
            b.classList.add('no','shake'); b.disabled = true; J.sfx.miss();
            $('fb').innerHTML = '<div class="hintline">Not quite. Hint: '+q.hint+'</div>';
          }
        };
        box.appendChild(b);
      });
    });
  }

  function tfQuestion(L, q, idx, n){
    return new Promise(function(resolve){
      J.stage(header(L, 'Statement '+(idx+1)+' of '+n)+
        '<div class="card"><div class="q-text">'+q.q+'</div><div class="tf"><button class="opt" id="tBtn">👍 TRUE</button><button class="opt" id="fBtn">👎 FALSE</button></div><div id="fb"></div></div>');
      var done = false;
      function answer(val, btn){
        if(done) return;
        if(val === q.a){
          done = true; btn.classList.add('ok'); J.sfx.good();
          $('fb').innerHTML = '<div class="fact"><span class="fi" aria-hidden="true">✅</span><div><b>CORRECT!</b>'+q.why+'</div></div>';
          J.cta(idx+1<n ? 'NEXT ➜' : 'FINISH LEVEL ✔').then(resolve);
        } else {
          btn.classList.add('no','shake'); btn.disabled = true; J.sfx.miss();
          $('fb').innerHTML = '<div class="hintline">Not quite. Look again and try the other one!</div>';
        }
      }
      $('tBtn').onclick = function(){ answer(true, this); };
      $('fBtn').onclick = function(){ answer(false, this); };
    });
  }

  function matching(L){
    return new Promise(function(resolve){
      var left = L.pairs.map(function(p,i){ return {i:i, t:p[0]}; });
      var right = J.shuffle(L.pairs.map(function(p,i){ return {i:i, t:p[1]}; }));
      J.stage(header(L)+'<div class="card"><div class="q-text">Tap an item, then tap what it does.</div><div class="match" id="mt"></div><div id="fb"></div></div>');
      var grid = $('mt'), sel = null, matched = 0, lBtns = [], rBtns = [];
      for(var r=0;r<left.length;r++){
        (function(r){
          var lb = document.createElement('button'); lb.className = 'opt'; lb.textContent = left[r].t;
          var rb = document.createElement('button'); rb.className = 'opt'; rb.textContent = right[r].t;
          lb.onclick = function(){
            if(lb.classList.contains('done')) return;
            lBtns.forEach(function(x){ x.classList.remove('sel'); });
            lb.classList.add('sel'); sel = left[r].i; J.sfx.tap();
          };
          rb.onclick = function(){
            if(rb.classList.contains('done') || sel===null) return;
            if(sel === right[r].i){
              rb.classList.add('done'); lBtns[sel].classList.remove('sel'); lBtns[sel].classList.add('done');
              sel = null; matched++; J.sfx.good();
              if(matched === left.length){
                $('fb').innerHTML = '<div class="fact"><span class="fi" aria-hidden="true">✅</span><div><b>ALL MATCHED!</b>A spacesuit is like a tiny spaceship you wear.</div></div>';
                J.cta('FINISH LEVEL ✔').then(resolve);
              }
            } else {
              rb.classList.add('shake'); J.sfx.miss();
              $('fb').innerHTML = '<div class="hintline">Not that one. Think about what each piece is for.</div>';
              setTimeout(function(){ rb.classList.remove('shake'); }, 450);
            }
          };
          grid.appendChild(lb); grid.appendChild(rb); lBtns[left[r].i] = lb; rBtns.push(rb);
        })(r);
      }
    });
  }

  async function runLevel(level, L){
    progress(level);
    if(L.pairs){ await matching(L); return; }
    for(var i=0;i<L.qs.length;i++){
      if(L.kind === 'True or false') await tfQuestion(L, L.qs[i], i, L.qs.length);
      else await mcQuestion(L, L.qs[i], i, L.qs.length);
    }
  }

  J.training = async function(){
    J.hud({title:'Astronaut Training', dots:[TOTAL,0]});
    J.stage(J.say('Welcome to the training centre! Pass 5 short levels to join the Moon mission.'));
    await J.cta('BEGIN TRAINING 🎓');
    var levels = [L1,L2,L3,L4,L5];
    for(var i=0;i<levels.length;i++){
      await runLevel(i, levels[i]);
      if(i < levels.length-1){
        J.stage(J.say('Level '+(i+1)+' complete! ⭐'));
        J.sfx.good();
        await J.cta('NEXT LEVEL ➜');
      }
    }
    J.hud({title:'Astronaut Training', dots:[TOTAL,TOTAL]});
    J.stage('<div class="card" style="text-align:center"><div style="font-size:3rem">🎓</div><h2>TRAINING PASSED!</h2>'+
      '<p class="story">You now have permission to join the Moon mission.</p></div>');
    J.sfx.win();
    await J.cta('GO TO THE ROCKET 🚀');
  };
})();
