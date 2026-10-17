const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const script=fs.readFileSync('button-experiment.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const clicks=html.slice(html.indexOf('    function fb(ev)'),html.indexOf('\n  })();',html.indexOf('    function fb(ev)')));
function setup({random=0.75,saved,storageFails=false,production=true,search='',observer=true}={}){
  const store=new Map(saved?[['pinacello-experiment-hero_cta_copy_v1',saved]]:[]);
  const calls=[],handlers={},timers=[],navigation=[];
  const label={textContent:'Bestel de zomerfles'};
  const button={id:'atc',dataset:{},querySelector:()=>label,href:'https://www.pinacello.com/product-page/cococello',hasAttribute:()=>false,get textContent(){return label.textContent+' €25,00';}};
  let intersection;
  const document={visibilityState:'visible',getElementById:()=>button,addEventListener:(n,f)=>handlers[n]=f,removeEventListener:n=>delete handlers[n]};
  const window={pinacelloProduction:production,location:{search,href:'https://promo.pinacello.com/',assign:u=>navigation.push(u)},localStorage:{getItem:k=>{if(storageFails)throw Error('denied');return store.get(k)||null;},setItem:(k,v)=>store.set(k,v)}};
  if(observer)window.IntersectionObserver=class{constructor(fn){intersection=fn;}observe(){}disconnect(){}};
  const context={window,document,URL,URLSearchParams,Math:Object.assign(Object.create(Math),{random:()=>random}),Date,gtag:(...args)=>calls.push(args),setTimeout:fn=>timers.push(fn)};
  vm.runInNewContext(script,context);vm.runInNewContext(clicks,context);
  return {window,document,button,label,store,calls,timers,navigation,handlers,
    visible:(ratio=1)=>intersection([{target:button,isIntersecting:ratio>0,intersectionRatio:ratio}]),
    click:(link=button,extra={})=>{const e={target:{closest:()=>link},button:0,preventDefault(){this.defaultPrevented=true;},...extra};handlers.click(e);return e;}};
}
test('50/50 allocation persists across reloads and preserves price/destination',()=>{
  for(const [random,variant,label] of [[0.1,'A','Bestel de zomerfles'],[0.9,'B','Ontdek jouw favoriet']]){
    const s=setup({random});assert.equal(s.button.dataset.variantId,variant);assert.equal(s.label.textContent,label);
    assert.match(s.button.textContent,/€25,00/);assert.match(s.button.href,/cococello$/);
    const reload=setup({random:1-random,saved:s.store.values().next().value});assert.equal(reload.button.dataset.variantId,variant);
  }
});
test('expired assignments are replaced; unavailable storage excludes the visitor',()=>{
  const s=setup({saved:JSON.stringify({variant:'A',expires:0})});assert.equal(s.button.dataset.variantId,'B');
  for(const opts of [{storageFails:true},{saved:'broken'}]){
    const s=setup(opts);s.click();assert.equal(s.label.textContent,'Bestel de zomerfles');assert.equal(s.calls[0][2].variant_id,undefined);
  }
});
test('impression requires 50% visibility in a visible tab and fires only once',()=>{
  const s=setup();assert.equal(s.calls.length,0);s.visible(0.49);assert.equal(s.calls.length,0);
  s.document.visibilityState='hidden';s.visible();assert.equal(s.calls.length,0);
  s.document.visibilityState='visible';s.handlers.visibilitychange();s.visible();s.click();
  assert.equal(s.calls.filter(c=>c[1]==='experiment_impression').length,1);
  assert.equal(s.calls[0][2].experiment_id,'hero_cta_copy_v1');assert.equal(s.calls[0][2].variant_id,'B');
});
test('hero click records exposure before one shop_click, tags variant, and navigates once',()=>{
  const s=setup();assert.equal(s.click().defaultPrevented,true);
  assert.deepEqual(s.calls.map(c=>c[1]),['experiment_impression','shop_click']);
  const params=s.calls[1][2];assert.equal(params.variant_id,'B');assert.equal(params.cta_placement,'hero');
  params.event_callback();s.timers[0]();assert.equal(s.navigation.length,1);
});
test('other links get experiment attribution only after exposure',()=>{
  const s=setup(),other={...s.button,id:'sticky-btn'};s.click(other,{metaKey:true});
  assert.equal(s.calls[0][2].variant_id,undefined);assert.equal(s.calls[0][2].cta_placement,undefined);
  s.visible();s.click(other,{metaKey:true});assert.equal(s.calls.at(-1)[2].variant_id,'B');assert.equal(s.timers.length,0);
});
test('local forced previews do not overwrite assignment; production ignores overrides',()=>{
  const s=setup({production:false,search:'?cta_variant=A'});assert.equal(s.button.dataset.variantId,'A');assert.equal(s.store.size,0);
  assert.equal(setup({search:'?cta_variant=A'}).button.dataset.variantId,'B');
});
test('older browsers count exposure on click without breaking navigation',()=>{
  const s=setup({observer:false});s.click();assert.equal(s.calls[0][1],'experiment_impression');s.timers[0]();assert.equal(s.navigation.length,1);
});
