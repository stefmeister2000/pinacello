// Buy buttons that point at a shop product page go to /bestel instead, which opens the Wix checkout
// directly (with the chosen quantity). Runs after the page's own click tracking: tracking still sees
// the original product URL, and its delayed navigation picks up the rewritten href.
(function(){
  var PRODUCT=/^\/product-page\/([a-z0-9-]+)\/?$/;
  function target(a){
    var url;try{url=new URL(a.href,location.href);}catch(e){return null;}
    if(!/(^|\.)pinacello\.com$/.test(url.hostname)||url.hostname===location.hostname)return null;
    var m=url.pathname.match(PRODUCT);if(!m)return null;
    var q=1;
    if(a.id==='atc'||a.id==='sticky-btn'){var v=document.getElementById('q-val');q=parseInt(v&&v.textContent,10)||1;}
    return '/bestel?p='+m[1]+(q>1?'&q='+q:'');
  }
  window.addEventListener('click',function(e){
    if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
    var to=target(a);if(!to)return;
    if(e.defaultPrevented){var was=a.href;a.href=to;setTimeout(function(){a.href=was;},3000);return;}   // tracking navigates itself a moment later
    e.preventDefault();location.assign(to);
  });
})();
