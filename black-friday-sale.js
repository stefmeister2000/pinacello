/* Black Friday 2026 on promo.pinacello.com: top bar + band with countdown + -25% prices.
   The discount itself is the automatic BLACKPINA discount in Wix (applied at checkout, no code).
   Switches itself off on 1 December 2026 00:00 (Brussels): then nothing is added. */
(function(){
  var END=Date.parse('2026-12-01T00:00:00+01:00');
  if(Date.now()>=END)return;
  var fmt=new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'});
  function num(t){var m=String(t).replace(/\s/g,'').match(/€?(\d+(?:[.,]\d{1,2})?)/);return m?parseFloat(m[1].replace(',','.')):NaN;}
  function off(v){return Math.round((v-Math.floor(v*25+1e-6)/100)*100)/100;}   // same rounding as Wix

  var css=''+
  '.bf-bar{background:#000;color:#fff;text-align:center;font:600 14px/1.4 "Archivo",system-ui,sans-serif;padding:10px 16px;border-bottom:3px solid #FFC72C}'+
  '.bf-bar strong{color:#FFC72C}.bf-bar .bf-cd{display:inline-block;margin-left:8px;background:#FFC72C;color:#000;border-radius:999px;padding:2px 10px;font-weight:800;font-variant-numeric:tabular-nums}'+
  '.bf-band{background:#000;color:#fff;border-top:3px solid #FFC72C;border-bottom:3px solid #FFC72C;position:relative;overflow:hidden;font-family:"Archivo",system-ui,sans-serif}'+
  '.bf-band::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent 0 22px,rgba(255,199,44,.07) 22px 44px);pointer-events:none}'+
  '.bf-band .in{position:relative;max-width:1360px;margin:0 auto;padding:clamp(22px,3.5vw,40px) clamp(16px,3vw,32px);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(18px,3vw,40px);align-items:center}'+
  '.bf-band .k{display:inline-block;background:#FFC72C;color:#000;font-weight:800;font-size:13px;letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:999px}'+
  '.bf-band h2{margin:12px 0 6px!important;color:#fff!important;font-size:clamp(38px,6vw,76px)!important;line-height:.95!important;font-weight:800!important;font-variation-settings:"wdth" 125;text-transform:none!important;letter-spacing:-.02em!important;font-family:"Archivo",system-ui,sans-serif!important}'+
  '.bf-band h2 em{font-style:normal;color:#FFC72C}'+
  '.bf-band p{margin:0;font-size:clamp(15px,1.4vw,18px);color:rgba(255,255,255,.85)}'+
  '.bf-band .side{display:grid;gap:14px;justify-items:center}'+
  '.bf-band .cd{display:flex;gap:8px}'+
  '.bf-band .cd div{background:#fff;color:#000;border-radius:10px;min-width:66px;padding:10px 6px;text-align:center;font-weight:800;line-height:1}'+
  '.bf-band .cd b{display:block;font-size:30px;font-variant-numeric:tabular-nums;font-variation-settings:"wdth" 125}'+
  '.bf-band .cd span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-top:6px;color:#555}'+
  '.bf-band .go{background:#FFC72C;color:#000;border-radius:999px;padding:15px 30px;font-weight:800;font-size:17px;text-decoration:none;box-shadow:4px 4px 0 #fff}'+
  '.bf-now{color:#b3261e;font-weight:800}.bf-was{font-weight:400;opacity:.6;margin-left:6px;font-size:.7em;text-decoration:line-through}'+
  '.btn .bf-now,.atc .bf-now{color:inherit}'+
  '.www-campaign .hero-band .bf-now{color:#FFC72C}.www-campaign .hero-band .bf-chip{background:#fff;color:#000}'+
  '.bf-chip{display:inline-block;background:#000;color:#FFC72C;font-weight:800;font-size:13px;border-radius:999px;padding:3px 10px;margin-left:8px;vertical-align:middle}'+
  '.bf-on .bundle .save,.bf-on .price-block .save,.bf-on .price-block>s,.bf-on .price-note{display:none!important}'+
  '@media(max-width:760px){.bf-band .in{grid-template-columns:minmax(0,1fr)}.bf-band .side{justify-items:stretch}.bf-band .cd{justify-content:space-between}.bf-band .cd div{flex:1;min-width:0}.bf-band .go{text-align:center}.bf-bar{font-size:12.5px}}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var SEL='#atc-price,.hero-price,.bundle .now,.sticky-cta .p b,.price-block .price';
  function price(el){
    if(el.querySelector('.bf-now'))return;
    var v=num(el.textContent);if(!(v>0))return;
    var big=!el.closest('.btn,.atc,.sticky-cta');
    el.innerHTML='<span class="bf-now">'+fmt.format(off(v))+'</span><span class="bf-was">'+fmt.format(v)+'</span>'+
      (big&&el.matches('.hero-price,.bundle .now,.price-block .price')?'<span class="bf-chip">−25%</span>':'');
  }
  function run(){document.querySelectorAll(SEL).forEach(price);}

  function start(){
    document.documentElement.classList.add('bf-on');
    var bar=document.createElement('div');bar.className='bf-bar';
    bar.innerHTML='<strong>Black Friday: −25% op alles</strong> · automatisch afgetrokken aan de kassa · t/m maandag 30/11<span class="bf-cd"></span>';
    document.body.insertBefore(bar,document.body.firstChild);

    var band=document.createElement('section');band.className='bf-band';band.setAttribute('aria-label','Black Friday');
    band.innerHTML='<div class="in"><div><span class="k">Black Friday · t/m maandag 30/11</span><h2>−25% op <em>alles</em>.</h2>'+
      '<p>Alle flessen en pakketten. Automatisch afgetrokken aan de kassa, geen code nodig.</p></div>'+
      '<div class="side"><div class="cd">'+['dagen','uren','min','sec'].map(function(u){return '<div><b>00</b><span>'+u+'</span></div>';}).join('')+'</div>'+
      '<a class="go" href="https://www.pinacello.com/shop?utm_source=promo&amp;utm_medium=banner&amp;utm_campaign=black-friday-2026">Shop alle deals →</a></div></div>';
    var hero=document.querySelector('header.hero'),aw=document.querySelector('.hero-awning'),main=document.querySelector('main');
    if(hero)hero.after(band);else if(aw)aw.after(band);else if(main)main.insertBefore(band,main.firstChild);

    function tick(){var ms=Math.max(0,END-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
      var v=[d,h,m,s].map(function(n){return String(n).padStart(2,'0');});
      band.querySelectorAll('.cd b').forEach(function(b,i){b.textContent=v[i];});
      bar.querySelector('.bf-cd').textContent='nog '+d+'d '+v[1]+'u '+v[2]+'m';if(!ms)location.reload();}
    tick();setInterval(tick,1000);
    run();
    var busy=false;new MutationObserver(function(){if(busy)return;busy=true;requestAnimationFrame(function(){run();busy=false;});})
      .observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
