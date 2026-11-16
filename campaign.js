// Shared behaviour for campaign pages (/black-friday, /kerst-triopakket):
// copy-to-clipboard coupon and shop_click / InitiateCheckout tracking for webshop links.
(function(){
  var landing=document.body.getAttribute('data-landing')||'campaign';

  // Coupon copy: confirm only after the clipboard accepted it; otherwise select the code.
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var code=btn.getAttribute('data-copy');
      var status=document.getElementById(btn.getAttribute('aria-describedby'));
      function say(text){if(status)status.textContent=text;}
      function fallback(){
        try{var r=document.createRange();r.selectNodeContents(btn.querySelector('strong'));
          var s=window.getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}
        say('Vul '+code+' in bij het afrekenen.');
      }
      if(navigator.clipboard&&window.isSecureContext){
        navigator.clipboard.writeText(code).then(function(){say('Gekopieerd! Plak '+code+' bij het afrekenen.');},fallback);
      }else fallback();
      if(typeof gtag==='function')gtag('event','coupon_copy',{landing_page:landing,coupon:code});
    });
  });

  // Outbound webshop clicks: same shop_click event and parameters as the flavour pages.
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[data-placement]');
    if(!a||e.defaultPrevented)return;
    var url=new URL(a.href,window.location.href);
    if(url.hostname!=='www.pinacello.com')return;
    var product=a.getAttribute('data-product')||'shop';
    if(typeof fbq==='function')fbq('track','InitiateCheckout',{content_name:product,content_ids:[product],content_type:'product'});
    if(typeof gtag!=='function')return;
    var params={send_to:'G-T758CLG2LQ',landing_page:landing,product_id:product,
      link_url:url.origin+url.pathname,link_id:a.id||'',link_text:a.textContent.trim(),
      cta_placement:a.dataset.placement};
    if(e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&
        (!a.target||a.target==='_self')&&!a.hasAttribute('download')){
      e.preventDefault();
      var navigated=false;
      function navigate(){if(!navigated){navigated=true;window.location.assign(a.href);}}
      params.event_callback=navigate;params.event_timeout=200;setTimeout(navigate,200);
    }
    gtag('event','shop_click',params);
  });
})();
