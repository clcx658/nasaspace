/* Engine: router, saved game state, screen mounting (Stitch markup as-is), live header sync, modals, toasts. */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$;
  var SCREENS = window.STITCH_SCREENS || {};
  var SAVE_KEY = 'jamt_stitch_save_v1';
  var app = $('app');

  /* ---------------- Resources / state ---------------- */
  J.RES = { o:{name:'Oxygen'}, p:{name:'Power'}, f:{name:'Food'}, w:{name:'Water'} };
  var CONDITIONS = [
    {id:'normal', t:'Everything looks normal today.', fx:{}},
    {id:'dusty', t:'The solar panels look a bit dusty, so power starts lower.', fx:{p:-10}},
    {id:'oxy', t:'The oxygen tanks are slightly low, so oxygen starts lower.', fx:{o:-8}},
    {id:'cold', t:'The heaters are working hard, so power and water start lower.', fx:{p:-6, w:-4}}
  ];
  J.G = null;

  J.newGame = function(){
    var q = new URLSearchParams(location.search), forced = q.get('scenario');
    var cond = J.pick(CONDITIONS);
    var G = {
      v:1, res:{o:100,p:100,f:100,w:100}, cond:cond.id, condText:cond.t,
      scenario:(forced && /^[ABC]$/.test(forced)) ? forced : J.pick(['A','B','C']),
      abn:J.rand(0,4), time:'07:30', task:0,           // next task to play (0..6)
      mini:0, safety:0, research:0, eventPts:0, log:[], loc:null, ice:false,
      emergency:false, weatherB:false, weatherAC:false, accepted:false, trained:false, screen:'menu', finished:false
    };
    ['o','p','f','w'].forEach(function(k){ G.res[k] = J.clamp(G.res[k] + (cond.fx[k]||0)); });
    J.G = G; J.save();
    return G;
  };
  J.save = function(){ if(J.G) J.store(SAVE_KEY, JSON.stringify(J.G)); };
  J.loadSave = function(){
    try{ var s = JSON.parse(J.store(SAVE_KEY) || 'null'); if(s && s.v === 1 && !s.finished) return s; }catch(e){}
    return null;
  };
  J.clearSave = function(){ J.store(SAVE_KEY, null); };

  /* Apply resource effects (clamped 0-100). fx may include r (research). Returns the real change. */
  J.apply = function(fx){
    var G = J.G, actual = {};
    if(!G) return actual;
    ['o','p','f','w'].forEach(function(k){
      if(fx[k]){ var b = G.res[k]; G.res[k] = J.clamp(b + fx[k]); actual[k] = G.res[k] - b; }
    });
    if(fx.r) G.research = Math.max(0, G.research + fx.r);
    J.refreshHeader(true); J.save();
    return actual;
  };
  var NAMES = {o:'Oxygen', p:'Power', f:'Food', w:'Water', r:'Research'};
  J.chips = function(fx){
    var h = '';
    ['o','p','f','w','r'].forEach(function(k){
      if(fx[k]) h += '<span class="gchip '+(fx[k]>0?'up':'down')+'">'+(fx[k]>0?'+':'')+fx[k]+' '+NAMES[k]+'</span>';
    });
    return h;
  };
  J.lowWarning = function(){
    if(!J.G) return '';
    var low = ['o','p','f','w'].filter(function(k){ return J.G.res[k] < 45; }).sort(function(a,b){ return J.G.res[a]-J.G.res[b]; });
    if(!low.length) return '';
    var k = low[0];
    return '<div class="gwarn">'+(J.G.res[k]<25?'🚨 ':'👀 ')+NAMES[k]+' is at '+J.G.res[k]+'%. Be careful with it!</div>';
  };

  /* ---------------- Toast + modal ---------------- */
  J.toast = function(msg, ms){
    var t = document.createElement('div'); t.className = 'gtoast'; t.textContent = String(msg).replace(/\s+/g,' ');
    $('toast-root').appendChild(t);
    setTimeout(function(){ t.remove(); }, ms || 3200);
  };
  // The Stitch demo screens use alert() for placeholder feedback ("+100 Energy Points", "Task complete!").
  // The experience shows its own feedback and evaluation, so these placeholders are silenced (kept in J.lastAlert for debugging).
  window.alert = function(msg){ J.lastAlert = String(msg); };
  window.confirm = function(){ return false; };

  J.openModal = function(o){
    o = o || {};
    var scrim = document.createElement('div'); scrim.className = 'gmodal-scrim';
    scrim.innerHTML = '<div class="gmodal '+(o.cls||'')+'" role="dialog" aria-modal="true">'+(o.html||'')+'</div>';
    $('modal-root').appendChild(scrim);
    $('modal-root').style.pointerEvents = 'auto';
    var h = {
      scrim:scrim, box:scrim.firstChild,
      close:function(){ scrim.remove(); if(!$('modal-root').children.length) $('modal-root').style.pointerEvents = 'none'; }
    };
    scrim.scrollTop = 0;
    return h;
  };
  /* Simple dialog. actions: [{label, cls, value}] -> resolves with the chosen value. */
  J.modal = function(o){
    return new Promise(function(resolve){
      var acts = (o.actions || [{label:'OK', cls:'cyan', value:true}]).map(function(a,i){
        return '<button class="gbtn '+(a.cls||'cyan')+'" data-i="'+i+'">'+a.label+'</button>';
      }).join('');
      var h = J.openModal({cls:o.cls, html:
        (o.kicker?'<div class="gkicker">'+o.kicker+'</div>':'')+(o.title?'<h2>'+o.title+'</h2>':'')+(o.html||'')+
        '<div class="gactions">'+acts+'</div>'});
      var bs = h.box.querySelectorAll('.gactions button');
      for(var i=0;i<bs.length;i++) bs[i].onclick = (function(a){ return function(){ J.sfx.tap(); h.close(); resolve(a.value); }; })((o.actions||[{value:true}])[+bs[i].getAttribute('data-i')]);
      if(bs[0]) bs[0].focus({preventScroll:true});
    });
  };
  /* Option cards. options: [{t, d, fx}] -> resolves with the index. */
  J.choose = function(o){
    return new Promise(function(resolve){
      var h = J.openModal({cls:o.cls, html:
        (o.kicker?'<div class="gkicker">'+o.kicker+'</div>':'')+(o.title?'<h2>'+o.title+'</h2>':'')+(o.text?'<p>'+o.text+'</p>':'')+
        '<div class="gopts '+(o.options.length===3?'three':'')+'">'+o.options.map(function(x,i){
          return '<button class="gopt" data-i="'+i+'"><div class="t">'+(x.ico?x.ico+' ':'')+x.t+'</div>'+(x.d?'<div class="d">'+x.d+'</div>':'')+(x.fx?'<div>'+J.chips(x.fx)+'</div>':'')+'</button>';
        }).join('')+'</div>'});
      var bs = h.box.querySelectorAll('.gopt');
      for(var i=0;i<bs.length;i++) bs[i].onclick = (function(i){ return function(){ J.sfx.tap(); h.close(); resolve(i); }; })(i);
    });
  };

  /* ---------------- Header sync ---------------- */
  var hdr = [];
  function patchHeader(root){
    hdr = [];
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, nodes = [];
    while((n = tw.nextNode())) nodes.push(n);
    nodes.forEach(function(n){
      var t = n.nodeValue;
      if(/O2:\s*\d+%/.test(t)) hdr.push({n:n,k:'o'});
      else if(/Power:\s*\d+%/.test(t)) hdr.push({n:n,k:'p'});
      else if(/Water:\s*\d+%/.test(t)){
        hdr.push({n:n,k:'w'});
        // add a Food chip next to Water (the story has four resources): clone the smallest wrapper that holds only the Water readout
        var chip = n.parentElement;
        while(chip && chip.parentElement && !/O2:|Power:|(?:Sol|Day)\s*\d/.test(chip.parentElement.textContent) && chip.parentElement.tagName !== 'HEADER') chip = chip.parentElement;
        if(chip && chip.parentElement && chip.tagName !== 'HEADER' && !chip.parentElement.querySelector('[data-food]')){
          var c = chip.cloneNode(true); c.setAttribute('data-food', '1');
          var tw2 = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, null), m;
          while((m = tw2.nextNode())){
            if(/Water:/.test(m.nodeValue)){ m.nodeValue = m.nodeValue.replace(/Water:\s*\d+%/, 'Food: 100%'); hdr.push({n:m,k:'f'}); }
            else if(/^\s*(water_drop|water_voc|humidity_percentage)\s*$/.test(m.nodeValue)) m.nodeValue = 'restaurant';
          }
          chip.parentElement.insertBefore(c, chip.nextSibling);
        }
      }
      else if(/(?:Sol|Day)\s*\d+\s*[•·]\s*\d{1,2}:\d{2}/.test(t)) hdr.push({n:n,k:'t'});
    });
    J.refreshHeader(false);
  }
  J.refreshHeader = function(flash){
    var r = J.G ? J.G.res : {o:100,p:100,f:100,w:100}, time = J.G ? J.G.time : '07:30';
    hdr.forEach(function(h){
      if(!document.body.contains(h.n)) return;
      var v = h.n.nodeValue;
      if(h.k==='o') v = v.replace(/O2:\s*\d+%/, 'O2: '+r.o+'%');
      if(h.k==='p') v = v.replace(/Power:\s*\d+%/, 'Power: '+r.p+'%');
      if(h.k==='w') v = v.replace(/Water:\s*\d+%/, 'Water: '+r.w+'%');
      if(h.k==='f') v = v.replace(/Food:\s*\d+%/, 'Food: '+r.f+'%');
      if(h.k==='t') v = v.replace(/((?:Sol|Day)\s*\d+\s*[•·]\s*)\d{1,2}:\d{2}/, '$1'+time);
      h.n.nodeValue = v;
      if(flash && h.k!=='t' && h.n.parentElement){
        var el = h.n.parentElement; el.style.transition = 'transform .25s'; el.style.transform = 'scale(1.15)';
        setTimeout(function(){ el.style.transform = ''; }, 260);
      }
    });
  };

  /* ---------------- Mount ---------------- */
  var PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="g" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#2a3b9a"/><stop offset="1" stop-color="#0b0d1b"/></radialGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="300" cy="80" r="34" fill="#c8d3f5"/><ellipse cx="200" cy="330" rx="260" ry="90" fill="#8a8aa8"/></svg>');
  function fixImages(root){
    var map = window.STITCH_IMAGE_MAP || {};
    Array.prototype.forEach.call(root.querySelectorAll('img'), function(img){
      var s = img.getAttribute('src') || '';
      if(map[s]) img.src = map[s];
      img.addEventListener('error', function(){ if(img.src !== PLACEHOLDER) img.src = PLACEHOLDER; }, {once:true});
    });
    Array.prototype.forEach.call(root.querySelectorAll('[style*="googleusercontent"]'), function(el){
      var st = el.getAttribute('style') || '';
      Object.keys(map).forEach(function(u){ if(st.indexOf(u) >= 0) st = st.split(u).join(map[u]); });
      el.setAttribute('style', st);   // remote art falls back to the CSS gradient colours if it cannot load
    });
  }
  function stripXp(root){
    Array.prototype.forEach.call(root.querySelectorAll('*'), function(el){
      if(el.closest('script,style') || el.querySelector('button,input,a')) return;
      var t = el.textContent || '';
      if(t.length < 60 && el.children.length <= 6 && /(^|[\s+])\d*\s*(Science |Geology |Energy |Resource Management )?(XP|Points)\b/.test(t) && /\bXP\b|Energy Points/.test(t)) el.style.display = 'none';
    });
  }

  /* Wording: this is an interactive learning experience, not a game. Patch the Stitch text that says otherwise. */
  var REWORD = [
    [/SIMULATED GAMEPLAY VALUES/g, 'SIMULATED MISSION VALUES'],
    [/Simulated Gameplay Values/g, 'Simulated Mission Values'],
    [/INTERACTIVE MINIGAME/g, 'INTERACTIVE ACTIVITY'],
    [/IMPORTANT GAME RULE:/g, 'IMPORTANT SAFETY RULE:'],
    [/play an orbital space game/g, 'listen to some music'],
    [/The game will guide you to retry without penalty!/g, 'Mission Control will help you choose again, with no penalty!'],
    [/SIMULATED EDUCATIONAL GAME CERTIFICATE/g, 'SIMULATED EDUCATIONAL CERTIFICATE'],
    [/Simulated educational game certificate/g, 'Simulated educational certificate'],
    [/Mission Mini-Game:/g, 'Mission Activity:'],
    [/HOW TO PLAY/g, 'HOW IT WORKS']
  ];
  function reword(root){
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while((n = tw.nextNode())) list.push(n);
    list.forEach(function(n){
      var v = n.nodeValue, o = v;
      for(var i=0;i<REWORD.length;i++) v = v.replace(REWORD[i][0], REWORD[i][1]);
      if(v !== o) n.nodeValue = v;
    });
  }
  J.reword = reword;


  /* ---------------- plain language (ages 7-12) ---------------- */
  var wordRes = null, simpleObs = null, simplePending = false;
  function nrm(t){ return String(t).replace(/\s+/g, ' ').trim(); }
  function lookupSimple(t){
    var n = nrm(t), S = J.SIMPLE || {};
    if(Object.prototype.hasOwnProperty.call(S, n)) return S[n];
    var m = /^(["“'‘]+)([\s\S]*?)(["”'’]+)$/.exec(n);
    if(m && Object.prototype.hasOwnProperty.call(S, m[2])) return m[1] + S[m[2]] + m[3];
    return null;
  }
  function inIcon(n){ return n.parentElement && n.parentElement.closest('.material-symbols-outlined,script,style,svg'); }
  function textNodesOf(el){
    var out = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while((n = tw.nextNode())) if(!inIcon(n)) out.push(n);
    return out;
  }
  function applyOne(el, original, val){
    var b = el.closest && el.closest('button,a');
    if(b) b.__orig = (b.__orig ? b.__orig + ' ' : '') + original;
    el.__orig = original;
    if(val === '__HIDE__'){ el.style.display = 'none'; return; }
    var nodes = textNodesOf(el); if(!nodes.length) return;
    var direct = nodes.filter(function(n){ return n.parentNode === el; });
    var first = direct[0] || nodes[0];
    first.nodeValue = val;
    nodes.forEach(function(n){ if(n !== first) n.nodeValue = ''; });
    el.__simple = true;
  }
  function simplifyWalk(el){
    if(!el || el.nodeType !== 1 || el.closest('script,style,svg') || el.classList.contains('material-symbols-outlined')) return;
    var kids = Array.prototype.filter.call(el.children, function(c){ return !c.classList.contains('material-symbols-outlined'); });
    var blockKid = kids.some(function(c){ var d = getComputedStyle(c).display; return d !== 'inline' && d !== 'none' && c.tagName !== 'BR'; });
    if(!blockKid){
      if(el.__simple) return;
      var t = nrm(textNodesOf(el).map(function(n){ return n.nodeValue; }).join(''));
      if(t){ var v = lookupSimple(t); if(v !== null) applyOne(el, t, v); }
    } else kids.forEach(simplifyWalk);
  }
  function caseLike(src, rep){
    if(src.length > 1 && src === src.toUpperCase()) return rep.toUpperCase();
    if(/^[A-Z]/.test(src) && /^[a-z]/.test(rep)) return rep.charAt(0).toUpperCase() + rep.slice(1);
    return rep;
  }
  function wordPass(root){
    if(!wordRes) wordRes = (J.WORDS || []).map(function(w){ return [new RegExp(w[0], w[2] === 'cs' ? 'g' : 'gi'), w[1], w[2] === 'cs']; });
    textNodesOf(root).forEach(function(n){
      var v = n.nodeValue, o = v;
      wordRes.forEach(function(w){ v = v.replace(w[0], function(m){ return w[2] ? w[1] : caseLike(m, w[1]); }); });
      if(v !== o) n.nodeValue = v;
    });
  }
  function runSimple(){
    if(simpleObs) simpleObs.disconnect();
    try{ simplifyWalk(app); wordPass(app); }catch(e){ console.warn('plain-language pass:', e.message); }
    if(simpleObs) simpleObs.observe(app, {childList:true, subtree:true, characterData:true});
  }
  function scheduleSimple(){
    if(simplePending) return; simplePending = true;
    requestAnimationFrame(function(){ simplePending = false; runSimple(); });
  }
  J.simplify = runSimple;
  simpleObs = new MutationObserver(scheduleSimple);

  J.screens = {};
  J.screen = function(name, n, bind){ J.screens[name] = {n:n, bind:bind}; };
  J.customScreen = function(name, def, bind){ J.screens[name] = {custom:def, bind:bind}; };
  J.bindText = function(root, re, fn, sel){
    var hit = 0;
    Array.prototype.forEach.call(root.querySelectorAll(sel || 'button, a'), function(el){
      var t = (el.textContent || '').replace(/\s+/g,' ').trim();
      if(re.test(t) || (el.__orig && re.test(el.__orig))){
        hit++;
        el.addEventListener('click', function(e){ e.preventDefault(); J.sfx.tap(); fn(el, e); });
      }
    });
    return hit;
  };
  J.setText = function(root, re, text){
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, c = 0;
    while((n = tw.nextNode())){ if(re.test(n.nodeValue)){ n.nodeValue = n.nodeValue.replace(re, text); c++; } }
    return c;
  };


  /* ---------------- "What to do now" helper ---------------- */
  var coachBox = null, glow = [], hand = null, handTimer = null, handEl = null, handDone = false;
  function clearGlow(){ glow.forEach(function(e){ e.classList.remove('guide-pulse'); }); glow = []; killHand(); }
  function killHand(){ if(handTimer){ clearInterval(handTimer); handTimer = null; } if(hand){ hand.style.display = 'none'; } handEl = null; }
  function findTarget(t){
    if(!t) return null;
    if(t.nodeType === 1) return t;
    if(typeof t === 'string') return document.querySelector('#app ' + t);
    var all = document.querySelectorAll('#app button, #app a, #app input');
    for(var i=0;i<all.length;i++){
      var el = all[i];
      if(el.offsetParent === null) continue;
      if(t.test((el.textContent || '').replace(/\s+/g, ' ').trim()) || (el.__orig && t.test(el.__orig)) || (el.id && t.test(el.id))) return el;
    }
    return null;
  }
  /* A bouncing hand that points at the thing to tap. If it is off screen the hand sits at the edge with an arrow. */
  function placeHand(){
    if(!hand || !handEl || !document.body.contains(handEl)){ killHand(); return; }
    var r = handEl.getBoundingClientRect(), vh = window.innerHeight, vw = window.innerWidth;
    var cb = coachBox && coachBox.style.display !== 'none' ? coachBox.getBoundingClientRect() : null;
    var topLimit = 70, botLimit = cb ? cb.top - 6 : vh - 90;
    var isInput = handEl.tagName === 'INPUT';
    var lab = isInput ? 'Type here!' : 'Tap here!';
    var icon, x = Math.min(Math.max(r.left + r.width/2, 60), vw - 60), y, cls = '';
    if(r.bottom < topLimit){ icon = '⬆️'; lab = 'Scroll up'; y = topLimit + 6; cls = 'edge'; }
    else if(r.top > botLimit){ icon = '⬇️'; lab = 'Scroll down'; y = botLimit - 54; cls = 'edge'; }
    else {
      // sit on the lower-right corner of the thing to tap, so it points at it without covering other text
      icon = '👆'; cls = 'in';
      x = r.width > 170 ? Math.min(r.right - 46, vw - 40) : x;
      y = Math.min(Math.max(r.bottom - 30, topLimit), botLimit - 46);
    }
    hand.className = cls; hand.style.display = 'flex';
    hand.style.left = x + 'px'; hand.style.top = y + 'px';
    hand.innerHTML = '<span class="hand-ico">'+icon+'</span><span class="hand-tag">'+lab+'</span>';
  }
  function showHand(el){
    if(!hand){ hand = document.createElement('div'); hand.id = 'coach-hand'; document.body.appendChild(hand);
      hand.addEventListener('click', function(){ if(handEl){ J.sfx.tap(); handEl.scrollIntoView({behavior:'smooth', block:'center'}); } }); }
    handEl = el; placeHand();
    if(handTimer) clearInterval(handTimer);
    handTimer = setInterval(placeHand, 250);
    window.addEventListener('scroll', placeHand, {passive:true});
    window.addEventListener('resize', placeHand);
    var gone = function(){ killHand(); el.classList.remove('guide-pulse'); el.removeEventListener('click', gone); el.removeEventListener('focus', gone); };
    el.addEventListener('click', gone); el.addEventListener('focus', gone);
    // if the thing to tap is hidden (below the fold or under the helper), gently bring it into view
    setTimeout(function(){
      if(handEl !== el || !document.body.contains(el)) return;
      var r = el.getBoundingClientRect(), cb = coachBox ? coachBox.getBoundingClientRect() : null;
      var hidden = r.bottom < 70 || r.top > window.innerHeight - 90 || (cb && r.bottom > cb.top - 70 && r.top < cb.bottom);
      if(hidden) el.scrollIntoView({behavior:'smooth', block:'center'});
    }, 900);
  }
  /* text: one short instruction. target: regex (button text), css selector or element to make glow. */
  J.coachSet = function(text, target, opts){
    opts = opts || {};
    clearGlow();
    if(!coachBox){
      coachBox = document.createElement('div'); coachBox.id = 'coach';
      document.body.appendChild(coachBox);
    }
    document.body.classList.toggle('has-coach', !!text);
    if(!text){ coachBox.style.display = 'none'; return; }
    var el = findTarget(target);
    coachBox.style.display = 'flex';
    coachBox.innerHTML = '<span class="coach-ico" aria-hidden="true">🧑‍🚀</span><div class="coach-text"><b>Commander Nova says</b><span>'+text+'</span></div>'+
      (el ? '<button class="coach-show" type="button">TAKE ME THERE</button>' : '')+'<button class="coach-x" type="button" aria-label="Hide tip">✕</button>';
    if(el){
      el.classList.add('guide-pulse'); glow.push(el);
      coachBox.querySelector('.coach-show').onclick = function(){ J.sfx.tap(); el.scrollIntoView({behavior:'smooth', block:'center'}); };
      if(opts.scroll) el.scrollIntoView({behavior:'smooth', block:'center'});
      showHand(el);
    }
    coachBox.querySelector('.coach-x').onclick = function(){ coachBox.style.display = 'none'; clearGlow(); document.body.classList.remove('has-coach'); };
  };

  var current = null;
  function runScreenScript(js){
    var orig = document.addEventListener, queued = [];
    document.addEventListener = function(t, fn, o){ if(t === 'DOMContentLoaded') queued.push(fn); else orig.call(document, t, fn, o); };
    try{ (0, eval)(js); }catch(e){ console.warn('Stitch screen script error:', e.message); }
    finally{ document.addEventListener = orig; }
    queued.forEach(function(fn){ try{ fn(); }catch(e){ console.warn('DOMContentLoaded handler error:', e.message); } });
  }
  function bindCommon(root, name){
    // sound / settings / pause buttons that every Stitch screen has
    Array.prototype.forEach.call(root.querySelectorAll('button'), function(b){
      var t = (b.textContent || '').replace(/\s+/g,' ').trim();
      if(/^(volume_up|volume_off)$/.test(t) || /^volume_(up|off)/.test(t) && t.length < 14){
        var ic = b.querySelector('.material-symbols-outlined'); if(ic) ic.textContent = J.muted ? 'volume_off' : 'volume_up';
        b.addEventListener('click', function(){ J.setMuted(!J.muted); document.querySelectorAll('button .material-symbols-outlined').forEach(function(s){ if(/^volume_(up|off)$/.test(s.textContent.trim())) s.textContent = J.muted ? 'volume_off' : 'volume_up'; }); if(!J.muted) J.sfx.tap(); });
      } else if(/^settings$/.test(t)){
        b.addEventListener('click', function(){ J.settings(); });
      } else if(/^(pause|pause_circle)?\s*pause(_circle)?$/i.test(t) || /^pause( |$)/i.test(t) && t.length < 16 || /^pause_circle Pause$/.test(t)){
        b.addEventListener('click', function(){ J.pauseMenu(); });
      }
    });
    // never let a placeholder link (href="#") jump the page or the router
    if(!root.__hashGuard){
      root.__hashGuard = true;
      root.addEventListener('click', function(e){
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if(a && !/^#\//.test(a.getAttribute('href') || '')) e.preventDefault();
      });
    }
    // bottom bar: three clear items (Mission, Base HQ, Quests); the others had nothing behind them, so they are hidden
    Array.prototype.forEach.call(root.querySelectorAll('nav a, nav button'), function(el){
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      function relabel(from, to){
        var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
        while((n = tw.nextNode())){ if(n.nodeValue.trim() === from) n.nodeValue = to; }
      }
      if(/Rover|Comms/.test(t)){ el.style.display = 'none'; return; }
      if(/Explore/.test(t)){ relabel('Explore', 'Mission'); el.addEventListener('click', function(e){ e.preventDefault(); J.sfx.tap(); J.G ? J.go(J.nextScreen ? J.nextScreen() : 'hub') : J.toast('Press START ADVENTURE on the menu first.'); }); }
      else if(/Base HQ/.test(t)){ el.addEventListener('click', function(e){ e.preventDefault(); J.sfx.tap(); J.G ? J.go('hub') : J.go('menu'); }); }
      else if(/Research/.test(t)){ relabel('Research', 'Quests'); el.addEventListener('click', function(e){ e.preventDefault(); J.sfx.tap(); J.go('questHub'); }); }
    });
    // the logo button used to reload the whole page: send it to the menu instead
    var brand = Array.prototype.find.call(root.querySelectorAll('header button, header a'), function(el){ return /A Day on the Moon/.test(el.textContent) && !/ENTER|START/.test(el.textContent); });
    if(brand){ brand.removeAttribute('onclick'); brand.addEventListener('click', function(e){ e.preventDefault(); J.sfx.tap(); J.go('menu'); }); }
    // decorations that did nothing: fake radio player, counselor audio, map zoom buttons
    Array.prototype.forEach.call(root.querySelectorAll('div'), function(d){
      if(/rounded-full/.test(d.className) && /Lunar Base Radio/i.test(d.textContent) && d.textContent.length < 160) d.style.display = 'none';
    });
    Array.prototype.forEach.call(root.querySelectorAll('button'), function(b){
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if(/CAMP COUNSELOR DISPATCH/i.test(t) || /^(zoom_in|zoom_out|filter_center_focus|add|remove|layers)$/.test(t)) b.style.display = 'none';
    });
    // Stitch navigation buttons that exist on most screens
    J.bindText(root, /^(arrow_back\s*)?(←\s*)?(RETURN TO BASE HQ|Base HQ|BASE HUB)\s*(OVERVIEW)?$/i, function(){ J.G ? J.go('hub') : J.go('menu'); }, 'main button, main a, section button, section a');
    J.bindText(root, /RETURN TO MAIN MENU|Main Menu|RETURN TO MENU/i, function(){ J.go('menu'); });
  }
  J.settings = function(){
    return J.modal({kicker:'Settings', title:'Cadet settings',
      html:'<p>Sound is <b>'+(J.muted?'OFF':'ON')+'</b>.</p><p class="text-sm">This is a pretend (simulated) learning adventure. The numbers are made up for learning and are not real NASA measurements.</p>',
      actions:[{label:J.muted?'TURN SOUND ON':'TURN SOUND OFF', cls:'gold', value:'snd'},{label:'CLOSE', cls:'dim', value:false}]}).then(function(v){
        if(v === 'snd'){ J.setMuted(!J.muted); J.toast('Sound '+(J.muted?'off':'on')); }
      });
  };
  J.pauseMenu = function(){
    return J.modal({kicker:'Paused', title:'Mission paused', html:'<p>Your place is saved for you.</p>',
      actions:[{label:'RESUME', cls:'cyan', value:'resume'},{label:'MAIN MENU', cls:'dim', value:'menu'}]}).then(function(v){ if(v === 'menu') J.go('menu'); });
  };

  function render(name){
    var def = J.screens[name];
    if(!def){ name = 'menu'; def = J.screens.menu; }
    J.clearT();
    $('modal-root').innerHTML = ''; $('modal-root').style.pointerEvents = 'none';
    var scr = def.custom || SCREENS[def.n];
    if(!scr){ app.innerHTML = '<p style="padding:2rem">Screen missing.</p>'; return; }
    current = name;
    if(J.G && !/^q[1-5]$|^questHub$|^menu$/.test(name)){ J.G.screen = name; J.save(); }   // quests/menu never become the saved mission position
    app.className = scr.bodyClass || '';
    app.innerHTML = (scr.style ? '<style>'+scr.style+'</style>' : '') + scr.html;
    if(scr.js) runScreenScript(scr.js);
    if(!/^q[1-5]$/.test(name) && name !== 'questHub') stripXp(app);
    reword(app);
    patchHeader(app);
    fixImages(app);
    bindCommon(app, name);
    if(def.bind){ try{ def.bind(app); }catch(e){ console.error('bind error in '+name+':', e); } }
    var tip = J.coachFor && J.coachFor[name];
    J.coachSet(tip ? tip[0] : '', tip ? tip[1] : null);
    runSimple();   // plain language (after buttons are wired, so they are found by their original names)
    window.scrollTo(0, 0);
    document.title = 'A Day on the Moon: Junior Astronaut Mission Trainer';
    J.currentScreen = name;
  }
  J.render = render;

  J.go = function(name){
    var want = '#/' + name;
    if(location.hash === want) render(name); else location.hash = want;
  };
  var OPEN = {menu:1, invitation:1, trainingHub:1, training:1, questHub:1, q1:1, q2:1, q3:1, q4:1, q5:1};
  function routeFromHash(){
    var m = /^#\/([\w]+)/.exec(location.hash);
    var name = m ? m[1] : 'menu';
    if(!J.screens[name]) name = 'menu';
    if(!OPEN[name] && !J.G){ var s = J.loadSave(); if(s) J.G = s; else name = 'menu'; }
    return name;
  }
  window.addEventListener('hashchange', function(){ render(routeFromHash()); });
  J.start = function(){ render(routeFromHash()); };
})();
