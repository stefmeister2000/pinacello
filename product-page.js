(function(){
  'use strict';
  const product = JSON.parse(document.getElementById('product-data').textContent);
  const fmt = value => new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR'}).format(value);
  const production = location.protocol === 'https:' && ['promo.pinacello.com','www.pinacello.com','pinacello.com'].includes(location.hostname);
  window.pinacelloProduction = production;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){if(production)window.dataLayer.push(arguments);};
  if (production) {
    const script = (src,attrs={}) => { const s=document.createElement('script');s.async=true;s.src=src;Object.entries(attrs).forEach(([k,v])=>s.setAttribute(k,v));document.head.appendChild(s); };
    gtag('js',new Date());
    gtag('set','linker',{domains:['promo.pinacello.com','www.pinacello.com','pinacello.com']});
    gtag('config','G-T758CLG2LQ',{page_path:location.pathname,content_group:product.name,cookie_domain:'pinacello.com',site_area:'landing'});
    script('https://www.googletagmanager.com/gtag/js?id=G-T758CLG2LQ');
    window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
    script('https://www.googletagmanager.com/gtm.js?id=GTM-WTSPNPPC');
    window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};
    script('https://www.clarity.ms/tag/yo92xb86rr');
    script('/t.js',{'data-site':'cur_rUSdLH_VK1C9hS3Z2RCK1r4lw6DaQ9sG'});
    if(!window.fbq){const n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};window._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];script('https://connect.facebook.net/en_US/fbevents.js');}
    fbq('init','988479144234543');fbq('track','PageView');
    gtag('event','view_item',{currency:'EUR',value:product.priceNow,items:[{item_id:product.id,item_name:product.name,price:product.priceNow,quantity:1}]});
  }
  const quantity=document.getElementById('quantity'), form=document.getElementById('buy-form');
  const unitPrice=()=>Date.now()<product.saleEnd?product.priceNow:product.price;
  function updateQuantity(){
    const q=quantity.valueAsNumber;
    document.querySelector('[data-step="-1"]').disabled=q<=1;
    document.querySelector('[data-step="1"]').disabled=q>=24;
    if(!quantity.checkValidity())return;
    document.querySelector('.buy-total').textContent=fmt(unitPrice()*q);
    document.querySelector('.mobile-total').textContent=fmt(unitPrice()*q)+(q>1?' · '+q+' flessen':'');
  }
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
    quantity.value=Math.min(24,Math.max(1,(Number(quantity.value)||1)+Number(button.dataset.step)));
    updateQuantity();
  }));
  quantity.addEventListener('input',updateQuantity);
  quantity.addEventListener('change',()=>{quantity.value=Math.min(24,Math.max(1,Math.round(Number(quantity.value)||1)));updateQuantity();});
  form.addEventListener('submit',()=>{
    if(!production)return;
    const checkoutUrl=location.origin+'/bestel?p='+encodeURIComponent(product.slug)+'&q='+quantity.value;
    gtag('event','shop_click',{send_to:'G-T758CLG2LQ',landing_page:product.id,product:product.name,product_id:product.id,placement:'product_page',cta_placement:'product_page',link_url:checkoutUrl,outbound_url:checkoutUrl,quantity:Number(quantity.value),transport_type:'beacon'});
    if(typeof window.fbq==='function')fbq('track','InitiateCheckout',{content_name:product.name,content_ids:[product.id],content_type:'product',currency:'EUR',value:unitPrice()*Number(quantity.value),num_items:Number(quantity.value)});
  });
  const mainImage=document.getElementById('main-image'), lightbox=document.querySelector('.lightbox');
  document.querySelectorAll('[data-image]').forEach((button,index)=>button.addEventListener('click',()=>{
    mainImage.src=button.dataset.image;mainImage.alt=button.dataset.alt;
    document.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelector('.gallery-caption span').textContent=String(index+1).padStart(2,'0')+' / '+String(document.querySelectorAll('[data-image]').length).padStart(2,'0');
  }));
  document.querySelector('.hero-image').addEventListener('click',()=>{
    if(typeof lightbox.showModal!=='function')return;
    const image=lightbox.querySelector('img');image.src=mainImage.src;image.alt=mainImage.alt;lightbox.showModal();
  });
  document.querySelector('.close-lightbox').addEventListener('click',()=>lightbox.close());
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
  // Keep prices correct when an open browser crosses the end of the existing offer.
  function expireSale(){
    if(Date.now()<product.saleEnd)return;
    document.querySelectorAll('.sale-only').forEach(el=>el.remove());
    document.querySelector('.announcement').textContent='Zelfgemaakt in Dilbeek · Door twee broers';
    document.querySelectorAll('[data-price]').forEach(el=>el.textContent=fmt(Number(el.dataset.price)));
    const schemaElement=document.getElementById('product-schema');
    const schema=JSON.parse(schemaElement.textContent);schema.offers.price=product.price.toFixed(2);delete schema.offers.priceValidUntil;schemaElement.textContent=JSON.stringify(schema);
    updateQuantity();
  }
  expireSale();
  if(Date.now()<product.saleEnd){const timer=setInterval(()=>{if(Date.now()>=product.saleEnd){expireSale();clearInterval(timer);}},1000);}
})();
