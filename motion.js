(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!reduced.matches && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.bundle,.serve-card,.other-product,.rev,.craft-item,.brothers-gallery figure,section h2,.usp-item,.collection-card,.photos .photo,.moment-card,.faq details,.markets,.final').forEach((el,i)=>{
   if(el.getBoundingClientRect().top>innerHeight*.92){el.style.setProperty('--reveal-delay',`${i%4*70}ms`);el.classList.add('motion-ready');observer.observe(el)}
  });
  reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();document.querySelectorAll('.motion-ready').forEach(e=>e.classList.add('is-visible'))}});
 }
 const hero=document.querySelector('.hero');
 document.querySelectorAll('[data-flavor]').forEach(a=>a.addEventListener('click',()=>{hero.classList.remove('is-switching');requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.add('is-switching')))}));
 const modal=document.getElementById('promo');
 if(modal){modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...modal.querySelectorAll('button,input,a[href]')].filter(el=>el.getClientRects().length&&!el.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}})}
 // Gentle parallax on the homepage founders photo.
 const heroImg=document.querySelector('.hero-photo-v2 img');
 if(heroImg&&!reduced.matches){let ticking=false;const move=()=>{const y=Math.min(scrollY,700);heroImg.style.transform=`translateY(${y*0.06}px) scale(1.06)`;ticking=false};
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(move)}},{passive:true});move()}
})();
