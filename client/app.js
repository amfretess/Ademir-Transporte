import {initMaps} from './map.js';
import {initCarousels} from './carousel.js';
import {makeRequest} from './communication.js';
import {uiText} from './ui.js';
import {RequestValidationError,validateField,localDate,createSubmissionGuard,safeImageUrl} from './validation.js';
let started=false;
function startSite(){
 if(started)return;started=true;
const lang=document.documentElement.lang==='es'?'es':'pt-BR';
const ui=uiText(lang);
const navButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
function closeNav(){navButton?.setAttribute('aria-expanded','false');nav?.classList.remove('open');}
navButton?.addEventListener('click',()=>{const open=navButton.getAttribute('aria-expanded')!=='true';navButton.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
nav?.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeNav();document.querySelector('.contact-widget')?.removeAttribute('open');document.querySelector('.language-switch')?.removeAttribute('open');}});
document.addEventListener('click',event=>{for(const selector of ['.contact-widget','.language-switch']){const el=document.querySelector(selector);if(el&&!el.contains(event.target))el.removeAttribute('open');}});
const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}});},{threshold:.08}):null;
if(observer&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('will-reveal');observer.observe(el);});
document.querySelectorAll('input[type=date]').forEach(input=>{input.min=localDate();});
document.querySelectorAll('[data-request]').forEach(form=>{
 const result=form.querySelector('.form-result'),submit=form.querySelector('.form-submit');
 const guard=createSubmissionGuard();let busy=false;
 const feedback=document.createElement('p');feedback.className='form-feedback';feedback.hidden=true;feedback.setAttribute('role','status');form.append(feedback);
 const message=error=>error.code==='maxLength'?ui.maxLength(error.limit):(ui[error.code]||ui.pattern);
 const showFeedback=text=>{feedback.textContent=text;feedback.hidden=false;};
 form.querySelectorAll('input,textarea,select').forEach(control=>{
  const check=()=>{
   control.setCustomValidity('');feedback.hidden=true;
   if(control.name==='data')form.elements.horario?.setCustomValidity('');
   if(control.value)try{validateField(control.name,control.value);}catch(error){control.setCustomValidity(message(error));}
  };
  control.addEventListener('input',check);control.addEventListener('change',check);
  control.addEventListener('invalid',()=>{if(control.validity.customError)return;control.setCustomValidity(control.validity.valueMissing?ui.required:control.validity.tooLong?ui.maxLength(control.maxLength):control.type==='tel'?ui.phone:control.validity.rangeOverflow||control.validity.rangeUnderflow?ui.range:ui.pattern);});
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(busy){showFeedback(ui.duplicate);return;}
  if(!form.reportValidity())return;
  let request;
  try{request=makeRequest(form.dataset.request,Object.fromEntries(new FormData(form)),lang);}
  catch(error){
   if(error instanceof RequestValidationError&&form.elements.namedItem(error.field)){const control=form.elements.namedItem(error.field);control.setCustomValidity(message(error));control.reportValidity();}
   else showFeedback(ui.requestError);
   return;
  }
  if(!guard.accept(request.message)){showFeedback(ui.duplicate);return;}
  feedback.hidden=true;busy=true;submit.disabled=true;submit.setAttribute('aria-busy','true');
  result.hidden=false;result.querySelector('a').href=request.url;result.querySelector('pre').textContent=request.message;
  window.open(request.url,'_blank','noopener,noreferrer');
  setTimeout(()=>{busy=false;submit.disabled=false;submit.removeAttribute('aria-busy');},3000);
  result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 });
 form.addEventListener('reset',()=>{guard.reset();feedback.hidden=true;result.hidden=true;result.querySelector('pre').textContent='';result.querySelector('a').removeAttribute('href');form.querySelectorAll('input,textarea,select').forEach(el=>el.setCustomValidity(''));});
 // Native submission remains disabled if the module cannot initialize.
 submit.disabled=false;
});
const privacyDialog=document.querySelector('#privacy-dialog');
document.querySelectorAll('[data-privacy]').forEach(button=>button.addEventListener('click',()=>privacyDialog.showModal()));
privacyDialog?.querySelector('button').addEventListener('click',()=>privacyDialog.close());
privacyDialog?.addEventListener('click',event=>{if(event.target===privacyDialog){const r=privacyDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)privacyDialog.close();}});
document.querySelectorAll('[data-region]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-region]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 const text=document.querySelector('#region-description');let city=button.dataset.region;if(lang==='es'&&city==='Bombinhas e região')city='Bombinhas y alrededores';
 if(text)text.textContent=(button.closest('[data-coverage]').dataset.coverage==='fretes'?ui.coverageFreight:ui.coverageAll)(city);
}));
document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link=>{link.target='_blank';link.rel='noopener noreferrer';});
const galleryDialog=document.querySelector('#gallery-dialog');
if(galleryDialog){
 const full=galleryDialog.querySelector('[data-gallery-full]'),caption=galleryDialog.querySelector('[data-gallery-caption]'),count=galleryDialog.querySelector('[data-gallery-count]');
 let pictures=[],current=0,startX=null;
 const show=index=>{current=(index+pictures.length)%pictures.length;const item=pictures[current];const src=safeImageUrl(item.dataset.full,location.href);if(!src){caption.textContent=ui.imageError;return;}full.src=src;full.alt=item.querySelector('img').alt;caption.textContent=item.dataset.caption;count.textContent=`${current+1} / ${pictures.length}`;};
 document.querySelectorAll('[data-gallery-image]').forEach(button=>button.addEventListener('click',()=>{pictures=[...document.querySelectorAll('[data-gallery-image]')].filter(item=>item.dataset.galleryGroup===button.dataset.galleryGroup);show(pictures.indexOf(button));galleryDialog.showModal();}));
 galleryDialog.querySelector('[data-gallery-close]').addEventListener('click',()=>galleryDialog.close());
 galleryDialog.querySelector('[data-gallery-prev]').addEventListener('click',()=>show(current-1));
 galleryDialog.querySelector('[data-gallery-next]').addEventListener('click',()=>show(current+1));
 galleryDialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});
 galleryDialog.addEventListener('click',event=>{if(event.target===galleryDialog)galleryDialog.close();});
 galleryDialog.addEventListener('touchstart',event=>{startX=event.changedTouches[0].clientX;},{passive:true});
 galleryDialog.addEventListener('touchend',event=>{if(startX!==null){const delta=event.changedTouches[0].clientX-startX;if(Math.abs(delta)>45)show(current+(delta<0?1:-1));startX=null;}},{passive:true});
 full.addEventListener('error',()=>{caption.textContent=ui.imageError;});
}

initMaps(document,lang);
initCarousels(document,lang);
}
if(!['choose','redirect'].includes(document.documentElement.dataset.languageState))startSite();
else document.addEventListener('ademir-language-ready',startSite,{once:true});
