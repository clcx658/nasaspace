/* Personalised pictures made in the browser (nothing is uploaded): the boarding-pass ticket and the certificate.
   The learner's name is kept only on their own device (localStorage). */
(function(){
  'use strict';
  var J = window.JAM;
  var NAME_KEY = 'jamt_stitch_name';

  /* ---------- name ---------- */
  J.cleanName = function(v){
    return String(v || '').replace(/[<>&"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  };
  J.getName = function(){ return J.cleanName((J.G && J.G.name) || J.store(NAME_KEY) || ''); };
  J.setName = function(v){ var n = J.cleanName(v); J.store(NAME_KEY, n); if(J.G){ J.G.name = n; J.save(); } return n; };
  J.displayName = function(){ return J.getName() || 'Cadet Explorer'; };

  /* ---------- canvas helpers ---------- */
  function rr(ctx, x, y, w, h, r){
    ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
  }
  function fit(ctx, text, maxW, size, weight, family){
    var s = size;
    do { ctx.font = weight+' '+s+'px '+family; s -= 2; } while(ctx.measureText(text).width > maxW && s > 18);
    return s + 2;
  }
  function loadFonts(){
    if(!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([document.fonts.load('800 40px Outfit'), document.fonts.load('600 24px Outfit')]).catch(function(){});
  }
  function today(){ return new Date().toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}); }
  function seeded(str){ var h = 2166136261; for(var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return function(){ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

  /* ---------- boarding-pass ticket ---------- */
  J.makeTicket = function(name){
    return loadFonts().then(function(){
      var W = 1400, H = 560, c = document.createElement('canvas'); c.width = W; c.height = H;
      var ctx = c.getContext('2d'), rnd = seeded(name + 'ticket');
      var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b0d1b'); g.addColorStop(1, '#1d2138');
      rr(ctx, 6, 6, W-12, H-12, 36); ctx.fillStyle = g; ctx.fill();
      ctx.save(); rr(ctx, 6, 6, W-12, H-12, 36); ctx.clip();
      for(var i=0;i<70;i++){ ctx.fillStyle = 'rgba(255,255,255,'+(0.25+rnd()*0.6)+')'; ctx.beginPath(); ctx.arc(rnd()*W, rnd()*H, 1+rnd()*2, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,205,230,.16)'; ctx.beginPath(); ctx.arc(W-180, H+120, 330, 0, 6.3); ctx.fill();   // Moon horizon
      ctx.restore();
      rr(ctx, 6, 6, W-12, H-12, 36); ctx.lineWidth = 6; ctx.strokeStyle = '#00e5ff'; ctx.stroke();
      // tear-off line + notches
      var sx = 1040; ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,229,255,.55)'; ctx.beginPath(); ctx.moveTo(sx, 46); ctx.lineTo(sx, H-46); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#05060f'; ctx.beginPath(); ctx.arc(sx, 6, 22, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.arc(sx, H-6, 22, 0, 6.3); ctx.fill();
      var F = 'Outfit, "Trebuchet MS", sans-serif';
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillStyle = '#00e5ff'; ctx.font = '800 26px '+F; ctx.fillText('LUNAR LIVING EXPERIENCE CAMP', 70, 92);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 84px '+F; ctx.fillText('BOARDING PASS', 70, 176);
      ctx.fillStyle = '#bac9cc'; ctx.font = '700 22px '+F; ctx.fillText('PASSENGER', 70, 246);
      var nm = name.toUpperCase(); var ns = fit(ctx, nm, 900, 76, 900, F); ctx.fillStyle = '#ffb300'; ctx.font = '900 '+ns+'px '+F; ctx.fillText(nm, 70, 246 + ns + 4);
      ctx.fillStyle = '#bac9cc'; ctx.font = '700 20px '+F;
      ctx.fillText('FROM', 70, 380); ctx.fillText('TO', 330, 380);
      ctx.fillStyle = '#ffffff'; ctx.font = '800 36px '+F; ctx.fillText('EARTH', 70, 420); ctx.fillText('ARTEMIS BASE ALPHA', 330, 420);
      ctx.fillStyle = '#bac9cc'; ctx.font = '700 20px '+F;
      ctx.fillText('FLIGHT', 70, 468); ctx.fillText('SEAT', 330, 468); ctx.fillText('GATE', 520, 468); ctx.fillText('DATE', 700, 468);
      var seat = (1 + Math.floor(rnd()*30)) + 'ABCDEF'.charAt(Math.floor(rnd()*6));
      ctx.fillStyle = '#62f0a0'; ctx.font = '800 30px '+F; ctx.fillText('MOON-'+(100+Math.floor(rnd()*899)), 70, 504); ctx.fillText(seat, 330, 504); ctx.fillText('SOL 04', 520, 504);
      ctx.fillStyle = '#ffffff'; ctx.fillText(today(), 700, 504);
      // stub
      ctx.textAlign = 'center'; ctx.font = '120px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('🚀', (sx+W)/2, 220);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 34px '+F; ctx.fillText('ADMIT ONE', (sx+W)/2, 290);
      ctx.fillStyle = '#00e5ff'; ctx.font = '800 22px '+F; ctx.fillText('JUNIOR ASTRONAUT', (sx+W)/2, 324);
      var bx = sx + 50; for(var k=0;k<34;k++){ var bw = 2 + Math.floor(rnd()*6); ctx.fillStyle = '#e1e1f5'; ctx.fillRect(bx, 360, bw, 70); bx += bw + 3 + Math.floor(rnd()*4); if(bx > W-60) break; }
      ctx.fillStyle = '#bac9cc'; ctx.font = '600 17px '+F; ctx.textAlign = 'left';
      ctx.fillText('A Day on the Moon · NASA Space Apps Challenge 2026 · Team AstroPath · Simulated educational experience', 70, H-22);
      return c;
    });
  };

  /* ---------- certificate ---------- */
  J.makeCertificate = function(o){
    return loadFonts().then(function(){
      var W = 1600, H = 1130, c = document.createElement('canvas'); c.width = W; c.height = H;
      var ctx = c.getContext('2d'), F = 'Outfit, "Trebuchet MS", sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 14; ctx.strokeRect(34, 34, W-68, H-68);
      ctx.lineWidth = 3; ctx.strokeRect(62, 62, W-124, H-124);
      ctx.fillStyle = '#b8860b'; ctx.font = '60px sans-serif'; ctx.textAlign = 'center';
      [[110,140],[W-110,140],[110,H-84],[W-110,H-84]].forEach(function(p){ ctx.fillText('★', p[0], p[1]); });
      ctx.fillStyle = '#2a2250'; ctx.font = '800 30px '+F; ctx.fillText('SIMULATED EDUCATIONAL CERTIFICATE', W/2, 150);
      ctx.font = '900 100px '+F; ctx.fillText('Certificate of Achievement', W/2, 262);
      ctx.fillStyle = '#b8860b'; ctx.font = '700 38px '+F; ctx.fillText('A DAY ON THE MOON · JUNIOR ASTRONAUT MISSION', W/2, 318);
      ctx.fillStyle = '#2a2250'; ctx.font = 'italic 40px '+SERIF; ctx.fillText('This is proudly presented to', W/2, 410);
      var nm = o.name; var ns = fit(ctx, nm, 1100, 120, 'bold italic', SERIF); ctx.font = 'bold italic '+ns+'px '+SERIF; ctx.fillStyle = '#1b1445'; ctx.fillText(nm, W/2, 524);
      ctx.strokeStyle = '#2a2250'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W/2-520, 552); ctx.lineTo(W/2+520, 552); ctx.stroke();
      ctx.fillStyle = '#2a2250'; ctx.font = 'italic 38px '+SERIF; ctx.fillText('for completing one day at Artemis Base Alpha and earning the title', W/2, 626);
      ctx.fillStyle = '#b8860b'; ctx.font = '900 84px '+F; ctx.fillText(o.title, W/2, 722);
      ctx.fillStyle = '#2a2250'; ctx.font = '800 44px '+F; ctx.fillText('Mission evaluation: '+o.total+' / 50', W/2, 802);
      ctx.fillStyle = '#4a4470'; ctx.font = '600 28px '+F;
      ctx.fillText('Oxygen '+o.res.o+'%  ·  Power '+o.res.p+'%  ·  Food '+o.res.f+'%  ·  Water '+o.res.w+'%  ·  Research '+o.research+' pts', W/2, 852);
      // signature + date + seal
      ctx.textAlign = 'left'; ctx.fillStyle = '#2a2250'; ctx.font = 'italic 54px '+SERIF; ctx.fillText('Commander Nova', 160, 962);
      ctx.strokeStyle = '#2a2250'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, 976); ctx.lineTo(560, 976); ctx.stroke();
      ctx.font = '600 24px '+F; ctx.fillText('Station Chief, Artemis Base Alpha', 160, 1012);
      ctx.textAlign = 'right'; ctx.font = '700 34px '+F; ctx.fillText(today(), W-160, 962); ctx.strokeStyle = '#2a2250'; ctx.beginPath(); ctx.moveTo(W-560, 976); ctx.lineTo(W-160, 976); ctx.stroke(); ctx.font = '600 24px '+F; ctx.fillText('Date', W-160, 1012);
      ctx.textAlign = 'center'; ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(W/2, 940, 62, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(W/2, 940, 50, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#b8860b'; ctx.font = '60px sans-serif'; ctx.fillText('★', W/2, 961);
      ctx.fillStyle = '#6a6490'; ctx.font = '600 20px '+F; ctx.fillText('Simulated educational certificate, not an official NASA credential. NASA Space Apps Challenge 2026 · Team AstroPath. Values are simulated.', W/2, H-80);
      return c;
    });
  };

  /* ---------- download + preview windows ---------- */
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cadet'; }
  J.downloadCanvas = function(canvas, filename){
    canvas.toBlob(function(blob){
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }, 'image/png');
  };

  /* Shows the ticket and resolves when the learner presses continue. */
  J.showTicket = function(name){
    return J.makeTicket(name).then(function(canvas){
      return new Promise(function(resolve){
        var h = J.openModal({cls:'wide gold', html:
          '<div class="gkicker">Your boarding pass</div><h2>Your ticket to the Moon is ready!</h2>'+
          '<img alt="Boarding pass for '+name+'" src="'+canvas.toDataURL('image/png')+'" style="width:100%;border-radius:1rem;margin:.5rem 0">'+
          '<p style="font-size:.9rem;color:#bac9cc">Download it to keep it. Your name stays on your own device.</p>'+
          '<div class="gactions"><button class="gbtn gold" id="tkDl">⬇ DOWNLOAD TICKET (PNG)</button><button class="gbtn cyan" id="tkGo">CONTINUE ➜</button></div>'});
        h.box.querySelector('#tkDl').onclick = function(){ J.sfx.tap(); J.downloadCanvas(canvas, 'moon-ticket-'+slug(name)+'.png'); J.toast('Ticket saved! Check your downloads.'); };
        h.box.querySelector('#tkGo').onclick = function(){ J.sfx.tap(); h.close(); resolve(); };
      });
    });
  };

  /* Shows the certificate with download and print buttons. */
  J.showCertificate = function(o){
    var name = o.name || J.displayName();
    return J.makeCertificate({name:name, title:o.title, total:o.total, res:o.res, research:o.research}).then(function(canvas){
      return new Promise(function(resolve){
        var h = J.openModal({cls:'wide gold', html:
          '<div class="gkicker">Mission complete</div><h2>Congratulations, '+name+'! Here is your certificate</h2>'+
          '<img id="cert-print" alt="Certificate for '+name+'" src="'+canvas.toDataURL('image/png')+'" style="width:100%;border-radius:.5rem;margin:.5rem 0;background:#fff">'+
          '<div class="gactions"><button class="gbtn gold" id="ctDl">⬇ DOWNLOAD CERTIFICATE (PNG)</button><button class="gbtn dim" id="ctPr">🖨 PRINT</button><button class="gbtn cyan" id="ctGo">CLOSE</button></div>'});
        h.box.querySelector('#ctDl').onclick = function(){ J.sfx.tap(); J.downloadCanvas(canvas, 'moon-certificate-'+slug(name)+'.png'); J.toast('Certificate saved! Check your downloads.'); };
        h.box.querySelector('#ctPr').onclick = function(){ J.sfx.tap(); window.print(); };
        h.box.querySelector('#ctGo').onclick = function(){ J.sfx.tap(); h.close(); resolve(); };
      });
    });
  };
})();
