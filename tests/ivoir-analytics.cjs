const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=require('node:fs').readFileSync('ivoir-chocolade-whiskey.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const tracking=scripts.at(-1).slice(scripts.at(-1).indexOf('  // The dedicated path'));
function setup(){
  const events=[],timers=[],navigation=[];let listener;
  vm.runInNewContext(tracking,{document:{addEventListener:(type,fn)=>listener=fn},URL,
    window:{location:{href:'https://landing.example/ivoir-chocolade-whiskey',assign:href=>navigation.push(href)}},
    gtag:(...args)=>events.push(args),setTimeout:fn=>timers.push(fn)});
  const a={href:'https://www.pinacello.com/product-page/ivoir-chocolade-whiskey',id:'ivoir-hero-buy',textContent:'Bestel IVOIR',dataset:{placement:'hero'},hasAttribute:()=>false};
  const click=(extra={})=>{const e={button:0,target:{closest:()=>a},preventDefault(){this.defaultPrevented=true;},...extra};listener(e);return e;};
  return {events,timers,navigation,click};
}
test('IVOIR has its own GA4 page path without a duplicate manual page_view',()=>{
  const window={};const calls=[];
  vm.runInNewContext(scripts[1],{window, dataLayer:calls,Date});
  const configs=calls.filter(args=>args[0]==='config');
  assert.equal(configs.length,1);
  assert.equal(configs[0][1],'G-T758CLG2LQ');
  assert.equal(configs[0][2].page_path,'/ivoir-chocolade-whiskey');
  assert.equal(configs[0][2].content_group,'IVOIR');
  assert.equal(calls.filter(args=>args[1]==='page_view').length,0);
});
test('IVOIR CTA records product and placement and navigates only once',()=>{
  const s=setup();assert.equal(s.click().defaultPrevented,true);
  assert.equal(s.events.length,1);assert.equal(s.events[0][1],'shop_click');
  const params=s.events[0][2];
  assert.equal(params.landing_page,'ivoir');assert.equal(params.product_id,'ivoir');assert.equal(params.cta_placement,'hero');
  assert.equal(s.navigation.length,0);params.event_callback();s.timers[0]();assert.equal(s.navigation.length,1);
});
test('blocked analytics falls back and modified clicks retain normal browser behavior',()=>{
  const s=setup();s.click();s.timers[0]();assert.equal(s.navigation.length,1);
  const modified=setup();assert.equal(modified.click({metaKey:true}).defaultPrevented,undefined);assert.equal(modified.timers.length,0);
});
