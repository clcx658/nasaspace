/* Picture-first scenes: the menu, the rocket launch, the Moon landing and the base map use pictures,
   animation and a voice button instead of paragraphs. */
(function(){
  'use strict';
  var J = window.JAM;

  /* ---------- read aloud ---------- */
  J.say = function(text){
    try{
      var ss = window.speechSynthesis; if(!ss) return false;
      ss.cancel();
      var u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]*>/g, '').replace(/[›»]/g, ''));
      u.lang = 'en-GB'; u.rate = 0.95; u.pitch = 1.05; ss.speak(u); return true;
    }catch(e){ return false; }
  };
  function speaker(text, cls){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sp-say ' + (cls || ''); b.setAttribute('aria-label', 'Read this to me'); b.innerHTML = '🔊';
    b.addEventListener('click', function(e){ e.stopPropagation(); J.sfx.tap(); b.classList.add('on'); setTimeout(function(){ b.classList.remove('on'); }, 1800); if(!J.say(text)) J.toast('Your device cannot read aloud.'); });
    return b;
  }
  J.speakerButton = speaker;

  /* ---------- starry sky behind a screen ---------- */
  function spaceBg(root, withMoon){
    if(root.querySelector('.sp-bg')) return;
    var bg = document.createElement('div'); bg.className = 'sp-bg'; bg.setAttribute('aria-hidden', 'true');
    var st = '';
    for(var i = 0; i < 130; i++){
      var sz = Math.random() < .12 ? 3 : Math.random() < .4 ? 2 : 1;
      st += '<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*85).toFixed(1)+'%;width:'+sz+'px;height:'+sz+'px;opacity:'+(.4+Math.random()*.6).toFixed(2)+';animation-delay:'+(Math.random()*4).toFixed(1)+'s"></i>';
    }
    bg.innerHTML = '<div class="sp-stars">'+st+'</div><div class="sp-earth"></div><div class="sp-shoot"></div><div class="sp-shoot b"></div>'+(withMoon === false ? '' : '<div class="sp-moon"></div>');
    root.insertBefore(bg, root.firstChild);
    root.style.background = 'transparent';
  }
  J.spaceBg = spaceBg;

  function info(title, text, icon){
    J.modal({kicker:'', title:(icon ? icon + ' ' : '') + title, html:'<p style="font-size:1.15rem;font-weight:700;line-height:1.4;text-align:center">' + text + '</p>', actions:[{label:'GOT IT', cls:'cyan', value:true}]});
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function wrapScreen(name, fn){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){ var r = old ? old.apply(this, arguments) : undefined; try{ fn(root); }catch(e){ console.warn('scenes ' + name + ':', e.message); } return r; };
  }

  /* ---------- 1. MENU: Commander Nova and one big button ---------- */
  J.coachFor.menu = ['', null];
  wrapScreen('menu', function(root){
    spaceBg(root, true);
    Array.prototype.forEach.call(root.querySelectorAll('main button, main a'), function(b){
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if(/NASA QUESTS|HOW IT WORKS|STORY/i.test(t) && !/START ADVENTURE/i.test(t)) b.style.display = 'none';
    });
    // the little extras inside Commander Nova's card
    Array.prototype.forEach.call(root.querySelectorAll('main *'), function(e){
      if(e.children.length) return;
      var t = (e.textContent || '').trim();
      if(/^(Guide is here|Artemis Base Alpha|Today.s goal|Logs)/i.test(t)){ var c = e.closest('div.flex, div.rounded-full, span.rounded-full') || e; if(!c.querySelector('p, h1, h2, h3')) c.style.display = 'none'; }
    });
    // the big grey circle that was the old background
    Array.prototype.forEach.call(root.querySelectorAll('main .absolute, #app > .absolute, .absolute.rounded-full'), function(e){
      var r = e.getBoundingClientRect();
      if(r.width > 160 && r.height > 160 && !e.querySelector('button,a,p,h1,h2')) e.style.display = 'none';
    });
    var card = null;
    Array.prototype.forEach.call(root.querySelectorAll('main p'), function(p){ if(!card && /Welcome, Cadet/i.test(p.textContent)) card = p; });
    if(card && !root.querySelector('.sp-say')){ var sp = speaker(card.textContent); sp.style.marginLeft = '.5rem'; card.insertAdjacentElement('afterend', sp); }
  });

  /* ---------- 2. ROCKET LAUNCH ---------- */
  var ROCKET = '<svg viewBox="0 0 120 340" class="rk-svg" aria-hidden="true">'+
    '<g id="rkFlame" class="rk-flame"><ellipse cx="60" cy="300" rx="22" ry="60" fill="#ff7a1a"/><ellipse cx="60" cy="292" rx="13" ry="46" fill="#ffd24d"/><ellipse cx="60" cy="286" rx="6" ry="30" fill="#fff6c9"/>'+
    '<ellipse cx="26" cy="292" rx="10" ry="40" fill="#ff7a1a"/><ellipse cx="26" cy="286" rx="5" ry="26" fill="#ffd24d"/><ellipse cx="94" cy="292" rx="10" ry="40" fill="#ff7a1a"/><ellipse cx="94" cy="286" rx="5" ry="26" fill="#ffd24d"/></g>'+
    '<path d="M22 118 Q26 90 30 82 Q34 90 38 118Z" fill="#ff8a3d"/><rect x="18" y="116" width="24" height="150" rx="9" fill="#fff" stroke="#c5cae9" stroke-width="2"/><rect x="18" y="150" width="24" height="12" fill="#ff8a3d"/>'+
    '<path d="M82 118 Q86 90 90 82 Q94 90 98 118Z" fill="#ff8a3d"/><rect x="78" y="116" width="24" height="150" rx="9" fill="#fff" stroke="#c5cae9" stroke-width="2"/><rect x="78" y="150" width="24" height="12" fill="#ff8a3d"/>'+
    '<path d="M60 4 Q82 44 82 96 H38 Q38 44 60 4Z" fill="#fff" stroke="#c5cae9" stroke-width="2"/>'+
    '<rect x="38" y="94" width="44" height="176" rx="6" fill="#f6f6fb" stroke="#c5cae9" stroke-width="2"/>'+
    '<rect x="38" y="122" width="44" height="30" fill="#ff8a3d"/><rect x="38" y="196" width="44" height="14" fill="#3b6be0"/><circle cx="60" cy="72" r="9" fill="#7fd1ff" stroke="#3b6be0" stroke-width="3"/>'+
    '<path d="M38 240 L18 282 H38Z M82 240 L102 282 H82Z" fill="#9aa3d6"/></svg>';
  var ROCKET_STYLE =
    '#rk{position:relative;min-height:100vh;overflow:hidden;color:#fff;font-family:Outfit,system-ui,sans-serif;background:linear-gradient(180deg,#070a26 0%,#1a1c55 38%,#5a3a7e 62%,#f08a5d 86%,#ffc27a 100%)}'+
    '#rk .rk-stars{position:absolute;inset:0 0 40% 0}#rk .rk-stars i{position:absolute;border-radius:50%;background:#fff;animation:sptw 4s ease-in-out infinite}'+
    '#rk .rk-sky{position:absolute;inset:0;transition:transform 5s cubic-bezier(.4,0,.8,.3),opacity 2.4s}'+
    '#rk .rk-cloud{position:absolute;border-radius:50%;background:rgba(255,255,255,.14);filter:blur(6px)}'+
    '#rk .rk-ground{position:absolute;left:0;right:0;bottom:0;height:30vh;background:linear-gradient(180deg,#2b3a2f,#14201a);border-top:4px solid #0d1511}'+
    '#rk .rk-tower{position:absolute;bottom:30vh;left:50%;margin-left:62px;width:34px;height:260px;background:repeating-linear-gradient(0deg,#3a3f5f 0 6px,#2a2e48 6px 12px);border:2px solid #20233a;transform-origin:bottom}'+
    '#rk .rk-pad{position:absolute;left:50%;bottom:calc(30vh - 14px);width:240px;height:26px;margin-left:-120px;background:#3a3f5f;border-radius:6px 6px 0 0;border:2px solid #20233a}'+
    '#rk .rk-rocket{position:absolute;left:50%;bottom:calc(30vh - 52px);width:120px;height:340px;margin-left:-60px;will-change:transform}'+
    '#rk .rk-svg{width:100%;height:100%;overflow:visible}'+
    '#rk .rk-flame{opacity:0;transform-origin:60px 266px;transform:scaleY(.2)}'+
    '#rk.ignite .rk-flame{opacity:1;animation:rkflame .12s infinite alternate;transform:scaleY(1)}'+
    '#rk.ignite .rk-rocket{animation:rkshake .08s infinite}'+
    '#rk.lift .rk-rocket{animation:rkshake .08s infinite;transform:translateY(-125vh);transition:transform 4s cubic-bezier(.45,0,.85,.35)}'+
    '#rk.lift .rk-sky{transform:translateY(40vh)}'+
    '#rk.space .rk-sky{opacity:.0}#rk.space{background:#04051a;transition:background 2s}'+
    '@keyframes rkflame{from{transform:scaleY(.85) scaleX(.95)}to{transform:scaleY(1.15) scaleX(1.05)}}'+
    '@keyframes rkshake{0%{translate:-2px 0}50%{translate:2px 1px}100%{translate:-1px -1px}}'+
    '#rk .rk-smoke{position:absolute;left:50%;bottom:30vh;margin-left:-20px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,#fff,rgba(255,255,255,.2));opacity:0}'+
    '#rk.ignite .rk-smoke,#rk.lift .rk-smoke{animation:rksmoke 2.6s ease-out infinite}'+
    '@keyframes rksmoke{0%{opacity:.9;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(var(--dx),-30px) scale(6)}}'+
    '#rk .rk-streak{position:absolute;top:-20vh;width:2px;height:16vh;background:linear-gradient(180deg,transparent,rgba(255,255,255,.7));opacity:0}'+
    '#rk.lift .rk-streak{opacity:1;animation:rkstreak .6s linear infinite}'+
    '@keyframes rkstreak{to{transform:translateY(140vh)}}'+
    '#rk .rk-top{position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:1rem 1.4rem}'+
    '#rk .rk-title{font-size:2.2rem;font-weight:900;text-shadow:0 0 18px rgba(255,255,255,.4)}'+
    '#rk .rk-count{position:absolute;z-index:6;left:0;right:0;top:26%;text-align:center;font-size:9rem;font-weight:900;color:#ffd24d;text-shadow:0 0 40px rgba(255,180,0,.8);pointer-events:none}'+
    '#rk .rk-count.pop{animation:rkpop .7s ease-out}@keyframes rkpop{0%{transform:scale(.3);opacity:0}30%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:.85}}'+
    '#rk .rk-ctl{position:absolute;z-index:6;left:0;right:0;bottom:3vh;display:flex;flex-direction:column;align-items:center;gap:.5rem;transition:opacity .4s}'+
    '#rk.ignite .rk-ctl,#rk.lift .rk-ctl{opacity:0;pointer-events:none}'+
    '#rk .rk-hold{position:relative;width:150px;height:150px;border-radius:50%;border:0;cursor:pointer;color:#0b0d1b;font-weight:900;font-size:1.25rem;letter-spacing:.04em;font-family:inherit;'+
      'background:conic-gradient(#00e5ff var(--p,0%),#3b3f6e 0);box-shadow:0 0 30px rgba(0,229,255,.45);touch-action:none;user-select:none;-webkit-user-select:none}'+
    '#rk .rk-hold::before{content:"";position:absolute;inset:12px;border-radius:50%;background:#ffb300;box-shadow:inset 0 -6px 0 #c68400}'+
    '#rk .rk-hold span{position:relative;z-index:1;display:block;line-height:1.1}'+
    '#rk .rk-hold:active::before{transform:translateY(3px)}'+
    '#rk .rk-hint{font-size:1.2rem;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,.6)}'+
    '#rk .rk-next{position:absolute;z-index:6;left:0;right:0;top:36%;text-align:center;font-size:2.6rem;font-weight:900;opacity:0;transition:opacity 1.2s;text-shadow:0 0 24px rgba(0,229,255,.7)}'+
    '#rk.space .rk-next{opacity:1}'+
    '@media (max-width:640px){#rk .rk-title{font-size:1.6rem}#rk .rk-count{font-size:6rem}#rk .rk-next{font-size:1.8rem}#rk .rk-rocket{transform-origin:bottom;scale:.8}}'+
    '@media (prefers-reduced-motion:reduce){#rk.ignite .rk-rocket,#rk.lift .rk-rocket{animation:none}}';
  (function(){
    var stars = '', clouds = '', streaks = '', smoke = '';
    for(var i = 0; i < 70; i++) stars += '<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*100).toFixed(1)+'%;width:'+(Math.random()<.2?3:2)+'px;height:'+(Math.random()<.2?3:2)+'px;opacity:'+(.4+Math.random()*.6).toFixed(2)+';animation-delay:'+(Math.random()*4).toFixed(1)+'s"></i>';
    for(var c = 0; c < 6; c++) clouds += '<div class="rk-cloud" style="left:'+(Math.random()*90).toFixed(0)+'%;top:'+(35+Math.random()*35).toFixed(0)+'%;width:'+(120+Math.random()*180).toFixed(0)+'px;height:'+(30+Math.random()*30).toFixed(0)+'px"></div>';
    for(var s = 0; s < 14; s++) streaks += '<div class="rk-streak" style="left:'+(4+s*7)+'%;animation-delay:'+(Math.random()*.6).toFixed(2)+'s"></div>';
    for(var m = 0; m < 7; m++) smoke += '<div class="rk-smoke" style="--dx:'+((m-3)*70)+'px;animation-delay:'+(m*.18).toFixed(2)+'s"></div>';
    var html = '<div id="rk"><div class="rk-sky"><div class="rk-stars">'+stars+'</div>'+clouds+'</div>'+streaks+
      '<div class="rk-ground"></div><div class="rk-tower"></div><div class="rk-pad"></div>'+smoke+
      '<div class="rk-rocket" id="rkRocket">'+ROCKET+'</div>'+
      '<div class="rk-top"><div class="rk-title">Blast off! 🚀</div><button class="sp-menu" id="rkBack" type="button">Back</button></div>'+
      '<div class="rk-count" id="rkCount"></div><div class="rk-next">Next stop: the Moon!</div>'+
      '<div class="rk-ctl"><button type="button" class="rk-hold" id="holdBtn" aria-label="Hold to fire the engines"><span>HOLD</span></button><div class="rk-hint">Hold the button to fire the engines</div></div></div>';
    J.customScreen('rocket', {html:html, style:ROCKET_STYLE, bodyClass:'', title:'Rocket launch'}, function(root){
      var rk = root.querySelector('#rk'), btn = root.querySelector('#holdBtn'), cnt = root.querySelector('#rkCount');
      root.querySelector('#rkBack').onclick = function(){ J.sfx.tap(); J.go('menu'); };
      var p = 0, holding = false, started = false, raf = 0, last = 0, timers = [];
      function later(fn, ms){ timers.push(setTimeout(function(){ if(document.body.contains(rk)) fn(); }, ms)); }
      function paint(){ btn.style.setProperty('--p', Math.round(p * 100) + '%'); }
      function tick(t){
        if(started || !document.body.contains(rk)) return;
        var dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
        p = holding ? Math.min(1, p + dt / 1.4) : Math.max(0, p - dt / 0.9);
        paint();
        if(p >= 1){ launch(); return; }
        raf = requestAnimationFrame(tick);
      }
      function press(){ if(started) return; holding = true; if(!raf) raf = requestAnimationFrame(tick); }
      function release(){ var wasHolding = holding; holding = false; if(wasHolding && !started && p < .3){ J.toast('Keep holding the button down!'); } }
      var downFlag = false;
      btn.addEventListener('pointerdown', function(e){ e.preventDefault(); downFlag = true; press(); });
      btn.addEventListener('click', function(){ if(!downFlag && !started) J.toast('Hold the button down to fire the engines!'); downFlag = false; });
      ['pointerup','pointerleave','pointercancel'].forEach(function(ev){ btn.addEventListener(ev, release); });
      btn.addEventListener('keydown', function(e){ if((e.key === ' ' || e.key === 'Enter') && !e.repeat){ e.preventDefault(); press(); } });
      btn.addEventListener('keyup', function(e){ if(e.key === ' ' || e.key === 'Enter') release(); });
      function launch(){
        started = true; holding = false; cancelAnimationFrame(raf);
        if(J.G){ J.G.trained = true; J.save(); }
        J.sfx.alarm && J.sfx.alarm();
        var n = 3;
        function step(){
          if(n > 0){ cnt.textContent = n; cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop'); J.sfx.tap(); n--; later(step, 600); }
          else { cnt.textContent = 'GO!'; cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop'); J.sfx.good();
            rk.classList.add('ignite');
            later(function(){ cnt.textContent = ''; rk.classList.add('lift'); }, 900);
            later(function(){ rk.classList.add('space'); }, 3700);
            later(function(){ J.go('landing'); }, 5800); }
        }
        step();
      }
    });
    J.coachFor.rocket = ['', null];
  })();


  /* ---------- PRE-FLIGHT: dress the astronaut before blast off ---------- */
  var PF_STYLE =
    '#pf{position:relative;min-height:100vh;color:#fff;font-family:Outfit,system-ui,sans-serif}'+
    '#pf .pf-wrap{position:relative;z-index:2;max-width:56rem;margin:0 auto;padding:1rem 1rem 5rem}'+
    '#pf .pf-top{display:flex;align-items:center;justify-content:space-between;padding:.2rem 0 .6rem}'+
    '#pf .pf-title{font-size:2rem;font-weight:900;text-shadow:0 0 18px rgba(0,229,255,.45)}'+
    '#pf .pf-sub{font-weight:700;color:#d8def5;margin:0 0 .8rem;font-size:1.1rem}'+
    '#pf #mg{background:rgba(14,16,42,.8);border:3px solid rgba(0,229,255,.55);border-radius:1.8rem;padding:.8rem;box-shadow:0 0 34px rgba(0,229,255,.25);color:#fff}'+
    '#pf .pf-go{margin-top:1rem;border:0;border-radius:9999px;padding:1.1rem 2.4rem;font-weight:900;font-size:1.25rem;text-transform:uppercase;color:#0b0d1b;background:#00e5ff;box-shadow:0 6px 0 #009bb0;cursor:pointer;font-family:inherit}'+
    '@media (max-width:640px){#pf .pf-title{font-size:1.4rem}}';
  J.customScreen('preflight', {html:'<div id="pf"><div class="pf-wrap"><div class="pf-top"><div class="pf-title">Get ready for blast off! 🧑‍🚀</div><button class="sp-menu" id="pfBack" type="button">Menu</button></div>'+
    '<p class="pf-sub">Check your gear. Pick the right piece for each part of the space suit.</p><div id="mg"></div></div></div>', style:PF_STYLE, bodyClass:'', title:'Pre-flight check'}, function(root){
    spaceBg(root, false);
    root.querySelector('#pfBack').onclick = function(){ J.sfx.tap(); J.go('menu'); };
    var host = root.querySelector('#mg');
    J.mini.dressUp(host, {set:'journey', title:'🧑‍🚀 Dress for the Moon: choose the right gear'}).then(function(){
      host.innerHTML = '<div style="text-align:center;padding:1.4rem .6rem"><div style="font-size:3.4rem">✅🚀</div><h2 style="font-size:1.9rem;font-weight:900;margin:.3rem 0">All set! You are ready to fly.</h2>'+
        '<button type="button" class="pf-go" id="pfGo">Go to the rocket ›</button></div>';
      J.sfx.good();
      var g = host.querySelector('#pfGo'); g.onclick = function(){ J.sfx.tap(); J.go('rocket'); };
      J.coachSet('Press <b>Go to the rocket</b>.', null);
    });
    J.coachSet('Tap the gear that fits the astronaut, then press the check button.', null);
  });
  J.coachFor.preflight = ['Pick the right gear for each part of the suit.', null];

  /* ---------- 3. LANDING: one picture, three things to tap, one button ---------- */
  var LANDING_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOTTiCo322rFPsFv1MFFcGaNI_-s4D6jOURLOGrGUKYN0bYORGeVpKvdJ2IoLMYjwYZsX1zsHapIcLfM3mmodPTiw34KJH7uvbJQfuMtXS7gFELKQN65zOkKogdyl0avQpgQv8oITy1hOSWvibBWzXmK6KdIMwerQGBEgdE6GvCaW0PUnTkf0fH0934mLYgFIWKR4y4BxSCnKoclDLmfQMIovO0-rBJYZZCUJGw6b5';
  var LANDING_STYLE =
    '#ld{position:relative;min-height:100vh;color:#fff;font-family:Outfit,system-ui,sans-serif}'+
    '#ld .ld-wrap{position:relative;z-index:2;max-width:64rem;margin:0 auto;padding:1rem 1rem 7rem}'+
    '#ld .ld-top{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.2rem 0 .8rem}'+
    '#ld .ld-title{font-size:2.2rem;font-weight:900;text-shadow:0 0 18px rgba(0,229,255,.45)}'+
    '#ld .ld-pic{position:relative;border-radius:1.8rem;overflow:hidden;border:3px solid rgba(0,229,255,.6);box-shadow:0 0 40px rgba(0,229,255,.3),0 20px 60px rgba(0,0,0,.5);background:linear-gradient(135deg,#1a1c55,#3a2a6a)}'+
    '#ld .ld-pic img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}'+
    '#ld .ld-pin{position:absolute;width:4.4rem;height:4.4rem;margin:-2.2rem 0 0 -2.2rem;border-radius:50%;border:3px solid #fff;background:rgba(8,12,40,.55);backdrop-filter:blur(3px);font-size:2.2rem;display:grid;place-items:center;cursor:pointer;animation:ldring 1.8s ease-out infinite;font-family:inherit}'+
    '#ld .ld-pin:hover{background:rgba(0,229,255,.35)}'+
    '@keyframes ldring{0%{box-shadow:0 0 0 0 rgba(255,255,255,.7)}100%{box-shadow:0 0 0 22px rgba(255,255,255,0)}}'+
    '#ld .ld-tap{position:absolute;left:0;right:0;bottom:.8rem;text-align:center;font-weight:800;text-shadow:0 2px 8px #000;font-size:1.05rem}'+
    '#ld .ld-go{position:fixed;z-index:5;left:50%;transform:translateX(-50%);bottom:1.4rem;border:0;border-radius:9999px;padding:1.1rem 2.6rem;font-weight:900;font-size:1.3rem;letter-spacing:.03em;text-transform:uppercase;color:#0b0d1b;background:#00e5ff;box-shadow:0 6px 0 #009bb0,0 0 30px rgba(0,229,255,.5);cursor:pointer;font-family:inherit;animation:ldpulse 1.5s ease-in-out infinite;white-space:nowrap}'+
    '#ld .ld-go:active{transform:translateX(-50%) translateY(4px);box-shadow:0 2px 0 #009bb0}'+
    '@keyframes ldpulse{50%{box-shadow:0 6px 0 #009bb0,0 0 40px 10px rgba(0,229,255,.55)}}'+
    '@media (max-width:640px){#ld .ld-title{font-size:1.5rem}#ld .ld-pin{width:3.4rem;height:3.4rem;margin:-1.7rem 0 0 -1.7rem;font-size:1.7rem}#ld .ld-go{padding:1rem 1.6rem;font-size:1.05rem}}'+
    '@media (prefers-reduced-motion:reduce){#ld .ld-pin,#ld .ld-go{animation:none}}';
  var LD_HTML = '<div id="ld"><div class="ld-wrap"><div class="ld-top"><div class="ld-title">You landed on the Moon! 🌙</div><button class="sp-menu" id="ldBack" type="button">Back</button></div>'+
    '<div class="ld-pic"><img alt="The Moon base seen from the lander" src="'+LANDING_IMG+'">'+
    '<button type="button" class="ld-pin" data-k="lab" style="left:26%;top:40%" aria-label="Science lab">🔬</button>'+
    '<button type="button" class="ld-pin" data-k="sun" style="left:65%;top:30%" aria-label="Solar farm">☀️</button>'+
    '<button type="button" class="ld-pin" data-k="plant" style="left:74%;top:76%" aria-label="Greenhouse">🌱</button>'+
    '<div class="ld-tap">Tap the pictures 👆</div></div></div>'+
    '<button type="button" class="ld-go" id="ldGo">Enter the base ›</button></div>';
  var PINS = {lab:['Science lab', 'Scientists study Moon rocks here.', '🔬'], sun:['Solar farm', 'Big panels turn sunlight into power.', '☀️'], plant:['Greenhouse', 'Plants grow here for food and fresh air.', '🌱']};
  J.customScreen('landing', {html:LD_HTML, style:LANDING_STYLE, bodyClass:'', title:'Moon landing'}, function(root){
    spaceBg(root, false);
    root.querySelector('#ldBack').onclick = function(){ J.sfx.tap(); J.go('menu'); };
    root.querySelector('#ldGo').onclick = function(){ J.sfx.tap(); J.go('hub'); };
    Array.prototype.forEach.call(root.querySelectorAll('.ld-pin'), function(b){
      b.onclick = function(){ J.sfx.tap(); var f = PINS[b.getAttribute('data-k')]; info(f[0], f[1], f[2]); J.say(f[0] + '. ' + f[1]); };
    });
    var t = root.querySelector('.ld-title'); t.appendChild(speaker('You landed on the Moon! Tap the pictures to learn, then enter the base.', 'ml'));
    var img = root.querySelector('.ld-pic img'); img.onerror = function(){ img.style.display = 'none'; root.querySelector('.ld-pic').style.minHeight = '55vh'; };
  });
  J.coachFor.landing = ['', null];

  /* ---------- 4. BASE MAP (hub): remove the side panel, tap the pictures ---------- */
  var BUILD = [
    [/Research Lab/i, '🔬', 'Research lab', 'Scientists study Moon rocks here.'],
    [/Base HQ/i, '🏠', 'Base HQ', 'The control room. It talks to Earth by radio.'],
    [/Solar Panels/i, '☀️', 'Solar panels', 'They turn sunlight into power for the base.'],
    [/Quarters/i, '🛏️', 'Quarters', 'Where the astronauts sleep.'],
    [/Greenhouse/i, '🌱', 'Greenhouse', 'Plants grow here for food and fresh air.'],
    [/Airlock Cave/i, '🚪', 'Airlock', 'The door between the base and the Moon outside.'],
    [/Rover-01/i, '🤖', 'Rover-01', 'Your robot helper. It drives on the Moon.']
  ];
  wrapScreen('hub', function(root){
    // right-hand "Base Info" column and the row of numbers under the picture are not needed
    var secs = root.querySelectorAll('main section[class*="col-span-3"]');
    var right = secs.length > 1 ? secs[secs.length - 1] : null;      // the last narrow column is the side panel
    if(right){ right.style.display = 'none'; }
    var o2 = null;
    Array.prototype.forEach.call(root.querySelectorAll('main *'), function(e){ if(!o2 && !e.children.length && /O2 GENERATOR/i.test((e.textContent || '').trim())) o2 = e; });
    if(o2){ var row = o2.closest('div.grid'); if(row) row.style.display = 'none'; }
    // the map picture grows to fill the space
    var centre = root.querySelector('section.xl\\:col-span-6, section[class*="col-span-6"]');
    if(centre && right){ centre.style.gridColumn = 'span 9 / span 9'; }
    // tap a building or the rover: a small picture card, no side panel
    BUILD.forEach(function(b){
      Array.prototype.forEach.call(root.querySelectorAll('main *'), function(e){
        if(e.children.length || !b[0].test((e.textContent || '').trim()) || (e.textContent || '').trim().length > 16) return;
        var pin = e.closest('button, [onclick], .group, div.absolute') || e.parentElement;
        if(!pin || pin.__bld || pin.closest('aside') ) return; pin.__bld = true;
        pin.style.cursor = 'pointer';
        pin.addEventListener('click', function(){ info(b[2], b[3], b[1]); J.say(b[2] + '. ' + b[3]); });
      });
    });
    // hide the "tap a building" hint's long wording? keep: it is short
  });
})();
