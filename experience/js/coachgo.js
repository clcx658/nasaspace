/* The "What to do now" box also carries the screen's main button, so the way forward is always in view
   at the bottom of the screen, even after scrolling. Pressing it presses the real button for the child. */
(function(){
  'use strict';
  var J = window.JAM;

  var GO = {
    t1:/COMPLETE 08:00/i, t2:/EAT BREAKFAST/i, t3:/SEAL SUIT/i, t4:/CHOOSE THIS PLACE/i,
    t5:/AUTO-WIPE ALL|FINISH CLEANING|CONFIRM POWER/i, t6:/TRANSMIT REPORT/i, t7:/FINISH THE DAY/i,
    wA:/CONTINUE THE MISSION|CONTINUE MISSION/i, wB:/RESTORE BASE STATUS/i
  };
  function screenName(){ var m = /#\/([A-Za-z0-9]+)/.exec(location.hash); return m ? m[1] : 'menu'; }
  function clean(el){
    var t = '';
    Array.prototype.forEach.call(el.childNodes, function(n){
      if(n.nodeType === 3) t += n.nodeValue;
      else if(n.nodeType === 1 && !n.classList.contains('material-symbols-outlined')) t += n.textContent;
    });
    return t.replace(/\s+/g, ' ').trim();
  }
  function findReal(re){
    var all = document.querySelectorAll('#app main button, #app main a');
    for(var i = 0; i < all.length; i++){
      var b = all[i];
      if(b.closest('.focus-more,#coach') || !b.offsetParent) continue;      // only a button the child can really see
      if(re.test(clean(b)) || (b.__orig && re.test(b.__orig))) return b;
    }
    return null;
  }
  var CTAWORD = /FINISH|CONFIRM|CONTINUE|TRANSMIT|SEAL|EAT BREAKFAST|COMPLETE|RESTORE|CHOOSE THIS|AUTO-WIPE|NEXT|START/i;
  /* the button the helper is pointing at right now; otherwise the screen's usual main button */
  function currentReal(){
    var el = J.coachEl;
    if(el && document.body.contains(el) && el.offsetParent && /^(BUTTON|A)$/.test(el.tagName) && CTAWORD.test(clean(el) + ' ' + (el.__orig || ''))) return el;
    var re = GO[screenName()];
    return re ? findReal(re) : null;
  }
  function nice(s){ s = s.toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }

  function attach(){
    var box = document.getElementById('coach');
    if(box){ var sh = box.querySelector('.coach-show'); if(sh) sh.remove(); }      // the glow and the big button are enough
    if(box && box.style.display !== 'none' && !box.querySelector('.coach-say')){
      var sy = document.createElement('button'); sy.type = 'button'; sy.className = 'coach-say'; sy.innerHTML = '🔊'; sy.setAttribute('aria-label', 'Read this to me');
      sy.addEventListener('click', function(){ sy.classList.add('on'); setTimeout(function(){ sy.classList.remove('on'); }, 1800); if(J.say) J.say(J.coachText || ''); });
      box.insertBefore(sy, box.querySelector('.coach-x'));
    }
    var re = GO[screenName()];
    if(!box || !re || box.style.display === 'none') return;
    var real = currentReal(), btn = box.querySelector('.coach-go');
    if(!real){ if(btn) btn.remove(); return; }
    if(!btn){
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 'coach-go';
      var show = box.querySelector('.coach-show'); if(show) show.remove();      // "take me there" is no longer needed
      var x = box.querySelector('.coach-x');
      box.insertBefore(btn, x);
      btn.addEventListener('click', function(){
        var r = currentReal(); if(!r){ return; }
        r.click();
      });
    }
    btn.textContent = nice(clean(real)) + ' ›';
  }

  var orig = J.coachSet;
  J.coachSet = function(){ var r = orig.apply(this, arguments); try{ attach(); }catch(e){} return r; };
  setInterval(function(){ try{ attach(); }catch(e){} }, 400);
})();
