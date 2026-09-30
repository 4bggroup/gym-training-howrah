'use strict';
(()=>{
 const photos=[...document.querySelectorAll('main img')].map(img=>({src:img.getAttribute('src'),alt:img.alt,el:img}));
 const viewer=document.querySelector('#photo-viewer');let index=0,origin=null;
 function renderPhoto(){const photo=photos[index];document.querySelector('#photo-full').src=photo.src;document.querySelector('#photo-full').alt=photo.alt;document.querySelector('#photo-caption').textContent=photo.alt;document.querySelector('#photo-count').textContent=`${String(index+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;}
 photos.forEach((photo,i)=>{const parent=photo.el.parentElement;parent.classList.add('photo-container');const button=document.createElement('button');button.type='button';button.className='photo-open';button.textContent='View photo';button.setAttribute('aria-label','View photo: '+photo.alt);button.addEventListener('click',()=>{origin=button;index=i;renderPhoto();viewer.showModal();});parent.append(button);});
 document.querySelector('.photo-close').addEventListener('click',()=>viewer.close());
 document.querySelector('#photo-prev').addEventListener('click',()=>{index=(index+photos.length-1)%photos.length;renderPhoto();});
 document.querySelector('#photo-next').addEventListener('click',()=>{index=(index+1)%photos.length;renderPhoto();});
 viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();document.querySelector('#photo-next').click();}if(e.key==='ArrowLeft'){e.preventDefault();document.querySelector('#photo-prev').click();}});
 viewer.addEventListener('close',()=>origin?.focus({preventScroll:true}));
 viewer.addEventListener('click',e=>{if(e.target===viewer){const box=viewer.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)viewer.close();}});
 const more={
  'Strength training':{fit:'For first-time lifters and regular gym-goers who want to build confidence with resistance training.',first:'Talk about your current experience, the equipment you feel comfortable with and what progress means to you.'},
  'Personal coaching':{fit:'For anyone who values individual attention, clear direction and time to practise technique.',first:'Bring your goals and questions. Discuss the coaching format, session availability and fees before choosing a plan.'},
  'Cardio & conditioning':{fit:'For people looking to build a sustainable movement habit and improve training endurance.',first:'Discuss what you enjoy, your current activity and a sensible starting pace with the studio.'},
  'Functional training':{fit:'For people who enjoy movement variety and practical full-body training.',first:'Ask about the session format, equipment and guidance available for your current experience level.'}
 };
 document.querySelectorAll('[data-program]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.program;document.querySelector('#programme-fit').textContent=more[name].fit;document.querySelector('#programme-first').textContent=more[name].first;document.querySelector('#dialog-start').dataset.selectedProgramme=name;}));
 document.querySelector('#dialog-start').addEventListener('click',e=>{window.dispatchEvent(new CustomEvent('lohaa:programme',{detail:{name:e.currentTarget.dataset.selectedProgramme}}));});
})();
