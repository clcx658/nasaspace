/* Core helpers: state, sound, HUD, meters, scenes. Shared through window.JAM */
(function(){
  'use strict';
  var J = window.JAM = {};
  var $ = J.$ = function(id){ return document.getElementById(id); };

  J.RES = {
    o:{name:'Oxygen', icon:'💨'},
    p:{name:'Power', icon:'⚡'},
    f:{name:'Food', icon:'🍱'},
    w:{name:'Water', icon:'💧'}
  };
  J.S = null; // game state, created by story.js

  /* ---------- Utilities ---------- */
  J.clamp = function(v){ return Math.max(0, Math.min(100, v)); };
  J.rand = function(a, b){ return a + Math.floor(Math.random()*(b-a+1)); };
  J.pick = function(arr){ return arr[Math.floor(Math.random()*arr.length)]; };
  J.shuffle = function(a){
    a = a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  };
  J.store = function(k, v){
    try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; }
  };
  var timers = [];
  J.T = function(fn, ms){ var id = setTimeout(fn, ms); timers.push(id); return id; };
  J.clearT = function(){ timers.forEach(clearTimeout); timers = []; };

  /* ---------- Sound ---------- */
  var ac = null, muted = J.store('jamt_mute') === '1';
  function beep(f, d, type, vol, delay){
    if(muted) return;
    try{
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + (delay||0);
      o.type = type||'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(vol||.08, t0); g.gain.exponentialRampToValueAtTime(.0001, t0+d);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0+d);
    }catch(e){}
  }
  J.sfx = {
    tap:function(){ beep(700,.08,'sine',.09); },
    miss:function(){ beep(160,.2,'sawtooth',.05); },
    alarm:function(){ beep(520,.15,'square',.04); beep(420,.15,'square',.04,.18); },
    good:function(){ beep(523,.12,'triangle',.1); beep(659,.12,'triangle',.1,.12); beep(784,.2,'triangle',.1,.24); },
    bad:function(){ beep(300,.18,'sawtooth',.06); beep(200,.3,'sawtooth',.06,.18); },
    win:function(){ [523,659,784,1047].forEach(function(f,i){ beep(f,.18,'triangle',.1,i*.13); }); }
  };
  function drawSound(){ $('sndBtn').textContent = muted ? '🔇' : '🔊'; }
  $('sndBtn').addEventListener('click', function(){ muted = !muted; J.store('jamt_mute', muted?'1':'0'); drawSound(); if(!muted) J.sfx.tap(); });
  drawSound();

  /* ---------- Stars ---------- */
  (function(){
    var h = '';
    for(var i=0;i<60;i++){
      var sz = (Math.random()*2.5+1).toFixed(1);
      h += '<i style="left:'+(Math.random()*100).toFixed(1)+'%;top:'+(Math.random()*100).toFixed(1)+'%;width:'+sz+'px;height:'+sz+'px;animation-delay:'+(Math.random()*3).toFixed(1)+'s"></i>';
    }
    $('stars').innerHTML = h;
  })();

  /* ---------- Screens ---------- */
  J.show = function(id){
    ['welcome','game','results'].forEach(function(s){ $(s).hidden = (s!==id); });
    $('nasa').hidden = (id==='game');
    window.scrollTo(0,0);
  };
  J.stage = function(html){
    J.clearT();
    $('stage').innerHTML = html;
    window.scrollTo(0,0);
  };
  J.append = function(html){ $('stage').insertAdjacentHTML('beforeend', html); };
  J.say = function(text){
    return '<div class="say"><svg viewBox="0 0 200 240" aria-hidden="true"><use href="#astro"/></svg><div class="bubble">'+text+'</div></div>';
  };

  /* Wait for a button press. Resolves when pressed. */
  J.cta = function(label, cls){
    return new Promise(function(resolve){
      var d = document.createElement('div'); d.className = 'cta';
      d.innerHTML = '<button class="btn '+(cls||'')+'">'+label+'</button>';
      $('stage').appendChild(d);
      var b = d.firstChild;
      b.onclick = function(){ J.sfx.tap(); d.remove(); resolve(); };
      b.focus({preventScroll:true});
      b.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  };

  /* Show option cards. options: [{ico,label,desc,fx}] -> resolves with chosen index */
  J.choose = function(options, cls){
    return new Promise(function(resolve){
      var wrap = document.createElement('div');
      wrap.className = 'choices ' + (cls || (options.length===3 ? 'three' : ''));
      options.forEach(function(o,i){
        var b = document.createElement('button'); b.className = 'choice';
        b.innerHTML = '<span class="opt-ico" aria-hidden="true">'+(o.ico||'')+'</span><span class="opt-label">'+o.label+'</span>'+
          (o.desc ? '<span class="opt-desc">'+o.desc+'</span>' : '')+
          (o.fx ? '<span class="chips">'+J.chips(o.fx)+'</span>' : '');
        b.onclick = function(){
          J.sfx.tap();
          var all = wrap.querySelectorAll('.choice');
          for(var k=0;k<all.length;k++) all[k].disabled = true;
          b.classList.add('picked');
          setTimeout(function(){ resolve(i); }, 350);
        };
        wrap.appendChild(b);
      });
      $('stage').appendChild(wrap);
      wrap.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
  };

  /* ---------- Meters / HUD ---------- */
  var NAMES = {o:'Oxygen', p:'Power', f:'Food', w:'Water', r:'Research'};
  J.chips = function(fx){
    var h = '';
    ['o','p','f','w','r'].forEach(function(k){
      if(fx[k]) h += '<span class="chip '+(fx[k]>0?'up':'down')+'">'+(fx[k]>0?'+':'')+fx[k]+' '+NAMES[k]+'</span>';
    });
    return h;
  };
  function stateOf(v){ return v < 25 ? 'low' : v < 45 ? 'warn' : ''; }
  function flagOf(v){ return v < 25 ? '⚠ LOW' : v < 45 ? '👀 WATCH' : ''; }
  J.stateOf = stateOf; J.flagOf = flagOf;
  var shown = {o:0,p:0,f:0,w:0};

  J.buildMeters = function(){
    var h = '';
    ['o','p','f','w'].forEach(function(k){
      var v = J.S.res[k]; shown[k] = v;
      h += '<div class="meter" data-k="'+k+'" id="m-'+k+'"><div class="m-top"><span aria-hidden="true">'+J.RES[k].icon+'</span><span class="m-name">'+J.RES[k].name+'</span>'+
        '<span class="m-val"><b>'+v+'</b><small>%</small></span></div>'+
        '<div class="bar" role="progressbar" aria-label="'+J.RES[k].name+' (simulated)" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+v+'"><div class="fill" style="width:'+v+'%"></div></div>'+
        '<div class="m-flag"></div><span class="delta"></span></div>';
    });
    $('meters').innerHTML = h;
    ['o','p','f','w'].forEach(function(k){ setMeter(k, J.S.res[k]); });
  };
  function setMeter(k, v, delta, intended){
    var m = $('m-'+k); if(!m) return;
    m.querySelector('.fill').style.width = v+'%';
    m.querySelector('.bar').setAttribute('aria-valuenow', v);
    m.classList.remove('warn','low'); var st = stateOf(v); if(st) m.classList.add(st);
    m.querySelector('.m-flag').textContent = flagOf(v);
    var b = m.querySelector('.m-val b'), from = shown[k], t0 = null;
    shown[k] = v;
    function tick(t){
      if(t0===null) t0 = t;
      var p = Math.min(1,(t-t0)/600);
      b.textContent = Math.round(from + (v-from)*p);
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    if(intended){
      var d = m.querySelector('.delta');
      d.textContent = delta===0 ? 'MAX' : (delta>0?'+':'')+delta;
      d.className = 'delta show ' + (intended>0?'up':'down');
      m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump');
    }
  }
  /* Apply effects to state + meters. Returns the real (clamped) change. */
  J.apply = function(fx){
    var actual = {};
    ['o','p','f','w'].forEach(function(k){
      if(fx[k]){
        var before = J.S.res[k]; J.S.res[k] = J.clamp(before + fx[k]);
        actual[k] = J.S.res[k] - before;
        setMeter(k, J.S.res[k], actual[k], fx[k]);
      }
    });
    if(fx.r) J.S.research = Math.max(0, J.S.research + fx.r);
    return actual;
  };
  J.lowWarning = function(){
    var low = ['o','p','f','w'].filter(function(k){ return J.S.res[k] < 45; })
      .sort(function(a,b){ return J.S.res[a]-J.S.res[b]; });
    if(!low.length) return '';
    var k = low[0];
    return '<div class="warnline">'+(J.S.res[k]<25?'🚨 ':'👀 ')+J.RES[k].name+' is at '+J.S.res[k]+'%. Be careful with it!</div>';
  };

  /* Configure the top bar. o: {title, dots:[count,index], meters:bool, clock:'08:00'} */
  J.hud = function(o){
    $('hudTitle').textContent = o.title || '';
    var h = '';
    if(o.dots) for(var i=0;i<o.dots[0];i++) h += '<i class="'+(i<o.dots[1]?'done':i===o.dots[1]?'now':'')+'"></i>';
    $('dots').innerHTML = h;
    $('clock').hidden = !o.clock;
    if(o.clock) $('clock').textContent = '🕗 ' + o.clock;
    $('meters').hidden = !o.meters;
    $('simNote').hidden = !o.meters;
  };

  /* A result card: tag + story + effect chips + fact. Resolves after the button. */
  J.result = function(o){
    var fx = o.fx ? J.apply(o.fx) : {};
    var chips = o.fx ? J.chips(o.fx) : '';
    var html = '<div class="card">'+
      (o.tag ? '<span class="tag '+(o.tagClass||'info')+'">'+o.tag+'</span>' : '')+
      '<p class="story">'+o.story+'</p>'+
      (chips ? '<div class="chips">'+chips+'</div>' : '')+
      (o.extra || '')+
      (o.warn===false ? '' : J.lowWarning())+
      (o.fact ? '<div class="fact"><span class="fi" aria-hidden="true">🔭</span><div><b>SPACE FACT</b>'+o.fact+'</div></div>' : '')+
      '</div>';
    J.append(html);
    return J.cta(o.btn || 'CONTINUE ➜');
  };

  /* Quick one-line message + button, then go on (used for hints). */
  J.note = function(html, btn){
    J.stage(J.say(html));
    return J.cta(btn || 'OK ➜');
  };

  /* Sound toggle + best score */
  J.confetti = function(){
    var e = ['🎉','⭐','✨','🚀','🌟'];
    for(var i=0;i<28;i++){
      var s = document.createElement('span'); s.className = 'confetti'; s.textContent = e[i%e.length];
      s.style.left = Math.random()*100+'vw'; s.style.animationDelay = (Math.random()*.8)+'s';
      document.body.appendChild(s);
      (function(s){ setTimeout(function(){ s.remove(); }, 3600); })(s);
    }
  };
})();
