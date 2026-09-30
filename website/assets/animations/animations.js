'use strict';
(()=>{
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 if('IntersectionObserver' in window&&!reduce.matches){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.07});
  document.querySelectorAll('.section-heading,.about-copy,.about-image,.program,.steps article,.space-details>div,.plan,.enquiry-intro,.lead-card').forEach(el=>{const siblings=[...el.parentElement.children];el.style.setProperty('--reveal-delay',Math.min(siblings.indexOf(el)%4,3)*65+'ms');el.classList.add('reveal-ready');observer.observe(el);});
  reduce.addEventListener('change',()=>{if(reduce.matches){document.querySelectorAll('.reveal-ready').forEach(el=>el.classList.add('is-visible'));observer.disconnect();}});
 }
 const floating=document.querySelector('.mobile-enquiry');const enquiry=document.querySelector('#enquiry');const footer=document.querySelector('footer');
 let inEnquiry=false,inFooter=false,queued=false;
 function updateFloating(){queued=false;const active=window.scrollY>420&&!inEnquiry&&!inFooter;floating.classList.toggle('is-active',active);floating.setAttribute('aria-hidden',String(!active));floating.querySelector('a').tabIndex=active?0:-1;}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.target===enquiry)inEnquiry=entry.isIntersecting;if(entry.target===footer)inFooter=entry.isIntersecting;});updateFloating();});observer.observe(enquiry);observer.observe(footer);}
 window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateFloating);}},{passive:true});updateFloating();
 const links=[...document.querySelectorAll('#navigation a')];
 if('IntersectionObserver' in window){const sections=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(link=>{const current=link.hash==='#'+entry.target.id;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}});},{rootMargin:'-15% 0px -55% 0px'});links.forEach(link=>{const el=document.querySelector(link.hash);if(el)sections.observe(el);});}
})();
