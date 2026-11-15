/* Focus mode: on the task and event screens only the thing to do stays in view.
   Extra reading (science notes, status panels, cameras, logs) is tucked behind a small
   "More to explore" row of buttons at the bottom. Tapping one opens it in a pop-up.
   Nothing is removed: the blocks are only hidden, so every screen script still finds its parts. */
(function(){
  'use strict';
  var J = window.JAM;

  /* screen -> blocks to tuck away: re finds the block by its text, label/icon name the button */
  var FOLD = {
    t1:[{re:/STEM Moon Science Fact/i, label:'Moon science fact', icon:'🔬'}, {re:/Sleeping Quarters/i, label:'Base camera', icon:'📷'}],
    t2:[{re:/NASA Space Food Fact/i, label:'Space food fact', icon:'🍽️'}],
    t3:[{re:/Why Spacesuits Need Gold Visors/i, label:'Why a gold visor?', icon:'🔬'}, {re:/Suit Readings/i, label:'Suit readings', icon:'📊'}],
    t4:[{re:/NASA Moon Fact/i, label:'Moon fact', icon:'🌙'}, {re:/Site 1: Rim/i, label:'What we might find', icon:'🪨', small:true}],
    t5:[{re:/Efficiency Boost Analytics/i, label:'Power numbers', icon:'📊'}, {re:/Why Moon Dust is a Big Deal/i, label:'Why Moon dust matters', icon:'🔬'}, {re:/Task Completion Log/i, label:'Task log', icon:'📋'}],
    t6:[{re:/Message Rules/i, label:'Message rules', icon:'📡'}, {re:/Reports to Send/i, label:'Sending status', icon:'📶'}, {re:/17:00 Rest and tidy up/i, label:'What is next', icon:'🕔'}],
    t7:[{re:/NASA Science Note/i, label:'Science note', icon:'🔬'}, {re:/Rad Shield: 100% Active/i, label:'Base status', icon:'📊', small:true}],
    wA:[{re:/MOON BASE VIEW/i, label:'Base view', icon:'📷'}, {re:/Base Check-Up/i, label:'Base check-up', icon:'📋'}, {re:/Why Routine Checks Matter/i, label:'Why checks matter', icon:'🔬'}],
    wB:[{re:/AREA 3/i, label:'Map of the panels', icon:'🗺️'}, {re:/Science Class: Moon Dust/i, label:'Science class', icon:'🔬'}],
    wC:[{sel:'[data-donki]', label:'Real NASA space weather', icon:'🛰️'}, {re:/MOON BASE CAMERA 4/i, label:'Shelter camera', icon:'📷'}, {re:/Storm Shelter/i, label:'About the shelter', icon:'🏠'}, {re:/What is a Solar Particle Event/i, label:'What is a solar storm?', icon:'🔬'}]
  };

  function isColumnLike(el){
    if(!el) return true;
    var cs = getComputedStyle(el);
    if(el.tagName === 'MAIN') return true;
    if(cs.display === 'grid') return true;
    if(cs.display === 'flex' && /column/.test(cs.flexDirection)) return true;
    if(/(^|\s)space-y-/.test(el.className || '')) return true;
    return false;
  }
  function blockFromText(root, re, small){
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    function enough(e){ var r = e.getBoundingClientRect(); return small || (r.height >= 100 && r.width >= 280 && getComputedStyle(e).position !== 'absolute'); }
    while((n = tw.nextNode())){
      if(!re.test(n.nodeValue)) continue;
      var hit = n.parentElement; if(!hit || hit.closest('header,nav.fixed,script,style,#coach,.focus-more,[data-folded]')) continue;
      var el = hit;
      while(el.parentElement && el.parentElement !== root && !(isColumnLike(el.parentElement) && enough(el))) el = el.parentElement;
      // a real block: not the whole page area, not the breadcrumb bar, not something that holds the page title
      if(el === root || el.tagName === 'MAIN' || el.querySelector('main,h1')) continue;
      if(el.getBoundingClientRect().height > 820) continue;
      if(/(^|\s)(mt-4 mb-6|flex-wrap)/.test(el.className) && el.querySelector('a,button') && /Base HQ/i.test(el.textContent) && el.getBoundingClientRect().height < 90) continue;
      return el;
    }
    return null;
  }
  function visibleKids(el){ return Array.prototype.filter.call(el.children, function(c){ return c.style.display !== 'none' && getComputedStyle(c).display !== 'none'; }); }

  function row(root){
    var r = root.querySelector('.focus-more'); if(r) return r;
    r = document.createElement('div'); r.className = 'focus-more'; r.setAttribute('data-nosimple', '1');
    r.innerHTML = '<span class="fm-title">More to explore:</span>';
    var host = root.querySelector('main') || root;
    host.appendChild(r);
    return r;
  }
  function chip(root, label, icon, onClick){
    var r = row(root), b = document.createElement('button');
    b.type = 'button'; b.className = 'fm-chip'; b.innerHTML = '<span aria-hidden="true">'+icon+'</span> '+label;
    b.addEventListener('click', function(){ J.sfx.tap(); onClick(); });
    r.appendChild(b); return b;
  }
  J.addMoreChip = function(root, label, icon, onClick){ return chip(root, label, icon, onClick); };

  function openBlock(label, el){
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[id]'), function(x){ x.removeAttribute('id'); });
    c.removeAttribute('id'); c.style.display = ''; c.style.margin = '0'; c.removeAttribute('data-folded');
    Array.prototype.forEach.call(c.querySelectorAll('[onclick]'), function(x){ x.removeAttribute('onclick'); });
    var wrap = document.createElement('div'); wrap.className = 'focus-pop'; wrap.appendChild(c);
    J.modal({kicker:'More to explore', title:label, html:'<div class="focus-pop">'+c.outerHTML+'</div>', cls:'wide'});
  }

  /* Commander Nova's long speech box at the top of a task: tucked into one button (the short instruction lives in the task bar) */
  var NOVA = {t1:1,t2:1,t3:1,t4:1,t7:1,wA:1,wB:1};
  function novaCard(root){
    var main = root.querySelector('main'); if(!main) return null;
    var kids = Array.prototype.slice.call(main.children, 0, 5);
    for(var i = 0; i < kids.length; i++){
      var k = kids[i], r = k.getBoundingClientRect();
      if(/Commander Nova/i.test(k.textContent) && r.height >= 60 && r.height <= 230 && !k.querySelector('button,input,a')) return k;
    }
    return null;
  }
  function apply(name, root){
    var items = FOLD[name]; if(!items || !document.body.contains(root)) return;
    var folded = [];
    if(NOVA[name]){
      var nc = novaCard(root);
      if(nc){ nc.setAttribute('data-folded', '1'); nc.style.display = 'none'; folded.push({el:nc, it:{label:'Message from Commander Nova', icon:'💬'}}); }
    }
    items.forEach(function(it){
      var el = it.sel ? root.querySelector(it.sel) : blockFromText(root, it.re, it.small);
      if(!el || el.getAttribute('data-folded')) return;
      // never hide something that holds a control the child needs
      if(el.querySelector('#restoreBtn,#primaryContinueBtn,#choiceGrid,#checklist-container,#decisionGroup,.loc-pin,#quick-recal-btn,#card-drift,.quiz-btn,#inspect-btn')) return;
      el.setAttribute('data-folded', '1'); el.style.display = 'none';
      folded.push({el:el, it:it});
    });
    // a column with nothing left to show is hidden too, and its neighbour takes the full width
    folded.forEach(function(f){
      var par = f.el.parentElement, guard = 0;
      while(par && par !== root && guard++ < 4){
        if(visibleKids(par).length) break;
        par.style.display = 'none'; par.setAttribute('data-folded', '1');
        var gp = par.parentElement;
        if(gp && getComputedStyle(gp).display === 'grid'){
          var left = visibleKids(gp);
          if(left.length === 1) left[0].style.gridColumn = '1 / -1';
        }
        par = gp;
      }
      chip(root, f.it.label, f.it.icon, function(){ openBlock(f.it.label, f.el); });
    });
  }

  /* run after the screen is built and the plain-language pass has changed its words */
  function wrap(name){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){
      var r = old ? old.apply(this, arguments) : undefined;
      setTimeout(function(){ try{ apply(name, root); }catch(e){ console.warn('focus mode:', e.message); } }, 0);
      return r;
    };
  }
  Object.keys(FOLD).forEach(wrap);
})();
