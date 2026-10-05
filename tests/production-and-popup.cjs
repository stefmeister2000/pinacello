const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const pages=['index','calibana','frambolade','gin-o-pomelo','ivoir-chocolade-whiskey',
  'limoncello','privacy','terms','vaquero-rum-likeur','verhaal'];
const liveHosts=['promo.pinacello.com','www.pinacello.com','pinacello.com'];

test('every public page loads tracking only on HTTPS production hosts',()=>{
  const cases=[...liveHosts.map(hostname=>({hostname,protocol:'https:',live:true})),
    ...['localhost','127.0.0.1','::1','preview.pinacello.com','pinacello.com.example.org']
      .map(hostname=>({hostname,protocol:'https:',live:false})),
    {hostname:'promo.pinacello.com',protocol:'http:',live:false},
    {hostname:'',protocol:'file:',live:false}];
  for(const page of pages){
    const html=fs.readFileSync(page+'.html','utf8');
    const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
      .map(m=>m[1]).filter(s=>s.includes("gtag('config'")||s.includes('yo92xb86rr')||s.includes("fbq('init'"));
    assert.equal(scripts.length,3,page);
    assert.ok(!/<(?:script|img)[^>]+src=["']https:\/\/(?:www\.googletagmanager|www\.facebook|www\.clarity)\./.test(html),page);
    for(const c of cases){
      const loaded=[];
      const context={location:c,Date,document:{
        createElement:()=>({}),head:{appendChild:el=>loaded.push(el.src)},
        getElementsByTagName:()=>[{parentNode:{insertBefore:el=>loaded.push(el.src)}}]
      }};
      context.window=context;
      vm.createContext(context);
      for(const script of scripts)vm.runInContext(script,context);
      context.gtag('event','generate_lead');
      context.fbq('track','Lead');
      assert.equal(loaded.length,c.live?3:0,`${page}: ${c.protocol}//${c.hostname}`);
      if(!c.live){assert.equal(context.dataLayer.length,0);assert.equal(context.clarity,undefined);continue;}
      const config=context.dataLayer.find(args=>args[0]==='config');
      assert.equal(config[1],'G-T758CLG2LQ');
      assert.equal(config[2].cookie_domain,'pinacello.com');
      const linker=context.dataLayer.findIndex(args=>args[0]==='set'&&args[1]==='linker');
      assert.ok(linker<context.dataLayer.indexOf(config));
    }
  }
});

const html=fs.readFileSync('index.html','utf8');
const popupStart=html.indexOf('  (function(){',html.indexOf('// ── Nieuwsbrief'));
const popup=html.slice(popupStart,html.indexOf('  // ── Meta Pixel',popupStart));
function setupPopup({clipboard,storageFails=false}={}){
  const elements={},events=[],selected=[],timers=[];
  function element(id){return elements[id]??=(
    {hidden:id==='promo'||id==='promo-success',handlers:{},classList:{add(){},remove(){}},
      addEventListener(name,fn){this.handlers[name]=fn;},focus(){this.focused=true;}});}
  element('promo-email').value='test@example.com';
  element('promo-code').textContent='ZOMER5';
  const submitButton={};
  element('promo-form').querySelector=()=>submitButton;
  const context={document:{getElementById:element,body:element('body'),activeElement:element('before'),
    documentElement:{scrollHeight:1000},addEventListener(){},
    createRange:()=>({selectNodeContents:el=>selected.push(el.textContent)})},
    navigator:{clipboard},localStorage:{getItem(){if(storageFails)throw Error('denied');},
      setItem(){if(storageFails)throw Error('denied');}},
    fetch:async()=>({ok:true,json:async()=>({ok:true})}),
    gtag:(...args)=>events.push(args),setTimeout:fn=>timers.push(fn),clearTimeout(){},
    window:{isSecureContext:true,addEventListener(){},removeEventListener(){},
      getSelection:()=>({removeAllRanges(){},addRange(){}})}};
  vm.runInNewContext(popup,context);
  return {elements,events,selected,timers,context,
    submit:()=>element('promo-form').handlers.submit.call(element('promo-form'),{preventDefault(){}}),
    copy:()=>element('promo-copy').handlers.click()};
}

test('successful signup shows and focuses the code even when storage is unavailable',async()=>{
  const s=setupPopup({storageFails:true});
  s.timers[0]();
  assert.equal(s.elements.promo.hidden,false);
  await s.submit();
  assert.equal(s.elements['promo-body'].hidden,true);
  assert.equal(s.elements['promo-success'].hidden,false);
  assert.equal(s.elements['promo-copy'].focused,true);
  assert.equal(s.events[0][1],'generate_lead');
  s.elements['promo-close'].onclick();
  assert.equal(s.elements.promo.hidden,true);
});

test('copy button copies the code and only then confirms success',async()=>{
  const copied=[];
  const s=setupPopup({clipboard:{writeText:async text=>copied.push(text)}});
  await s.copy();
  assert.deepEqual(copied,['ZOMER5']);
  assert.match(s.elements['promo-copy-status'].textContent,/^Gekopieerd!/);
});

test('missing or rejected clipboard access offers selectable code without false success',async()=>{
  for(const clipboard of [undefined,{writeText:async()=>{throw Error('denied');}}]){
    const s=setupPopup({clipboard});await s.copy();
    assert.deepEqual(s.selected,['ZOMER5']);
    assert.match(s.elements['promo-copy-status'].textContent,/vul ZOMER5 in/);
    assert.doesNotMatch(s.elements['promo-copy-status'].textContent,/^Gekopieerd!/);
  }
});

test('changing flavour keeps the popup shop destination aligned with the product',()=>{
  const start=html.indexOf('  (function(){',html.indexOf('// hero:'));
  const script=html.slice(start,html.indexOf('  // ── Nieuwsbrief',start));
  const elements={};
  const element=id=>elements[id]??={style:{setProperty(){}},classList:{toggle(){}},
    setAttribute(name,value){this[name]=value;},addEventListener(name,fn){this[name]=fn;}};
  const flavours=['pina','coco'].map(key=>({...element(key),dataset:{flavor:key}}));
  vm.runInNewContext(script,{URLSearchParams,window:{location:{search:''}},document:{
    documentElement:element('root'),body:element('body'),getElementById:element,querySelector:element,
    querySelectorAll:selector=>selector==='.flavors a'?flavours:[]}});
  for(const flavour of flavours){
    flavour.click({preventDefault(){}});
    assert.equal(elements['promo-shop'].href,elements.atc.href);
    assert.equal(elements['promo-shop'].href,elements['sticky-btn'].href);
    assert.match(elements['promo-shop'].href,flavour.dataset.flavor==='coco'?/\/cococello$/:/\/kopie-van-pinacello/);
  }
});
