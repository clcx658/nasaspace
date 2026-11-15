/* Task bar: the top of every task and event screen says, in a few plain words, WHAT this is and WHAT TO DO,
   with the main button right there. The big button presses the screen's real main button for the child. */
(function(){
  'use strict';
  var J = window.JAM;

  var BAR = {
    t1:{title:'Check your health', go:/COMPLETE 08:00/i},
    t2:{title:'Eat breakfast', go:/EAT BREAKFAST/i},
    t3:{title:'Put on your space suit', go:/SEAL SUIT/i},
    t4:{title:'Choose where to explore', go:/CHOOSE THIS PLACE/i},
    t5:{title:'Clean the solar panels', go:/AUTO-WIPE ALL|FINISH CLEANING|CONFIRM POWER/i},
    t6:{title:'Send your report to Earth', go:/TRANSMIT REPORT/i},
    t7:{title:'Get ready for bed', go:/FINISH THE DAY/i},
    wA:{title:'Choose what to do next', go:/CONTINUE THE MISSION|CONTINUE MISSION/i, event:true},
    wB:{title:'Fix the power problem', go:/RESTORE BASE STATUS/i, event:true},
    wC:{title:'Stay safe in the storm', go:null, event:true}
  };

  function clean(el){
    var t = '';
    Array.prototype.forEach.call(el.childNodes, function(n){
      if(n.nodeType === 3) t += n.nodeValue;
      else if(n.nodeType === 1 && !n.classList.contains('material-symbols-outlined')) t += n.textContent;
    });
    return t.replace(/\s+/g, ' ').trim();
  }
  function findGo(root, re){
    if(!re) return null;
    var all = root.querySelectorAll('main button, main a');
    for(var i = 0; i < all.length; i++){
      var b = all[i];
      if(b.closest('#taskbar,.focus-more')) continue;
      if(re.test(clean(b)) || (b.__orig && re.test(b.__orig))) return b;
    }
    return null;
  }
  function small(s){ return s.charAt(0) + s.slice(1).toLowerCase(); }

  function build(name, root){
    var conf = BAR[name], main = root.querySelector('main');
    if(!conf || !main || root.querySelector('#taskbar') || !document.body.contains(root)) return;
    var g = J.G || {}, idx = (J.TASKS || []).map(function(t){ return t.id; }).indexOf(name);
    var badge = conf.event ? 'SURPRISE ON THE MOON' : ('TASK ' + (idx + 1) + ' OF 7' + (J.TASKS && J.TASKS[idx] ? ' · ' + J.TASKS[idx].time : ''));
    var tip = (J.coachFor && J.coachFor[name]) ? J.coachFor[name][0] : '';
    var bar = document.createElement('section');
    bar.id = 'taskbar'; bar.className = 'taskbar'; bar.setAttribute('data-nosimple', '1');
    bar.innerHTML =
      '<div class="tb-main"><div class="tb-badge">'+badge+'</div><h2 class="tb-title">'+conf.title+'</h2>'+
      '<p class="tb-text"><span class="tb-do">DO THIS:</span> '+tip+'</p></div>'+
      (conf.go ? '<button type="button" class="tb-go" aria-disabled="true"><span class="tb-go-t">…</span><span class="tb-go-i" aria-hidden="true">›</span></button>' : '')+
      '<div class="tb-foot"><button type="button" class="tb-back">← Base HQ</button><span>Pretend (simulated) mission values. Not real NASA measurements.</span></div>';
    main.insertBefore(bar, main.firstChild);
    // the old top row (back link + task number + notice) is replaced by this bar
    var kids = Array.prototype.slice.call(main.children);
    kids.forEach(function(k){
      if(k === bar) return;
      var r = k.getBoundingClientRect();
      if(r.height < 260 && /Base HQ/i.test(k.textContent) && /(Daily Task|Branching Event|Task \d)/i.test(k.textContent) && !k.querySelector('input')){ k.style.display = 'none'; k.setAttribute('data-tb-hid', '1'); }
    });
    bar.querySelector('.tb-back').addEventListener('click', function(){ J.sfx.tap(); J.go('hub'); });
    var btn = bar.querySelector('.tb-go');
    function refresh(){
      if(!document.body.contains(bar)){ clearInterval(tm); return; }
      if(!btn) return;
      var real = findGo(root, conf.go);
      var on = !!(real && !real.disabled && real.getAttribute('aria-disabled') !== 'true');
      btn.setAttribute('aria-disabled', on ? 'false' : 'true');
      btn.firstChild.textContent = real ? small(clean(real)).replace(/^./, function(c){ return c.toUpperCase(); }) : 'Do the steps above first';
      btn.classList.toggle('tb-ready', on);
    }
    if(btn) btn.addEventListener('click', function(){
      if(btn.getAttribute('aria-disabled') === 'true'){ J.sfx.miss(); J.toast('Not yet! ' + (J.coachText || 'Finish the steps on this screen first.')); return; }
      var real = findGo(root, conf.go); if(!real) return;
      real.scrollIntoView({block:'nearest'}); real.click();
    });
    var tm = setInterval(refresh, 350); refresh();
  }

  function wrapAll(){
    Object.keys(J.screens).forEach(function(name){
      var d = J.screens[name], old = d.bind;
      d.bind = function(root){
        document.body.classList.toggle('has-bar', !!BAR[name]);
        var r = old ? old.apply(this, arguments) : undefined;
        if(BAR[name]) setTimeout(function(){ try{ build(name, root); }catch(e){ console.warn('task bar:', e.message); } }, 0);
        return r;
      };
    });
  }
  wrapAll();
})();
