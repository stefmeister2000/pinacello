const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

for(const [page,productId] of [['limoncello','pina-limo'],['ivoir-chocolade-whiskey','coco-ivoir']]){
  test(`${page}: bundle links track the bundle and navigate once`,()=>{
    const html=fs.readFileSync(`${page}.html`,'utf8');
    const href=html.match(/data-placement="bundle" href="([^"]+)"/)[1];
    const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
    const calls=[],pixels=[],timers=[],navigations=[];let onClick;
    vm.runInNewContext(script.slice(script.indexOf('  // The dedicated path')),{
      document:{addEventListener:(_,fn)=>onClick=fn},URL,
      window:{location:{href:`https://promo.pinacello.com/${page}`,assign:url=>navigations.push(url)}},
      gtag:(...args)=>calls.push(args),fbq:(...args)=>pixels.push(args),setTimeout:fn=>timers.push(fn)
    });
    const link={href,id:`${productId}-bundle`,textContent:'Bekijk het pakket',dataset:{placement:'bundle'},hasAttribute:()=>false};
    const event={button:0,target:{closest:()=>link},preventDefault(){this.defaultPrevented=true;}};
    onClick(event);
    assert.equal(event.defaultPrevented,true);
    assert.equal(calls[0][1],'shop_click');
    assert.equal(calls[0][2].product_id,productId);
    assert.equal(calls[0][2].cta_placement,'bundle');
    assert.equal(pixels[0][2].content_ids[0],productId);
    calls[0][2].event_callback();timers[0]();
    assert.deepEqual(navigations,[href]);
  });
}
