const test=require('node:test'),assert=require('node:assert');
const {createCheckout}=require('../checkout.js');
function res(){return{h:{},set(k,v){this.h[k]=v;return this},redirect(code,url){this.code=code;this.url=url;return this}};}
const quiet={error(){}};
test('/bestel without Wix credentials falls back to the product page',async()=>{
  const r=res();await createCheckout({log:quiet})({query:{p:'cococello'}},r);
  assert.equal(r.code,302);assert.equal(r.url,'https://shop.pinacello.com/product-page/cococello');
});
test('/bestel only accepts known products',async()=>{
  const r=res();await createCheckout({apiKey:'k',siteId:'s',log:quiet})({query:{p:'../../evil'}},r);
  assert.equal(r.url,'https://shop.pinacello.com/shop');
});
test('/bestel creates a checkout with the quantity and redirects to it',async()=>{
  const calls=[];
  const fetchImpl=async(url,opt)=>{calls.push([opt.method,url.replace('https://www.wixapis.com',''),opt.body&&JSON.parse(opt.body),opt.headers]);
    const p=url.replace('https://www.wixapis.com','');
    const json=p==='/stores/v3/products/query'?{products:[{_id:'prod-1'}]}:p==='/ecom/v1/checkouts'?{checkout:{id:'chk-9'}}:{checkoutUrl:'https://shop.pinacello.com/checkout?checkoutId=chk-9'};
    return{ok:true,json:async()=>json};};
  const handler=createCheckout({apiKey:'key',siteId:'site',fetchImpl,log:quiet});
  const r=res();await handler({query:{p:'pina-en-cococello-pakket',q:'3'}},r);
  assert.equal(r.url,'https://shop.pinacello.com/checkout?checkoutId=chk-9');
  const create=calls.find(c=>c[1]==='/ecom/v1/checkouts');
  assert.deepEqual(create[2].lineItems,[{quantity:3,catalogReference:{catalogItemId:'prod-1',appId:'215238eb-22a5-4c36-9e7b-e7c08025e04e'}}]);
  assert.equal(create[3].Authorization,'key');assert.equal(create[3]['wix-site-id'],'site');
  const r2=res();await handler({query:{p:'pina-en-cococello-pakket'}},r2);
  assert.equal(calls.filter(c=>c[1].includes('products/query')).length,1,'product id is cached');
});
test('/bestel falls back to the product page when Wix fails',async()=>{
  const fetchImpl=async()=>({ok:false,status:403,json:async()=>({})});
  const r=res();await createCheckout({apiKey:'k',siteId:'s',fetchImpl,log:quiet})({query:{p:'frambolade'}},r);
  assert.equal(r.url,'https://shop.pinacello.com/product-page/frambolade');
});
