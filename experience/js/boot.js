/* Start the experience. ?demo=1 jumps straight to the Moon base (handy for judges); ?scenario=A|B|C forces the space weather. */
(function(){
  'use strict';
  var J = window.JAM;
  var q = new URLSearchParams(location.search);
  if(q.get('demo')){
    var g = J.newGame(); g.accepted = true; g.trained = true; J.save();
    if(!/^#\/hub/.test(location.hash)) location.hash = '#/hub';
  }
  J.start();
})();
