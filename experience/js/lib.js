/* Small shared utilities + sound. Exposes window.JAM (also used by the mini-games). */
(function(){
  'use strict';
  var J = window.JAM = window.JAM || {};
  J.$ = function(id){ return document.getElementById(id); };
  J.clamp = function(v){ return Math.max(0, Math.min(100, v)); };
  J.rand = function(a, b){ return a + Math.floor(Math.random()*(b-a+1)); };
  J.pick = function(arr){ return arr[Math.floor(Math.random()*arr.length)]; };
  J.shuffle = function(a){
    a = a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  };
  J.store = function(k, v){
    try{
      if(v === undefined) return localStorage.getItem(k);
      if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    }catch(e){ return null; }
  };
  var timers = [];
  J.T = function(fn, ms){ var id = setTimeout(fn, ms); timers.push(id); return id; };
  J.clearT = function(){ timers.forEach(clearTimeout); timers = []; };
  J.sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

  /* ---------- Sound (tiny synth, no files) ---------- */
  var ac = null;
  J.muted = J.store('jamt_stitch_mute') === '1';
  function beep(f, d, type, vol, delay){
    if(J.muted) return;
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
  J.setMuted = function(m){ J.muted = !!m; J.store('jamt_stitch_mute', J.muted ? '1' : '0'); };
})();
