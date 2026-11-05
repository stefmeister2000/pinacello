const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createFriendsSignup}=require('../friends-signup.cjs');
const fs=require('node:fs');
const vm=require('node:vm');
function setup({failAt=0,throwAt=0}={}){
 const calls=[];let count=0;
 const handler=createFriendsSignup({apiKey:()=> 'test-us16',resolveList:async()=> 'audience',mcUrl:(_key,path)=>path,mcAuth:()=> 'test',clientKey:()=> 'local-client',now:()=>Date.parse('2026-11-05T10:00:00Z'),fetchImpl:async(url,options)=>{calls.push({url,...options,body:JSON.parse(options.body)});count++;if(count===throwAt)throw new Error('offline');return {ok:count!==failAt,status:count===failAt?500:200};}});
 async function request(body,origin='https://promo.pinacello.com'){
  const res={statusCode:200,headers:{},set(k,v){this.headers[k]=v;return this;},status(s){this.statusCode=s;return this;},json(value){this.body=value;return this;}};
  await handler({body,get:n=>n==='origin'?origin:n==='host'?'promo.pinacello.com':undefined},res);return res;
 }
 return {calls,request};
}
const valid={name:'  Test Naam ',email:' TEST@example.com ',marketing:false};
test('saves normalized name/email, campaign tag and consent before releasing code',async()=>{
 const s=setup();const res=await s.request(valid);
 assert.equal(res.statusCode,200);assert.equal(res.body.code,'FRIENDS');assert.equal(res.headers['Cache-Control'],'no-store');
 assert.equal(s.calls.length,3);assert.equal(s.calls[0].body.email_address,'test@example.com');assert.equal(s.calls[0].body.merge_fields.FNAME,'Test Naam');
 assert.equal(s.calls[0].body.status_if_new,'transactional');assert.equal(s.calls[0].body.status,undefined);
 assert.deepEqual(s.calls[1].body.tags,[{name:'drink-with-your-friends',status:'active'}]);
 const note=JSON.parse(s.calls[2].body.note);assert.equal(note.marketing_opt_in,false);assert.equal(note.submitted_at,'2026-11-05T10:00:00.000Z');
});
test('only explicit marketing opt-in subscribes new contacts, without changing existing status',async()=>{
 for(const marketing of [true,false,'true',undefined]){const s=setup();await s.request({...valid,marketing});assert.equal(s.calls[0].body.status_if_new,marketing===true?'subscribed':'transactional');assert.equal(s.calls[0].body.status,undefined);}
});
test('invalid input and foreign origins never call Mailchimp or reveal code',async()=>{
 for(const body of [{...valid,name:''},{...valid,name:[]},{...valid,email:12},{...valid,email:'bad'},{...valid,website:'spam'}]){const s=setup();const r=await s.request(body);assert.equal(r.statusCode,400);assert.equal(r.body.code,undefined);assert.equal(s.calls.length,0);}
 const s=setup();assert.equal((await s.request(valid,'https://other.test')).statusCode,403);assert.equal(s.calls.length,0);
});
test('Mailchimp member, tag, note or network failures keep coupon gated',async()=>{
 for(const options of [{failAt:1},{failAt:2},{failAt:3},{throwAt:1}]){const s=setup(options);const r=await s.request(valid);assert.equal(r.statusCode,502);assert.equal(r.body.code,undefined);}
});
test('rate limit prevents further Mailchimp requests',async()=>{
 const s=setup();for(let i=0;i<10;i++)assert.equal((await s.request(valid)).statusCode,200);
 const res=await s.request(valid);assert.equal(res.statusCode,429);assert.equal(res.body.code,undefined);assert.equal(s.calls.length,30);
});
function browserSetup(response){
 const elements={},events=[],sent=[];
 function el(id){return elements[id]??={hidden:id==='friends-success',value:'',checked:false,handlers:{},textContent:'',addEventListener(n,fn){this.handlers[n]=fn;},focus(){this.focused=true;},reportValidity(){return true;}};}
 el('friends-name').value='Test Naam';el('friends-email').value='test@example.com';
 vm.runInNewContext(fs.readFileSync('friends.js','utf8'),{document:{getElementById:el,addEventListener(){}},navigator:{},window:{},AbortController,setTimeout:()=>1,clearTimeout(){},gtag:(...args)=>events.push(args),fetch:async(url,options)=>{sent.push({url,...options});return response;}});
 return {elements,events,sent,submit:()=>el('friends-form').handlers.submit({preventDefault(){}})};
}
test('browser reveals only server-confirmed code and keeps PII out of analytics',async()=>{
 const s=browserSetup({ok:true,json:async()=>({ok:true,code:'TEST-COUPON'})});await s.submit();
 assert.equal(s.elements['coupon-code'].textContent,'TEST-COUPON');assert.equal(s.elements['friends-success'].hidden,false);assert.equal(s.elements['friends-form'].hidden,true);assert.equal(s.elements['friends-success'].focused,true);
 assert.equal(JSON.parse(s.sent[0].body).name,'Test Naam');assert.doesNotMatch(JSON.stringify(s.events),/Test Naam|test@example/);
});
test('browser failure leaves fields retryable and does not reveal or track a lead',async()=>{
 for(const response of [{ok:false,json:async()=>({ok:false,error:'mailchimp_failed'})},{ok:true,json:async()=>({ok:true})}]){
  const s=browserSetup(response);await s.submit();assert.equal(s.elements['friends-success'].hidden,true);assert.equal(s.elements['friends-submit'].disabled,false);assert.equal(s.elements['friends-email'].value,'test@example.com');assert.equal(s.events.length,0);
 }
});
test('public page and browser script do not expose coupon before registration',()=>{
 const html=fs.readFileSync('drink-with-your-friends.html','utf8'),js=fs.readFileSync('friends.js','utf8');
 assert.doesNotMatch(html+js,/FRIENDS(?:10)?/);assert.match(html,/id="friends-success" hidden/);assert.match(html,/id="friends-marketing"/);assert.doesNotMatch(html,/id="friends-marketing"[^>]*checked/);
});
