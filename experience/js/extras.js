/* Things that looked clickable in the design but did nothing now answer with a clear pop-up or message. */
(function(){
  'use strict';
  var J = window.JAM;

  function leafMatches(root, re){
    var out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while((n = tw.nextNode())){ if(re.test(n.nodeValue) && n.parentElement && !n.parentElement.closest('#taskbar,.focus-more,[data-folded]')) out.push(n.parentElement); }
    return out;
  }
  function info(title, text, kicker, icon){
    J.modal({kicker:kicker || 'Did you know?', title:(icon ? icon + ' ' : '') + title, html:'<p style="font-size:1.05rem;font-weight:700;line-height:1.45">' + text + '</p>', actions:[{label:'GOT IT', cls:'cyan', value:true}]});
  }
  function bind(el, fn){
    if(!el || el.__extra) return; el.__extra = true;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('button') && e.target !== el && el.tagName !== 'BUTTON') return; J.sfx.tap(); fn(); });
  }
  function wrap(name, fn){
    var d = J.screens[name]; if(!d) return;
    var old = d.bind;
    d.bind = function(root){ var r = old ? old.apply(this, arguments) : undefined; try{ fn(root); }catch(e){ console.warn('extras ' + name + ':', e.message); } return r; };
  }

  /* menu: the mission log */
  wrap('menu', function(root){
    leafMatches(root, /^\s*Logs\b/).forEach(function(el){
      bind(el, function(){
        var g = J.G || {}, done = Math.max(0, Math.min(7, g.task || 0));
        info('Your mission log', done ? 'You have finished <b>' + done + ' of 7</b> tasks on your Moon day. Press START ADVENTURE to carry on.' : 'Nothing in the log yet. Press START ADVENTURE and your Moon day will be written here.', 'Mission log', '📒');
      });
    });
  });

  /* landing: the three buildings you can see from the window */
  wrap('landing', function(root){
    var FACTS = [
      [/Refining|Silo/i, 'Oxygen factory', 'This building would make oxygen from Moon rocks. Moon soil is full of oxygen, locked inside the rock. Heat and electricity can set it free.', '🏭'],
      [/Solar Energy|Hex Solar/i, 'Solar farm', 'Big flat panels turn sunlight into electricity. Near the Moon\'s south pole the Sun is low, but some places get sunlight almost all the time.', '☀️'],
      [/Greenhouse|Plant/i, 'Plant greenhouse', 'Plants make fresh food and some of the air we breathe. Astronauts have already grown lettuce and radishes in space.', '🌱']
    ];
    FACTS.forEach(function(f){
      leafMatches(root, f[0]).forEach(function(el){
        var card = el.closest('.group') || el.parentElement;
        bind(card, function(){ info(f[1], f[2], 'Look outside', f[3]); });
      });
    });
  });

  /* rocket: the boost button says what it does */
  wrap('rocket', function(root){
    var b = root.querySelector('#boost-btn');
    if(b) b.addEventListener('click', function(){ J.sfx.tap(); J.toast('Boost! The rocket goes faster.'); });
  });

  /* 08:00 health check */
  wrap('t1', function(root){
    Array.prototype.forEach.call(root.querySelectorAll('button'), function(b){
      if(/CHECK HEALTH/i.test(b.textContent) && !/COMPLETE/i.test(b.textContent)){
        b.addEventListener('click', function(){
          J.sfx.good();
          info('Health check done', 'Heartbeat: <b>72 a minute</b>. Oxygen in your blood: <b>99%</b>. You are healthy and ready for the Moon!<br><br><span style="font-weight:600;font-size:.95rem">Now tap the other cards, find the one marked <b>Action Needed</b>, and press <b>Recalibrate</b>.</span>', 'Your health', '❤️');
        });
      }
    });
  });

  /* 09:00 breakfast: tap any food to learn about it */
  wrap('t2', function(root){
    var FOODS = [
      [/Scrambled Egg/i, 'Scrambled egg bites', 'They are wrapped in a tortilla, so no crumbs float away. Eggs give you protein for strong muscles.', '🥚'],
      [/Spinach/i, 'Greenhouse spinach', 'It is grown in the base greenhouse. Spinach is full of iron and vitamin C to keep astronauts healthy.', '🥬'],
      [/Peach/i, 'Rehydrated peaches', 'Freeze-dried peaches are very light, so rockets can carry more. Add water and they turn back into juicy fruit.', '🍑'],
      [/Electrolyte|Berry/i, 'Berry drink pouch', 'A sealed pouch with a straw. The drink cannot float out and make a mess in the air.', '🧃'],
      [/Crumbly Toast/i, 'Crumbly toast: a hazard!', 'Crumbs float in space and can clog the air filters. That is why astronauts eat tortillas, not bread.', '⚠️']
    ];
    FOODS.forEach(function(f){
      leafMatches(root, f[0]).forEach(function(el){
        var card = el.closest('div[class*="border-2"], div[class*="border-3"]');
        if(card && !card.contains(root.querySelector('main')) && card.getBoundingClientRect().height < 220) bind(card, function(){ info(f[1], f[2], 'Space food', f[3]); });
      });
    });
  });
})();
