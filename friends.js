(function(){
  'use strict';
  var share=document.getElementById('share'),status=document.getElementById('share-status');
  var url='https://promo.pinacello.com/drink-with-your-friends';
  share.addEventListener('click',async function(){
    try{
      if(navigator.share){await navigator.share({title:'Drink with your friends — Pinacello',text:'Binnenkort samen iets drinken? Met FRIENDS10 krijgen we allebei 10% korting. We bestellen elk apart.',url:url});status.textContent='Gedeeld!';}
      else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);status.textContent='Link gekopieerd. Plak hem in een bericht aan je vriend.';}
      else status.textContent='Kopieer deze link en stuur hem door: '+url;
    }catch(error){if(error.name!=='AbortError')status.textContent='Kopieer deze link en stuur hem door: '+url;}
  });
  document.getElementById('copy-code').addEventListener('click',async function(){
    var feedback=document.getElementById('code-status');
    try{if(!navigator.clipboard||!window.isSecureContext)throw new Error('clipboard_unavailable');await navigator.clipboard.writeText('FRIENDS10');feedback.textContent='FRIENDS10 gekopieerd. Vul de code in bij het afrekenen.';}
    catch(error){feedback.textContent='Kopieer de code handmatig: FRIENDS10';}
  });
  document.addEventListener('click' ,function(event){
    var link=event.target.closest('a[data-product]');if(!link)return;
    var params={landing_page:'drink-with-your-friends',product_id:link.dataset.product,cta_placement:'flavour',link_url:link.href,promotion_name:'friends10'};
    if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0){
      event.preventDefault();var navigated=false;function go(){if(!navigated){navigated=true;window.location.assign(link.href);}}
      params.event_callback=go;params.event_timeout=200;setTimeout(go,200);
    }
    if(typeof gtag==='function')gtag('event','shop_click',params);
  });
})();
