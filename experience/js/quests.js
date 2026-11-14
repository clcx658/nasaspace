/* NASA Science Quests: optional, completely separate from the mission. They never read or change the mission
   state (J.G), the 50-point score or the ending. Progress is kept under its own storage key. */
(function(){
  'use strict';
  var J = window.JAM, $ = J.$;
  var QKEY = 'jamt_stitch_quests_v1';
  var QUESTS = [
    {id:'q1', n:23, icon:'air', title:'Breathe Easy!', sub:'How life support keeps astronauts alive (ECLSS)', color:'tertiary-container'},
    {id:'q2', n:24, icon:'sunny', title:'Solar Storm Alert!', sub:'Space weather and radiation', color:'secondary-container'},
    {id:'q3', n:25, icon:'bolt', title:'Power Up!', sub:'Solar and fission power for a Moon base', color:'primary-container'},
    {id:'q4', n:26, icon:'potted_plant', title:'Greenhouse Heroes', sub:'Growing plants in space', color:'tertiary-container'},
    {id:'q5', n:27, icon:'diamond', title:'Moon Resource Explorer', sub:'Using Moon materials (ISRU)', color:'primary-container'}
  ];
  function done(){ try{ return JSON.parse(J.store(QKEY) || '{}'); }catch(e){ return {}; } }
  function markDone(id){ var d = done(); d[id] = true; J.store(QKEY, JSON.stringify(d)); }
  J.questsDone = function(){ return Object.keys(done()).length; };

  /* ----- the five quest screens (Stitch markup, Stitch logic) ----- */
  QUESTS.forEach(function(q, i){
    J.screen(q.id, q.n, function(root){
      // buttons that exist on every quest screen
      if(q.id === 'q2' && J.donkiPanel) J.donkiPanel(root);   // real NASA data on the Solar Storm quest
      J.bindText(root, /RETURN TO SCIENCE QUEST HUB|NASA Science Quests/i, function(){ J.go('questHub'); });
      J.bindText(root, /NEXT QUEST/i, function(){ J.go(QUESTS[(i+1) % QUESTS.length].id); });
      J.bindText(root, /REPLAY SCIENCE QUEST/i, function(){ J.render(q.id); });
      J.bindText(root, /RETURN TO MAIN MENU/i, function(){ J.go('menu'); });
      J.bindText(root, /CONTINUE EXPLORING THE MOON/i, function(){ J.G ? J.go(J.nextScreen ? J.nextScreen() : 'hub') : J.go('menu'); });
      // "XP" is only decoration here: show it as a badge reward and keep it out of the mission
      J.setText(root, /\b\d+\s*XP REWARD/i, 'BADGE REWARD');
      // detect a correct quiz answer -> quest done (state is stored separately from the mission)
      ['handleQuizAnswer','handleQuiz'].forEach(function(fn){
        if(typeof window[fn] !== 'function') return;
        var orig = window[fn];
        window[fn] = function(){
          var args = arguments, ok = false;
          for(var k=0;k<args.length;k++){ if(args[k] === true) ok = true; }
          var r = orig.apply(this, args);
          if(ok){ markDone(q.id); J.sfx.good(); }
          return r;
        };
      });
    });
  });

  /* ----- quest hub (new screen built from the Stitch header + design tokens) ----- */
  function hubDef(){
    var base = window.STITCH_SCREENS[23] || {};
    var header = '';
    try{
      var doc = new DOMParser().parseFromString('<div>'+base.html+'</div>', 'text/html');
      var h = doc.querySelector('header'); header = h ? h.outerHTML : '';
    }catch(e){}
    var d = done(), count = Object.keys(d).length;
    var cards = QUESTS.map(function(q){
      var ok = !!d[q.id];
      return '<button data-q="'+q.id+'" class="text-left rounded-3xl border-2 '+(ok?'border-tertiary-container':'border-outline-variant')+' bg-surface-container-low p-5 hover:border-primary-container transition-all flex gap-4 items-center">'+
        '<div class="w-16 h-16 rounded-2xl bg-'+q.color+'/20 border-2 border-'+q.color+' flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-'+q.color+'" style="font-size:2.2rem;font-variation-settings:\'FILL\' 1">'+q.icon+'</span></div>'+
        '<div class="flex-1"><div class="text-label-sm font-label-sm text-primary-container uppercase tracking-wider">Quest '+(QUESTS.indexOf(q)+1)+' of 5</div>'+
        '<div class="text-headline-sm font-headline-sm text-on-surface font-extrabold">'+q.title+'</div>'+
        '<div class="text-body-sm font-body-sm text-on-surface-variant">'+q.sub+'</div></div>'+
        '<div class="text-label-md font-label-md font-extrabold px-3 py-1 rounded-full '+(ok?'bg-tertiary-container text-on-tertiary-container':'bg-surface-container-high text-on-surface')+'">'+(ok?'BADGE EARNED':'NEW')+'</div></button>';
    }).join('');
    return {
      title:'NASA Science Quests', bodyClass: base.bodyClass || '', style:'',
      html: header +
        '<main class="relative z-10 pt-24 pb-28 px-4 md:px-8 max-w-4xl mx-auto w-full">'+
        '<div class="rounded-3xl border-2 border-primary-container bg-surface-container-low p-6 mb-6 shadow-[0_0_16px_rgba(0,229,255,0.15)]">'+
        '<div class="text-label-md font-label-md text-primary-container uppercase tracking-wider">Optional · Does not change your mission score</div>'+
        '<h1 class="text-headline-lg font-headline-lg font-extrabold text-on-surface mt-1">NASA Science Quests</h1>'+
        '<p class="text-body-md font-body-md text-on-surface-variant mt-2">Five short quests about real NASA science. Earn a badge in each one. These quests are just for learning and never change your Moon mission or your ending.</p>'+
        '<div class="mt-3 inline-block px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant text-label-md font-label-md font-extrabold">'+count+' of 5 badges earned</div></div>'+
        '<div class="grid gap-4 md:grid-cols-2" id="questCards">'+cards+'</div>'+
        '<div class="flex flex-wrap gap-3 justify-center mt-8">'+
        '<button id="qhMenu" class="gbtn dim">MAIN MENU</button>'+(J.G && !J.G.finished ? '<button id="qhBack" class="gbtn gold">BACK TO MY MISSION</button>' : '')+'</div>'+
        '<p class="text-center text-label-sm font-label-sm text-on-surface-variant mt-6">Simulated educational experience. Learn more at <a class="underline text-primary-container" href="https://www.nasa.gov/artemis/" target="_blank" rel="noopener">NASA Artemis</a> and <a class="underline text-primary-container" href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener">NASA DONKI</a>.</p></main>'
    };
  }
  J.customScreen('questHub', {get html(){ return hubDef().html; }, get bodyClass(){ return hubDef().bodyClass; }, style:'', title:'NASA Science Quests'}, function(root){
    Array.prototype.forEach.call(root.querySelectorAll('[data-q]'), function(b){ b.addEventListener('click', function(){ J.sfx.tap(); J.go(b.getAttribute('data-q')); }); });
    var m = root.querySelector('#qhMenu'); if(m) m.onclick = function(){ J.go('menu'); };
    var bk = root.querySelector('#qhBack'); if(bk) bk.onclick = function(){ J.go(J.G && J.G.screen && J.screens[J.G.screen] && !/^q|questHub/.test(J.G.screen) ? J.G.screen : 'hub'); };
  });
})();
