const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const net = require('node:net');
const {once} = require('node:events');
const {products,renderProduct,priceAt,END} = require('../product-pages.cjs');
const {PRODUCTS} = require('../checkout.js');
let child,base;
before(async()=>{
  const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  base='http://127.0.0.1:'+port;
  child=spawn(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:String(port),WIX_API_KEY:'',WIX_SITE_ID:''},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('server did not start')),5000);
    child.stdout.on('data',chunk=>{if(String(chunk).includes('draait op poort')){clearTimeout(timeout);resolve();}});
    child.on('error',reject);
    child.on('exit',code=>{if(code){clearTimeout(timeout);reject(new Error('server exited: '+code));}});
  });
});
after(()=>child?.kill());

test('all eight products use their own checkout item across new and existing URLs',async()=>{
  for(const p of products){
    assert.ok(PRODUCTS.has(p.slug),p.name+' supported by checkout');
    const paths=['/products/'+p.id,'/'+p.id,'/'+p.id+'.html'];
    if(p.id==='pinacello')paths.push('/','/index.html','/?utm_campaign=test');
    if(p.id==='cococello')paths.push('/?smaak=coco','/index.html?smaak=coco');
    for(const path of paths){
      const response=await fetch(base+path);assert.equal(response.status,200,path);
      const html=await response.text();
      const data=JSON.parse(html.match(/id="product-data">([^<]+)<\/script>/)[1]);
      assert.equal(data.id,p.id,path);
      assert.match(html,new RegExp('name="p" value="'+p.slug+'"'));
      assert.match(html,/action="\/bestel" method="get"/);
      assert.match(html,/name="q" type="number" min="1" max="24"/);
      assert.equal((html.match(/<h1 /g)||[]).length,1);
      assert.match(response.headers.get('cache-control'),/no-cache/);
    }
    const checkout=await fetch(base+'/bestel?p='+p.slug+'&q=2',{redirect:'manual'});
    assert.equal(checkout.status,302);
    assert.equal(checkout.headers.get('location'),'https://shop.pinacello.com/product-page/'+p.slug);
  }
});
test('Black Friday expiry updates both visible pricing and product structured data',()=>{
  for(const p of products){
    const before=renderProduct(p,END-1),after=renderProduct(p,END);
    assert.equal(priceAt(p,END),p.price);
    assert.equal(priceAt(p,END-1),p.price*.75);
    const schema=html=>JSON.parse(html.match(/id="product-schema">([^<]+)<\/script>/)[1]);
    assert.equal(Number(schema(before).offers.price),p.price*.75);
    assert.equal(Number(schema(after).offers.price),p.price);
    assert.equal(schema(after).offers.priceValidUntil,undefined);
    assert.ok(!after.includes('Bespaar 25%'));
    assert.ok(!after.includes('BLACK FRIDAY'));
    assert.equal(schema(after).aggregateRating,undefined,'no invented ratings');
  }
});
test('product images, frontend assets and retained campaign routes are served; private source and unknown products are not',async()=>{
  for(const p of products){
    const response=await fetch(base+p.image);assert.equal(response.status,200,p.image);
    assert.match(response.headers.get('content-type'),/image\//);
  }
  for(const path of ['/product-page.js','/product-page.css','/scratch-popup.js','/verhaal','/terms','/privacy','/black-friday','/kerst-triopakket'])assert.equal((await fetch(base+path)).status,200,path);
  for(const path of ['/product-pages.cjs','/server.js','/tests/product-pages.cjs','/products/unknown'])assert.equal((await fetch(base+path)).status,404,path);
});
