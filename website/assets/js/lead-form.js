'use strict';
(()=>{
 const form=document.querySelector('#lead-form'),steps=[document.querySelector('#lead-step-1'),document.querySelector('#lead-step-2')],success=document.querySelector('#lead-success');
 const submit=document.querySelector('#lead-submit'),label=document.querySelector('#lead-submit-label'),error=document.querySelector('#lead-error');
 let connected=false,busy=false,enquiry=null;
 function showStep(n){steps.forEach((el,i)=>el.hidden=i!==n);document.querySelector('#step-count').textContent=`STEP 0${n+1} / 02`;document.querySelector('#step-fill').style.width=n?'100%':'50%';document.querySelector('#progress-you').toggleAttribute('aria-current',n===0);document.querySelector('#progress-visit').toggleAttribute('aria-current',n===1);document.querySelector(n?'#progress-visit':'#progress-you').setAttribute('aria-current','step');steps[n].querySelector('input,select').focus({preventScroll:true});}
 const validationMessages={name:'Please enter your name (at least 2 characters).',phone:'Enter a valid 10-digit Indian mobile number; +91 is optional.',goal:'Choose the training goal you want to discuss.',email:'Please enter a valid email address, or leave it empty.',area:'Please tell us your area in Howrah.',time:'Choose when you would prefer to be contacted.',consent:'Please agree to be contacted before sending your enquiry.'};
 function validateField(field){
  if(field.name==='website'||field.type==='hidden')return true;
  field.setCustomValidity('');
  if(['name','area'].includes(field.name)&&field.value.trim().length<2)field.setCustomValidity(validationMessages[field.name]);
  const valid=field.checkValidity();let note=document.querySelector('#error-'+field.name);
  if(!note){note=document.createElement('span');note.className='field-error';note.id='error-'+field.name;note.hidden=true;field.closest('label').append(note);}
  field.setAttribute('aria-invalid',String(!valid));field.setAttribute('aria-describedby',note.id);note.textContent=valid?'':validationMessages[field.name]||'Please check this field.';note.hidden=valid;return valid;
 }
 function validateStep(n){let first=null;steps[n].querySelectorAll('input,select,textarea').forEach(field=>{if(!validateField(field)&&!first)first=field;});if(first){if(steps[n].hidden)showStep(n);first.focus({preventScroll:true});return false;}return true;}
 const focusDescriptions={'Build strength':['Strength training','Explore a purposeful routine with technique guidance and progressive training.'],'Improve stamina':['Cardio & conditioning','Find a manageable pace and movement you can return to each week.'],'Start training for the first time':['A guided first visit','Meet the space, ask your questions and learn where to begin.'],'Return after a break':['A confident restart','Discuss your experience and rebuild a training rhythm at your pace.'],'Personal coaching':['One-to-one guidance','Talk about individual attention, movement technique and your goals.']};
 function updateFocus(){const selected=focusDescriptions[form.elements.goal.value];document.querySelector('#training-preview-title').textContent=selected?selected[0]:'Let’s find your starting point';document.querySelector('#training-preview-description').textContent=selected?selected[1]:'Choose a goal below. We’ll keep it in view as you plan your visit.';}
 form.querySelectorAll('input,select,textarea').forEach(field=>{field.addEventListener('blur',()=>{if(field.name!=='website')validateField(field);});field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')validateField(field);});});
 form.elements.goal.addEventListener('change',()=>{form.elements.programme.value='';updateFocus();});
 window.addEventListener('lohaa:programme',event=>{const name=event.detail?.name;const goals={'Strength training':'Build strength','Personal coaching':'Personal coaching','Cardio & conditioning':'Improve stamina','Functional training':'Improve stamina'};if(!goals[name]||busy)return;form.hidden=false;success.hidden=true;form.elements.goal.value=goals[name];form.elements.programme.value=name;updateFocus();document.querySelector('#training-preview-title').textContent=name;showStep(0);});
 
 document.querySelector('#lead-next').addEventListener('click',()=>{if(validateStep(0))showStep(1);});
 document.querySelector('#lead-back').addEventListener('click',()=>showStep(0));
 // Inactive step controls still validate before submission; hide no invalid fields from the user.
 form.noValidate=true;
 form.addEventListener('keydown',e=>{if(e.key==='Enter'&&!steps[0].hidden&&e.target.tagName!=='TEXTAREA'){e.preventDefault();document.querySelector('#lead-next').click();}});
 async function checkConnection(){if(!/^https?:$/.test(location.protocol))return;try{const res=await fetch('api/health',{cache:'no-store',signal:AbortSignal.timeout(4000)});const data=await res.json();if(res.ok&&data.service==='lohaa-leads'&&data.ready){connected=true;label.textContent='Send my enquiry';document.querySelector('#lead-mode').textContent='Send your enquiry to LOHAA. The studio will confirm availability with you.';}}catch{/* Static preview stays fully usable without pretending a submission. */}}
 checkConnection();
 document.querySelectorAll('[data-lead-goal]').forEach(a=>a.addEventListener('click',()=>{const map={strength:'Build strength',energy:'Improve stamina',beginner:'Personal coaching'};if(!busy){form.hidden=false;success.hidden=true;steps[0].hidden=false;steps[1].hidden=true;form.elements.goal.value=map[a.dataset.leadGoal]||'';form.elements.programme.value='';updateFocus();validateField(form.elements.goal);document.querySelector('#step-count').textContent='STEP 01 / 02';document.querySelector('#step-fill').style.width='50%';document.querySelector('#progress-you').setAttribute('aria-current','step');document.querySelector('#progress-visit').removeAttribute('aria-current');}}));
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;error.hidden=true;
  if(!validateStep(0))return;if(!validateStep(1))return;
  enquiry=Object.fromEntries(new FormData(form));enquiry.consent=form.elements.consent.checked;enquiry.createdAt=new Date().toISOString();
  busy=true;submit.disabled=true;document.querySelector('.submit-spinner').hidden=false;label.textContent=connected?'Sending…':'Preparing…';
  try{
   let reference='';
   if(connected){const res=await fetch('api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(enquiry),signal:AbortSignal.timeout(15000)});let data;try{data=await res.json();}catch{throw new Error('The server could not accept this enquiry. Your details are still here; please try again.');}if(!res.ok||!data.ok)throw new Error(data.error||'Your enquiry could not be saved. Please try again.');reference=data.reference;enquiry.reference=reference;}
   enquiry.delivery=connected?'Saved by the studio server':'Preview only — not submitted';
   document.querySelector('#success-eyebrow').textContent=connected?'ENQUIRY RECEIVED':'PREVIEW ENQUIRY';document.querySelector('#success-title').textContent=connected?'YOUR FIRST STEP IS IN.':'YOUR ENQUIRY IS READY.';
   document.querySelector('#success-message').textContent=connected?`Your enquiry has been saved. Reference: ${reference}. A visit is not confirmed until the studio contacts you.`:'Download your enquiry copy below. This preview has not sent your details or reserved a visit.';
   const summary=document.querySelector('#lead-summary');summary.replaceChildren();for(const [key,value] of [['Name',enquiry.name],['Goal',enquiry.goal],['Area',enquiry.area],['Contact time',enquiry.time]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;row.append(dt,dd);summary.append(row);}
   form.hidden=true;success.hidden=false;document.querySelector('#step-count').textContent=connected?'RECEIVED':'NOTE READY';document.querySelector('#step-fill').style.width='100%';success.focus({preventScroll:true});
  }catch(err){error.textContent=err.name==='TimeoutError'?'The connection timed out. Your enquiry may have arrived; contact the studio before sending again.':err.message;error.hidden=false;}
  finally{busy=false;submit.disabled=false;document.querySelector('.submit-spinner').hidden=true;label.textContent=connected?'Send my enquiry':'Create enquiry note';}
 });
 document.querySelector('#lead-download').addEventListener('click',()=>{if(!enquiry)return;const lines=['LOHAA — STRENGTH STUDIO, HOWRAH','TRAINING ENQUIRY','',`Status: ${enquiry.delivery}`,`Reference: ${enquiry.reference||'Preview only'}`,`Name: ${enquiry.name}`,`Mobile: ${enquiry.phone}`,`Email: ${enquiry.email||'Not supplied'}`,`Area: ${enquiry.area}`,`Goal: ${enquiry.goal}`,`Programme: ${enquiry.programme||'To discuss'}`,`Preferred contact time: ${enquiry.time}`,`Message: ${enquiry.message||'None'}`,'','This enquiry does not confirm a studio visit.'];const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='LOHAA-training-enquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 document.querySelector('#lead-another').addEventListener('click',()=>{form.reset();form.querySelectorAll('[aria-invalid]').forEach(field=>{field.setCustomValidity('');field.removeAttribute('aria-invalid');});form.querySelectorAll('.field-error').forEach(note=>note.hidden=true);form.hidden=false;success.hidden=true;enquiry=null;updateFocus();showStep(0);});
})();
