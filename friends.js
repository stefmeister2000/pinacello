(function(){
  'use strict';
  var share=document.getElementById('share'),status=document.getElementById('share-status');
  var form=document.getElementById('friends-form'),submit=document.getElementById('friends-submit'),feedback=document.getElementById('form-status');
  var success=document.getElementById('friends-success'),codeElement=document.getElementById('coupon-code');
  var code='',busy=false;
  var url='https://promo.pinacello.com/drink-with-your-friends';
  share.addEventListener('click',async function(){
    try{
      if(navigator.share){await navigator.share({title:'Drink with your friends — Pinacello',text:'Binnenkort samen iets drinken? Meld je hier aan voor 10% korting. We bestellen elk apart.',url:url});status.textContent='Gedeeld!';}
      else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);status.textContent='Link gekopieerd. Plak hem in een bericht aan je vriend.';}
      else status.textContent='Kopieer deze link en stuur hem door: '+url;
    }catch(error){if(error.name!=='AbortError')status.textContent='Kopieer deze link en stuur hem door: '+url;}
  });
  form.addEventListener('submit',async function(event){
    event.preventDefault();if(busy||!form.reportValidity())return;
    busy=true;submit.disabled=true;submit.textContent='Even aanmelden…';feedback.textContent='';
    var controller=new AbortController();var timer=setTimeout(function(){controller.abort();},40000);
    try{
      var response=await fetch('/api/friends-signup',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({
        name:document.getElementById('friends-name').value.trim(),email:document.getElementById('friends-email').value.trim(),marketing:document.getElementById('friends-marketing').checked,website:document.getElementById('friends-website').value
      })});
      var data=await response.json();
      if(!response.ok||!data.ok||typeof data.code!=='string'||!data.code){
        var messages={invalid_name:'Vul je naam in (maximaal 100 tekens).',invalid_email:'Vul een geldig e-mailadres in.',rate_limited:'Je hebt het te vaak geprobeerd. Probeer het later opnieuw.'};
        feedback.textContent=messages[data.error]||'Aanmelden is nog niet gelukt. Probeer het opnieuw; je gegevens blijven ingevuld.';return;
      }
      code=data.code;codeElement.textContent=code;form.hidden=true;success.hidden=false;success.focus();
      if(typeof gtag==='function')gtag('event','generate_lead',{method:'friends_form',landing_page:'drink-with-your-friends'});
    }catch(error){feedback.textContent='Aanmelden is nog niet gelukt. Controleer je verbinding en probeer opnieuw.';}
    finally{clearTimeout(timer);busy=false;submit.disabled=false;submit.textContent='Ontvang mijn 10% korting ↗';}
  });
  document.getElementById('copy-code').addEventListener('click',async function(){
    if(!code)return;
    var copyStatus=document.getElementById('code-status');
    try{if(!navigator.clipboard||!window.isSecureContext)throw new Error('clipboard_unavailable');await navigator.clipboard.writeText(code);copyStatus.textContent='Code gekopieerd. Vul hem in bij het afrekenen.';}
    catch(error){copyStatus.textContent='Kopieer de code handmatig: '+code;}
  });
  document.addEventListener('click',function(event){
    var link=event.target.closest('a[data-product]');if(!link||event.defaultPrevented)return;
    var params={landing_page:'drink-with-your-friends',product_id:link.dataset.product,cta_placement:'flavour',link_url:link.href};
    if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0){
      event.preventDefault();var navigated=false;function go(){if(!navigated){navigated=true;window.location.assign(link.href);}}
      params.event_callback=go;params.event_timeout=200;setTimeout(go,200);
    }
    if(typeof gtag==='function')gtag('event','shop_click',params);
  });
})();
