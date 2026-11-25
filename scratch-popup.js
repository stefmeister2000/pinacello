/* Scratch-the-bottle newsletter pop-up (same as www.pinacello.com).
   Scratch -> 5% -> email -> code PINA5. Sign-ups go to Mailchimp via /api/subscribe (tag "promo-popup").
   Starts on 1 December 2026 (no pop-up during Black Friday). Preview any time with ?popup in the URL. */
(function(){
  var START=Date.parse('2026-12-01T00:00:00+01:00');
  var force=/[?&]popup/.test(location.search);
  if(Date.now()<START&&!force)return;
  if(!window.HTMLDialogElement)return;
  var CODE='PINA5';

  var css=''+
  '.sp-tab{position:fixed;left:0;top:50%;z-index:60;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;background:#fff;border:2px solid #141210;border-left:0;border-radius:0 10px 10px 0;box-shadow:4px 6px 18px rgba(20,18,16,.18);font-family:"Archivo",system-ui,sans-serif}'+
  '.sp-tab[hidden]{display:none}'+
  '.sp-open{appearance:none;border:0;background:none;cursor:pointer;padding:14px 9px 10px;color:#141210}'+
  '.sp-open span{writing-mode:vertical-rl;transform:rotate(180deg);font:800 13px "Archivo",sans-serif;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}'+
  '.sp-open:hover{background:#FFC72C}'+
  '.sp-x2{appearance:none;border:0;background:none;cursor:pointer;width:30px;height:28px;display:grid;place-items:center;color:#141210;border-top:1.5px solid rgba(20,18,16,.25)}'+
  '@media(max-width:640px){.sp-tab{top:auto;bottom:86px;left:12px;transform:none;flex-direction:row;border:2px solid #141210;border-radius:999px;background:#FFC72C}.sp-open{padding:10px 6px 10px 14px}.sp-open span{writing-mode:horizontal-tb;transform:none;font-size:12px}.sp-x2{border-top:0;border-left:1.5px solid rgba(20,18,16,.25);height:30px;width:32px}}'+
  '.sp-pop{border:0;padding:0;background:transparent;max-width:min(860px,calc(100vw - 32px));width:100%;overflow:visible;font-family:"Archivo",system-ui,sans-serif;color:#141210}'+
  '.sp-pop::backdrop{background:rgba(20,18,16,.55);backdrop-filter:blur(3px)}'+
  '.sp-pop[open]{animation:sp-in .45s cubic-bezier(.2,.9,.25,1.15)}'+
  '@keyframes sp-in{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}'+
  '.sp-box{position:relative;display:grid;grid-template-columns:1fr 1.1fr;background:#FFC72C;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35);border:2px solid #141210}'+
  '.sp-pic{position:relative;min-height:440px}.sp-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 55%}'+
  '.sp-badge{position:absolute;left:16px;bottom:16px;background:#fff;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.18)}'+
  '.sp-side{position:relative;padding:44px clamp(22px,3.5vw,40px) 28px;display:grid;justify-items:center;text-align:center;align-content:center}'+
  '.sp-kicker{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}'+
  '.sp-side h2{font-family:"Archivo",sans-serif!important;font-variation-settings:"wdth" 125;font-weight:800!important;font-size:clamp(32px,4.4vw,48px)!important;line-height:1!important;margin:8px 0 10px!important;color:#141210!important;text-transform:none!important}'+
  '.sp-side h2 span{display:inline-block;background:#141210;color:#FFC72C;padding:0 .18em;border-radius:4px;transform:rotate(-2deg)}'+
  '.sp-side p{margin:0 auto 14px;max-width:36ch;font-size:16px;line-height:1.5}'+
  '.sp-head{display:none}.sp-pop:not(.revealed) .sp-h1,.sp-pop.revealed:not(.sent) .sp-h2,.sp-pop.sent .sp-h3{display:block}'+
  '.sp-form,.sp-after{display:none;width:100%}.sp-pop.revealed:not(.sent) .sp-form{display:grid;gap:10px;margin-top:16px}'+
  '.sp-pop.sent .sp-after{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}'+
  '.sp-pop.revealed .sp-reveal,.sp-pop.sent .sp-skip{display:none}'+
  '.sp-form input{border:2px solid #141210;border-radius:999px;padding:14px 18px;font:400 16px "Archivo",sans-serif;background:#fff;width:100%;box-sizing:border-box}'+
  '.sp-btn{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:999px;background:#141210;color:#fff;font:700 15px "Archivo",sans-serif;padding:15px 18px;cursor:pointer;text-decoration:none}'+
  '.sp-btn.ol{background:#fff;color:#141210;box-shadow:inset 0 0 0 2px #141210}'+
  '.sp-no{background:none;border:0;padding:6px 0;font:500 14px "Archivo",sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer;color:#141210;margin-top:10px}'+
  '.sp-fine{font-size:12px;margin-top:16px!important;opacity:.8}'+
  '.sp-x{position:absolute;top:12px;right:12px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.15)}'+
  '.sp-err{color:#b3261e;font-size:14px;font-weight:600;min-height:1em;margin:0!important}'+
  '.sp-bottle{position:relative;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 14px 22px rgba(20,18,16,.25));touch-action:none;user-select:none;-webkit-user-select:none}'+
  '.sp-cap{width:46px;height:30px;background:#141210;border-radius:5px 5px 2px 2px}'+
  '.sp-neck{width:58px;height:38px;background:linear-gradient(90deg,rgba(255,255,255,.55),rgba(255,255,255,.85) 40%,rgba(255,255,255,.5));border-left:2px solid rgba(20,18,16,.15);border-right:2px solid rgba(20,18,16,.15)}'+
  '.sp-body{position:relative;width:200px;height:220px;border-radius:46px 46px 22px 22px;overflow:hidden;background:#fff;border:3px solid rgba(255,255,255,.9)}'+
  '.sp-label{position:absolute;inset:0;display:grid;place-content:center;gap:6px;text-align:center;background:#fff}'+
  '.sp-label small{font-size:12px;font-weight:600;color:#5b574f;line-height:1.3}'+
  '.sp-prize,.sp-codebox{display:grid;gap:6px;justify-items:center}.sp-codebox{display:none}'+
  '.sp-prize b{font-size:72px;line-height:.9;font-weight:800;font-variation-settings:"wdth" 125}'+
  '.sp-pop.sent .sp-prize{display:none}.sp-pop.sent .sp-codebox{display:grid}'+
  '.sp-pop.revealed .sp-body{animation:sp-wig .6s ease}@keyframes sp-wig{0%,100%{transform:none}25%{transform:rotate(-4deg)}60%{transform:rotate(3deg)}}'+
  '.sp-code{font-size:34px;font-weight:800;font-variation-settings:"wdth" 125;letter-spacing:.02em;border:2px dashed #141210;border-radius:8px;padding:6px 12px}'+
  '.sp-foil{position:absolute;inset:0;width:100%;height:100%;cursor:grab;transition:opacity .5s}.sp-foil.gone{opacity:0;pointer-events:none}'+
  '@media(max-width:640px){.sp-box{grid-template-columns:1fr}.sp-pic{display:none}.sp-side{padding:34px 20px 22px}.sp-side h2{font-size:34px!important}.sp-body{width:180px;height:190px}.sp-prize b{font-size:60px}}'+
  '@media(prefers-reduced-motion:reduce){.sp-pop[open],.sp-pop.revealed .sp-body{animation:none}}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var X='<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2"/></svg>';
  var tab=document.createElement('div');tab.className='sp-tab';tab.hidden=true;
  tab.innerHTML='<button class="sp-open" type="button" aria-haspopup="dialog"><span>🍍 Kras &amp; win</span></button><button class="sp-x2" type="button" aria-label="Verbergen"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6"/></svg></button>';
  var pop=document.createElement('dialog');pop.className='sp-pop';pop.setAttribute('aria-labelledby','sp-title');
  pop.innerHTML='<div class="sp-box"><button class="sp-x" type="button" data-close aria-label="Sluiten">'+X+'</button>'+
    '<div class="sp-pic"><img src="/campaign-assets/popup-brother.jpg" alt="" loading="lazy" width="784" height="1400"><span class="sp-badge">🍍 Tot aan de toog!</span></div>'+
    '<div class="sp-side">'+
      '<div class="sp-head sp-h1"><div class="sp-kicker">Welkom aan de toog</div><h2 id="sp-title">Kras de <span>fles.</span></h2><p>Wrijf met je vinger of muis over het etiket en ontdek je korting.</p></div>'+
      '<div class="sp-head sp-h2" role="status"><div class="sp-kicker">Proficiat!</div><h2>5% <span>korting.</span></h2><p>Vul je e-mailadres in en je ziet meteen je code.</p></div>'+
      '<div class="sp-head sp-h3" role="status"><div class="sp-kicker">Je bent ingeschreven</div><h2>Hier is je <span>code.</span></h2><p>Gebruik ze bij het afrekenen in de webshop.</p></div>'+
      '<div class="sp-bottle" aria-label="Kraskaart in de vorm van een fles Pinacello"><div class="sp-cap"></div><div class="sp-neck"></div><div class="sp-body"><div class="sp-label">'+
        '<div class="sp-prize"><b>5%</b><small>korting op je<br>eerste bestelling</small></div>'+
        '<div class="sp-codebox"><small>Jouw code</small><strong class="sp-code">'+CODE+'</strong><small>5% op je eerste bestelling</small></div>'+
      '</div><canvas class="sp-foil" aria-hidden="true"></canvas></div></div>'+
      '<button class="sp-no sp-reveal" type="button">Lukt krassen niet? Toon mijn korting</button>'+
      '<form class="sp-form"><label for="sp-mail" style="position:absolute;left:-9999px">Je e-mailadres</label><input id="sp-mail" type="email" placeholder="jij@voorbeeld.be" autocomplete="email" required><button class="sp-btn" type="submit">Toon mijn code</button><p class="sp-err" role="alert"></p></form>'+
      '<div class="sp-after"><button class="sp-btn" type="button" data-copy>Kopieer code</button><a class="sp-btn ol" href="https://www.pinacello.com/shop">Shop nu</a></div>'+
      '<button class="sp-no sp-skip" type="button" data-close>Nee bedankt</button>'+
      '<p class="sp-fine">Enkel voor 18+. Met je e-mailadres schrijf je je in op onze nieuwsbrief. Uitschrijven kan altijd.</p>'+
    '</div></div>';

  function init(){
    document.body.appendChild(tab);document.body.appendChild(pop);
    var KEY='pinacello-pop-seen',TABOFF='pinacello-tab-off';
    function get(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
    function set(k){try{sessionStorage.setItem(k,'1')}catch(e){}}
    var shown=false;
    function open(){if(shown||(get(KEY)&&!force)||pop.open)return;shown=true;set(KEY);pop.showModal();requestAnimationFrame(paint);}
    window.pinaScratchOpen=function(){shown=true;set(KEY);tab.hidden=true;if(!pop.open)pop.showModal();requestAnimationFrame(paint);};
    setTimeout(open,force?300:8000);
    addEventListener('scroll',function(){if(scrollY>document.body.scrollHeight*.45)open();},{passive:true});
    document.addEventListener('mouseout',function(e){if(!e.relatedTarget&&e.clientY<8)open();});
    pop.addEventListener('click',function(e){if(e.target===pop||e.target.closest('[data-close]'))pop.close();});
    function showTab(){if(get(TABOFF))return;tab.querySelector('span').textContent=pop.classList.contains('sent')?'🍍 Jouw code':pop.classList.contains('revealed')?'🍍 Claim je 5%':'🍍 Kras & win';tab.hidden=false;}
    pop.addEventListener('close',showTab);if(get(KEY)&&!force)showTab();
    tab.querySelector('.sp-open').addEventListener('click',window.pinaScratchOpen);
    tab.querySelector('.sp-x2').addEventListener('click',function(){tab.hidden=true;set(TABOFF);});

    var form=pop.querySelector('.sp-form'),err=pop.querySelector('.sp-err');
    form.addEventListener('submit',async function(e){
      e.preventDefault();var email=pop.querySelector('#sp-mail').value.trim(),btn=form.querySelector('button');
      btn.disabled=true;btn.textContent='Even geduld…';err.textContent='';
      try{
        var r=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,source:'promo-popup'})});
        var d=await r.json();if(!d.ok)throw new Error(d.error||'failed');
        pop.classList.add('sent');pop.querySelector('[data-copy]').focus();
        if(typeof gtag==='function')gtag('event','generate_lead',{form_id:'scratch-popup',lead_source:'scratch_popup'});
        if(typeof fbq==='function')fbq('track','Lead',{content_name:'Nieuwsbrief'});
      }catch(x){err.textContent=d&&d.error==='invalid_email'?'Dat e-mailadres klopt niet.':'Dat lukte niet. Probeer het nog eens.';btn.disabled=false;btn.textContent='Toon mijn code';}
    });
    pop.querySelector('[data-copy]').addEventListener('click',async function(e){
      try{await navigator.clipboard.writeText(CODE);e.target.textContent='Gekopieerd!';}catch(x){e.target.textContent=CODE;}
    });

    var foil=pop.querySelector('.sp-foil'),ctx=foil.getContext('2d'),drawing=false,last=null,done=false,moves=0;
    function paint(){
      if(!foil.offsetWidth||foil.dataset.p)return;foil.dataset.p='1';
      var dpr=devicePixelRatio||1,w=foil.offsetWidth,h=foil.offsetHeight;
      foil.width=w*dpr;foil.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
      var g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#F4B400');g.addColorStop(.45,'#FFD54F');g.addColorStop(1,'#E9A800');
      ctx.globalCompositeOperation='source-over';ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(w*.14,0,8,h);
      ctx.fillStyle='#141210';ctx.textAlign='center';ctx.font='800 13px Archivo, sans-serif';ctx.fillText('🍍  KRAS HIER  🍍',w/2,h-26);
      var logo=new Image();logo.onload=function(){if(done)return;var lw=w*.78,lh=lw*logo.height/logo.width;ctx.globalCompositeOperation='source-over';ctx.drawImage(logo,(w-lw)/2,h*.38-lh/2,lw,lh);};
      logo.src='/brand-assets/pinacello-logo.png';
    }
    function pos(e){var r=foil.getBoundingClientRect(),s=foil.offsetWidth/r.width;return{x:(e.clientX-r.left)*s,y:(e.clientY-r.top)*s};}
    function scratch(p){ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=34;
      ctx.beginPath();ctx.moveTo((last||p).x,(last||p).y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;if(++moves%12===0)check();}
    function check(){var d=ctx.getImageData(0,0,foil.width,foil.height).data,c=0;for(var i=3;i<d.length;i+=64)if(d[i]===0)c++;if(c/(d.length/64)>.5)reveal();}
    function reveal(){if(done)return;done=true;foil.classList.add('gone');pop.classList.add('revealed');setTimeout(function(){pop.querySelector('#sp-mail').focus({preventScroll:true});},650);}
    foil.addEventListener('pointerdown',function(e){drawing=true;last=null;foil.setPointerCapture(e.pointerId);scratch(pos(e));});
    foil.addEventListener('pointermove',function(e){if(drawing)scratch(pos(e));});
    ['pointerup','pointercancel'].forEach(function(t){foil.addEventListener(t,function(){drawing=false;last=null;});});
    pop.querySelector('.sp-reveal').addEventListener('click',reveal);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
