const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=require('node:fs').readFileSync('index.html','utf8');
const lead=html.slice(html.indexOf('    var submitting=false'),html.indexOf('\n  })();',html.indexOf('    var submitting=false')));
const clicks=html.slice(html.indexOf("    function fb(ev)"),html.indexOf('\n  })();',html.indexOf('    function fb(ev)')));
function setup(response={ok:true,json:async()=>({ok:true})}){
 const handlers={},events=[],navigation=[],timers=[];
 const elements={'promo-email':{value:'test@example.com',classList:{add(){},remove(){}},focus(){}},'promo-error':{},'promo-form':{addEventListener:(name,fn)=>handlers[name]=fn}};
 const button={};
 const context={document:{getElementById:id=>elements[id],addEventListener:(name,fn)=>handlers[name]=fn},fetch:async()=>response,localStorage:{setItem(){}},KEY:'test',body:{},success:{},gtag:(...args)=>events.push(args),fbq(){},URL,window:{location:{href:'https://landing.example/',assign:url=>navigation.push(url)}},setTimeout:fn=>timers.push(fn)};
 vm.createContext(context);vm.runInContext(lead,context);vm.runInContext(clicks,context);
 return {handlers,events,navigation,timers,elements,button,context,submit:()=>handlers.submit.call({querySelector:()=>button},{preventDefault(){}})};
}
test('confirmed signup sends one lead without email, including repeated submits',async()=>{
 const s=setup();await Promise.all([s.submit(),s.submit()]);await s.submit();
 assert.equal(s.events.length,1);assert.equal(s.events[0][1],'generate_lead');
 assert.equal(s.events[0][2].send_to,'G-T758CLG2LQ');assert.ok(!JSON.stringify(s.events).includes('@'));
});
test('invalid email and failed signup do not send leads; failure allows retry',async()=>{
 const s=setup({ok:false,json:async()=>({ok:false})});await s.submit();
 assert.equal(s.events.length,0);assert.equal(s.button.disabled,false);assert.equal(s.elements['promo-error'].hidden,false);
 s.elements['promo-email'].value='invalid';await s.submit();assert.equal(s.events.length,0);
 s.elements['promo-email'].value='test@example.com';s.context.fetch=async()=>({ok:true,json:async()=>({ok:true})});await s.submit();assert.equal(s.events.length,1);
});
function click(s,path,extra={}){
 const a={href:'https://www.pinacello.com'+path,id:'atc',textContent:'Bestel nu',hasAttribute:()=>false};
 const e={target:{closest:()=>a},button:0,preventDefault(){this.defaultPrevented=true},...extra};s.handlers.click(e);return e;
}
test('product links send shop_click and wait for callback with a bounded fallback',()=>{
 const s=setup();assert.equal(click(s,'/product-page/cococello?email=private').defaultPrevented,true);
 assert.equal(s.events[0][1],'shop_click');assert.ok(!s.events[0][2].link_url.includes('?'));
 assert.equal(s.navigation.length,0);s.events[0][2].event_callback();s.timers[0]();assert.equal(s.navigation.length,1);
});
test('checkout sends begin_checkout; blocked analytics falls back to navigation',()=>{
 const s=setup();click(s,'/checkout');assert.equal(s.events[0][1],'begin_checkout');s.timers[0]();assert.equal(s.navigation.length,1);
});
test('modified clicks navigate normally; unrelated or prevented clicks are ignored',()=>{
 const s=setup();assert.ok(!click(s,'/shop',{metaKey:true}).defaultPrevented);assert.equal(s.timers.length,0);
 click(s,'/shop',{defaultPrevented:true});assert.equal(s.events.length,1);
 s.handlers.click({target:{closest:()=>null}});assert.equal(s.events.length,1);
});
