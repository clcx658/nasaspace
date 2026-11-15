/* Start of the adventure: a 5-question quiz. Get 4 right (80%) to earn the ticket to the Moon, or try again. */
(function(){
  'use strict';
  var J = window.JAM;
  var PASS = 4;   // 4 of 5 = 80%

  var QUESTIONS = [
    {q:'Why does the Moon have so many craters?',
     a:[{t:'Space rocks crash into it, and there is almost no air to slow them down', ok:1},
        {t:'Rain washed holes in the ground'}, {t:'Astronauts dug them with rovers'}, {t:'The Moon is made of cheese'}],
     fact:'Earth\'s thick air burns up most space rocks. The Moon has almost no air, so every rock hits the ground and makes a crater.'},
    {q:'With no gravity, water makes floating bubbles instead of pouring down.',
     a:[{t:'TRUE: it floats', ok:1}, {t:'FALSE: it falls'}], tf:true,
     fact:'In space, water pulls itself into a round ball and floats in the air.'},
    {q:'What do you wear for a walk on the Moon?',
     a:[{t:'A space helmet, space gloves, an air backpack and moon boots', ok:1},
        {t:'A bike helmet and rain boots'}, {t:'Swim goggles and sandals'}],
     fact:'Your space suit gives you air to breathe, keeps you warm and protects your head and hands.'},
    {q:'On the Moon it is very hot in the day and very cold at night. How does your suit keep you safe?',
     a:[{t:'Many warm layers, and tiny tubes of cool water', ok:1},
        {t:'A thick wool sweater'}, {t:'It does not. The weather is nice.'}],
     fact:'The Moon is about 120°C in the day and about −130°C at night. A space suit has 14 thin layers and cool water tubes.'},
    {q:'A solar storm is coming! What is the safest thing to do?',
     a:[{t:'Go into the safe shelter under the Moon soil', ok:1},
        {t:'Stay outside and take photos'}, {t:'Climb up the radio dish to look'}],
     fact:'Thick Moon soil blocks the harmful rays from the Sun. Staying safe always comes first.'}
  ];

  var STYLE =
    '#qz{position:relative;min-height:100vh;color:#fff;font-family:Outfit,system-ui,sans-serif;overflow:hidden}'+
    '.qz-bg{position:fixed;inset:0;z-index:0;overflow:hidden;background:'+
      'radial-gradient(ellipse 60% 50% at 18% 8%,rgba(98,64,214,.55),transparent 65%),'+
      'radial-gradient(ellipse 50% 45% at 88% 30%,rgba(0,168,214,.35),transparent 65%),'+
      'radial-gradient(ellipse 70% 40% at 50% 105%,rgba(166,70,200,.45),transparent 70%),'+
      'linear-gradient(180deg,#04051a 0%,#0a0c2e 55%,#150f38 100%)}'+
    '.qz-stars{position:absolute;inset:0}'+
    '.qz-stars i{position:absolute;left:0;top:0;border-radius:50%;background:#fff;animation:qztw 4s ease-in-out infinite}'+
    '@keyframes qztw{50%{opacity:.25}}'+
    '.qz-earth{position:absolute;left:5%;top:11%;width:112px;height:112px;border-radius:50%;'+
      'background:radial-gradient(circle at 34% 30%,#8fdcff 0%,#3b8be0 38%,#1a4aa6 72%,#0a2260 100%);'+
      'box-shadow:0 0 46px rgba(90,180,255,.55),inset -16px -12px 26px rgba(0,0,40,.65);animation:qzfloat 9s ease-in-out infinite}'+
    '.qz-earth::before{content:"";position:absolute;inset:0;border-radius:50%;background:'+
      'radial-gradient(ellipse 22% 16% at 32% 40%,rgba(94,200,120,.9),transparent 70%),radial-gradient(ellipse 20% 26% at 58% 62%,rgba(94,200,120,.85),transparent 70%),'+
      'radial-gradient(ellipse 30% 10% at 55% 22%,rgba(255,255,255,.55),transparent 70%)}'+
    '@keyframes qzfloat{50%{transform:translateY(-10px)}}'+
    '.qz-moon{position:absolute;left:50%;bottom:-640px;width:1500px;height:960px;margin-left:-750px;border-radius:50%;'+
      'background:radial-gradient(circle at 50% 8%,#e4e1f2 0%,#a8a3c4 35%,#625d82 75%,#3a3556 100%);box-shadow:0 -24px 90px rgba(190,180,255,.4)}'+
    '.qz-moon::before{content:"";position:absolute;inset:0;border-radius:50%;background:'+
      'radial-gradient(ellipse 60px 22px at 28% 14%,rgba(60,55,90,.55),transparent 72%),radial-gradient(ellipse 90px 30px at 62% 10%,rgba(60,55,90,.5),transparent 72%),'+
      'radial-gradient(ellipse 40px 14px at 45% 20%,rgba(60,55,90,.5),transparent 72%),radial-gradient(ellipse 70px 24px at 80% 22%,rgba(60,55,90,.45),transparent 72%),'+
      'radial-gradient(ellipse 50px 16px at 12% 26%,rgba(60,55,90,.45),transparent 72%)}'+
    '.qz-shoot{position:absolute;top:18%;left:-12%;width:140px;height:2px;background:linear-gradient(90deg,transparent,#fff);transform:rotate(18deg);opacity:0;animation:qzshoot 9s linear infinite 2s}'+
    '.qz-shoot.b{top:34%;animation-delay:6s;animation-duration:11s}'+
    '@keyframes qzshoot{0%{opacity:0;transform:translate(0,0) rotate(18deg)}4%{opacity:1}14%{opacity:0;transform:translate(130vw,40vw) rotate(18deg)}100%{opacity:0}}'+
    '.qz-top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:1rem 1.4rem}'+
    '.qz-logo{font-weight:900;font-size:1.25rem;color:#00e5ff;text-shadow:0 0 14px rgba(0,229,255,.5)}'+
    '.qz-menu{border:2px solid rgba(255,255,255,.25);background:rgba(16,18,40,.6);color:#e1e1f7;border-radius:9999px;padding:.3rem .9rem;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit}'+
    '.qz-dots{display:flex;gap:.45rem}.qz-dots i{width:2.2rem;height:.55rem;border-radius:.4rem;background:rgba(255,255,255,.2)}'+
    '.qz-dots i.ok{background:#22ef7e}.qz-dots i.no{background:#ff5d73}.qz-dots i.now{background:#ffb300}'+
    '.qz-wrap{position:relative;z-index:2;display:flex;justify-content:center;padding:1rem 1rem 6rem}'+
    '.qz-card{width:100%;max-width:46rem;background:rgba(14,16,42,.78);backdrop-filter:blur(10px);border:2px solid rgba(0,229,255,.5);border-radius:1.8rem;padding:1.6rem 1.5rem 1.5rem;box-shadow:0 0 40px rgba(0,229,255,.2),0 20px 60px rgba(0,0,0,.45)}'+
    '.qz-kick{font-weight:900;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#ffb300}'+
    '.qz-q{font-size:1.75rem;font-weight:900;line-height:1.25;margin:.5rem 0 1.1rem}'+
    '.qz-opts{display:grid;gap:.7rem}'+
    '.qz-opt{display:flex;align-items:center;gap:.8rem;width:100%;text-align:left;padding:.9rem 1rem;border-radius:1.1rem;border:3px solid rgba(255,255,255,.22);background:rgba(30,34,78,.85);color:#fff;font-weight:800;font-size:1.08rem;cursor:pointer;font-family:inherit;transition:transform .08s,border-color .15s}'+
    '.qz-opt:hover{border-color:#00e5ff}.qz-opt:active{transform:translateY(2px)}'+
    '.qz-opt b{flex:none;display:grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:50%;background:rgba(255,255,255,.14);font-size:1rem}'+
    '.qz-opt.good{border-color:#22ef7e;background:rgba(34,239,126,.18)}.qz-opt.good b{background:#22ef7e;color:#04210f}'+
    '.qz-opt.bad{border-color:#ff5d73;background:rgba(255,93,115,.16)}.qz-opt.bad b{background:#ff5d73;color:#2a0007}'+
    '.qz-opt[disabled]{cursor:default;opacity:.9}.qz-opt.dim{opacity:.45}'+
    '.qz-fb{margin-top:1rem;padding:.9rem 1rem;border-radius:1.1rem;font-weight:700;font-size:1.02rem;line-height:1.4}'+
    '.qz-fb.good{background:rgba(34,239,126,.15);border:2px solid #22ef7e}.qz-fb.bad{background:rgba(255,93,115,.14);border:2px solid #ff5d73}'+
    '.qz-fb h3{font-size:1.2rem;font-weight:900;margin:0 0 .2rem}'+
    '.qz-go{display:block;width:100%;margin-top:1.1rem;border:0;border-radius:9999px;padding:1rem;font-weight:900;font-size:1.15rem;letter-spacing:.03em;text-transform:uppercase;color:#0b0d1b;background:#00e5ff;box-shadow:0 5px 0 #009bb0;cursor:pointer;font-family:inherit;animation:qzpulse 1.5s ease-in-out infinite}'+
    '.qz-go:active{transform:translateY(4px);box-shadow:0 1px 0 #009bb0}.qz-go.gold{background:#ffb300;box-shadow:0 5px 0 #c68400}'+
    '@keyframes qzpulse{50%{box-shadow:0 5px 0 #009bb0,0 0 24px 6px rgba(0,229,255,.5)}}'+
    '.qz-big{font-size:3.4rem;text-align:center;margin:.2rem 0}.qz-res{text-align:center}'+
    '.qz-res h2{font-size:2rem;font-weight:900;margin:.2rem 0}.qz-res p{font-size:1.1rem;font-weight:700;margin:.3rem 0}'+
    '.qz-name{width:100%;margin-top:.8rem;border-radius:9999px;border:3px solid #ffb300;background:#0b0d1b;color:#fff;padding:.85rem 1.2rem;font-size:1.3rem;font-weight:800;text-align:center;font-family:inherit}'+
    '.qz-review{text-align:left;margin-top:1rem;display:grid;gap:.5rem}.qz-review div{background:rgba(255,255,255,.07);border-radius:.9rem;padding:.6rem .8rem;font-weight:700;font-size:.95rem}'+
    '@media (max-width:640px){.qz-q{font-size:1.4rem}.qz-opt{font-size:1rem}.qz-earth{width:70px;height:70px}.qz-logo{font-size:1rem}.qz-dots i{width:1.4rem}}'+
    '@media (prefers-reduced-motion:reduce){.qz-stars i,.qz-earth,.qz-shoot,.qz-go{animation:none}}';

  var HTML =
    '<div id="qz"><div class="qz-bg"><div class="qz-stars" id="qzStars"></div><div class="qz-earth"></div><div class="qz-shoot"></div><div class="qz-shoot b"></div><div class="qz-moon"></div></div>'+
    '<div class="qz-top"><div class="qz-logo">A Day on the Moon</div><div class="qz-dots" id="qzDots"></div><button class="qz-menu" id="qzMenu" type="button">Menu</button></div>'+
    '<div class="qz-wrap"><div class="qz-card" id="qzCard"></div></div></div>';

  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  J.customScreen('quiz', {html:HTML, style:STYLE, bodyClass:'', title:'Moon Ticket Quiz'}, function(root){
    // starry sky
    var sky = root.querySelector('#qzStars'), s = '';
    for(var i = 0; i < 140; i++){
      var sz = Math.random() < .12 ? 3 : Math.random() < .4 ? 2 : 1;
      s += '<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*85).toFixed(1)+'%;width:'+sz+'px;height:'+sz+'px;opacity:'+(.4+Math.random()*.6).toFixed(2)+';animation-delay:'+(Math.random()*4).toFixed(1)+'s"></i>';
    }
    sky.innerHTML = s;

    var card = root.querySelector('#qzCard'), dots = root.querySelector('#qzDots');
    root.querySelector('#qzMenu').onclick = function(){ J.sfx.tap(); J.go('menu'); };
    var st;

    function paintDots(){
      var h = '';
      for(var k = 0; k < QUESTIONS.length; k++){
        var r = st.results[k];
        h += '<i class="'+(r === true ? 'ok' : r === false ? 'no' : k === st.i && !st.done ? 'now' : '')+'"></i>';
      }
      dots.innerHTML = h;
    }
    function start(){
      st = {i:0, results:[], done:false, order:QUESTIONS.map(function(q){ return {q:q, a:q.tf ? q.a : shuffle(q.a)}; })};
      question();
    }
    function question(){
      var cur = st.order[st.i];
      paintDots();
      card.innerHTML =
        '<div class="qz-kick">Question '+(st.i + 1)+' of '+QUESTIONS.length+'</div>'+
        '<div class="qz-q">'+esc(cur.q.q)+'</div>'+
        '<div class="qz-opts">'+cur.a.map(function(o, n){ return '<button type="button" class="qz-opt" data-n="'+n+'"><b>'+'ABCD'.charAt(n)+'</b><span>'+esc(o.t)+'</span></button>'; }).join('')+'</div>'+
        '<div id="qzFb"></div>';
      Array.prototype.forEach.call(card.querySelectorAll('.qz-opt'), function(b){
        b.onclick = function(){ answer(+b.getAttribute('data-n')); };
      });
    }
    function answer(n){
      var cur = st.order[st.i], pick = cur.a[n], right = !!pick.ok;
      st.results[st.i] = right; paintDots();
      right ? J.sfx.good() : J.sfx.miss();
      Array.prototype.forEach.call(card.querySelectorAll('.qz-opt'), function(b, k){
        b.disabled = true;
        if(cur.a[k].ok) b.classList.add('good'); else if(k === n) b.classList.add('bad'); else b.classList.add('dim');
      });
      var last = st.i === QUESTIONS.length - 1;
      card.querySelector('#qzFb').innerHTML =
        '<div class="qz-fb '+(right ? 'good' : 'bad')+'"><h3>'+(right ? '✅ Yes! Well done!' : '❌ Not this time.')+'</h3>'+esc(cur.q.fact)+'</div>'+
        '<button type="button" class="qz-go" id="qzNext">'+(last ? 'See my result ›' : 'Next question ›')+'</button>';
      var nb = card.querySelector('#qzNext'); nb.focus({preventScroll:true});
      nb.onclick = function(){ J.sfx.tap(); if(last) result(); else { st.i++; question(); } };
      nb.scrollIntoView({block:'nearest', behavior:'smooth'});
    }
    function score(){ return st.results.filter(Boolean).length; }
    function result(){
      st.done = true; paintDots();
      var n = score();
      if(n >= PASS) pass(n); else fail(n);
    }
    function pass(n){
      J.sfx.good();
      card.innerHTML = '<div class="qz-res"><div class="qz-big">🎉🚀🎉</div><h2>You got '+n+' of '+QUESTIONS.length+'!</h2>'+
        '<p>You earned your <b style="color:#ffb300">ticket to the Moon</b>.</p>'+
        '<p style="font-size:1rem">Type your name for your ticket:</p>'+
        '<input id="qzName" class="qz-name" type="text" maxlength="20" autocomplete="off" placeholder="Your name" value="'+esc(J.getName ? J.getName() : '')+'">'+
        '<button type="button" class="qz-go gold" id="qzTicket">Get my ticket ›</button></div>';
      var inp = card.querySelector('#qzName'); inp.focus({preventScroll:true});
      function go(){
        var name = J.cleanName(inp.value);
        if(!name){ J.sfx.miss(); J.toast('Please type your name first. It goes on your ticket!'); inp.focus(); return; }
        J.setName(name);
        if(J.G){ J.G.trained = true; J.G.accepted = true; J.save(); }
        J.showTicket(name).then(function(){ J.go('rocket'); });
      }
      card.querySelector('#qzTicket').onclick = function(){ J.sfx.tap(); go(); };
      inp.addEventListener('keydown', function(e){ if(e.key === 'Enter') go(); });
    }
    function fail(n){
      J.sfx.miss();
      var missed = st.order.filter(function(o, k){ return st.results[k] === false; });
      card.innerHTML = '<div class="qz-res"><div class="qz-big">🌙</div><h2>You got '+n+' of '+QUESTIONS.length+'</h2>'+
        '<p>You need <b style="color:#ffb300">'+PASS+'</b> to get your ticket. Let us try again!</p>'+
        '<div class="qz-review">'+missed.map(function(o){ return '<div>💡 '+esc(o.q.fact)+'</div>'; }).join('')+'</div>'+
        '<button type="button" class="qz-go" id="qzAgain">Try again ›</button></div>';
      card.querySelector('#qzAgain').onclick = function(){ J.sfx.tap(); start(); };
    }
    start();
  });
})();
