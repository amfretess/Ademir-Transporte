import {safeImageUrl} from './validation.js';

export const CAROUSEL_INTERVAL=5000;
export const CAROUSEL_FADE=600;

// One timeout per visible, unpaused carousel; no background polling.
export function createCarouselClock({advance,timeout=setTimeout,cancel=clearTimeout,now=Date.now}){
  const blockers=new Set(['offscreen']);
  let timer=null,disposed=false,advancing=false;
  const stop=()=>{if(timer!==null){cancel(timer);timer=null;}};
  const schedule=(delay=CAROUSEL_INTERVAL)=>{
    stop();
    if(disposed||blockers.size||advancing)return;
    timer=timeout(async()=>{
      timer=null;advancing=true;const started=now();
      try{await advance();}finally{
        advancing=false;const elapsed=now()-started;
        // Normal fades stay on the five-second cadence; slow downloads never create catch-up bursts.
        schedule(elapsed<=CAROUSEL_FADE+150?CAROUSEL_INTERVAL-elapsed:CAROUSEL_INTERVAL);
      }
    },delay);
  };
  return {
    set(reason,blocked){if(blocked===blockers.has(reason))return;if(blocked)blockers.add(reason);else blockers.delete(reason);schedule();},
    reset:schedule,
    dispose(){disposed=true;stop();},
    get running(){return !disposed&&blockers.size===0;},
    get reasons(){return [...blockers];}
  };
}

export function initCarousels(root=document,lang='pt-BR'){
  const es=lang==='es';
  const words=es?{
    pause:'Pausar',resume:'Reanudar',pauseLabel:'Pausar cambio automático',resumeLabel:'Reanudar cambio automático',
    paused:'Cambio automático pausado.',resumed:'Cambio automático habilitado.',error:'No se pudo cargar la fotografía. La imagen actual sigue disponible.',
    slide:(n,total)=>`Fotografía ${n} de ${total}`
  }:{
    pause:'Pausar',resume:'Retomar',pauseLabel:'Pausar troca automática',resumeLabel:'Retomar troca automática',
    paused:'Troca automática pausada.',resumed:'Troca automática habilitada.',error:'Não foi possível carregar a fotografia. A imagem atual continua disponível.',
    slide:(n,total)=>`Fotografia ${n} de ${total}`
  };
  root.querySelectorAll('[data-carousel]').forEach(carousel=>{
    if(carousel.dataset.carouselReady)return;
    const slides=[...carousel.querySelectorAll('[data-carousel-slide]')];
    if(slides.length<2)return;
    const dots=[...carousel.querySelectorAll('[data-carousel-go]')],toggle=carousel.querySelector('[data-carousel-toggle]');
    const count=carousel.querySelector('[data-carousel-count]'),status=carousel.querySelector('[data-carousel-status]');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    carousel.dataset.carouselReduced=String(motion.matches);
    let index=0,manualPause=motion.matches,busy=false,touchStart=null,transitionTimer=null,requestVersion=0;
    const clock=createCarouselClock({advance:()=>show(index+1,false)});
    clock.set('first-photo',true);
    const playback=()=>{carousel.dataset.carouselPlayback=clock.running?'playing':'paused';};
    const block=(reason,value)=>{clock.set(reason,value);playback();};
    const updateToggle=()=>{
      toggle.setAttribute('aria-label',manualPause?words.resumeLabel:words.pauseLabel);
      toggle.querySelector('[data-carousel-toggle-label]').textContent=manualPause?words.resume:words.pause;
      toggle.dataset.paused=String(manualPause);
      block('manual',manualPause);
    };
    const manual=()=>{requestVersion++;manualPause=true;updateToggle();};
    const finishLoading=()=>{busy=false;delete carousel.dataset.carouselLoading;carousel.removeAttribute('aria-busy');block('loading',false);};
    const ensureImage=async slide=>{
      const image=slide.querySelector('img');
      if(image.dataset.carouselSrc){
        const url=safeImageUrl(image.dataset.carouselSrc,location.href);
        if(!url)throw Error('Unsafe carousel photo');
        // Set sizes/srcset before src, and only when this slide is requested.
        if(image.dataset.carouselSrcset)image.srcset=image.dataset.carouselSrcset;
        image.loading='eager';image.src=url;
        delete image.dataset.carouselSrc;delete image.dataset.carouselSrcset;
      }
      if(image.decode)await image.decode();
      else if(!image.complete)await new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});
      if(!image.naturalWidth)throw Error('Photo unavailable');
    };
    async function show(next,fromUser){
      if(fromUser)manual();
      if(busy)return;
      next=(next+slides.length)%slides.length;
      if(next===index)return;
      const version=++requestVersion;
      busy=true;block('loading',true);carousel.dataset.carouselLoading='true';carousel.setAttribute('aria-busy','true');
      try{await ensureImage(slides[next]);}
      catch{
        if(version===requestVersion){manual();status.textContent=words.error;}finishLoading();return;
      }
      // Pausing during a slow request must not advance later behind the visitor's back.
      if(version!==requestVersion||(!fromUser&&clock.reasons.some(reason=>reason!=='loading'))){finishLoading();return;}
      const previous=slides[index],current=slides[next];
      // Keep the old photograph visible until its successor is decoded.
      current.hidden=false;current.inert=false;current.setAttribute('aria-hidden','false');
      previous.inert=true;previous.setAttribute('aria-hidden','true');
      void current.offsetWidth;
      current.classList.add('is-current');previous.classList.remove('is-current');
      index=next;carousel.dataset.carouselIndex=String(index);count.textContent=`${index+1} / ${slides.length}`;
      dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
      if(fromUser)status.textContent=words.slide(index+1,slides.length)+'. '+current.querySelector('img').alt;
      await new Promise(resolve=>{transitionTimer=setTimeout(resolve,motion.matches?0:CAROUSEL_FADE);});
      previous.hidden=true;transitionTimer=null;finishLoading();
    }
    carousel.querySelector('[data-carousel-prev]').addEventListener('click',()=>show(index-1,true));
    carousel.querySelector('[data-carousel-next]').addEventListener('click',()=>show(index+1,true));
    dots.forEach(dot=>dot.addEventListener('click',()=>show(Number(dot.dataset.carouselGo),true)));
    toggle.addEventListener('click',()=>{manualPause=!manualPause;if(manualPause)requestVersion++;updateToggle();status.textContent=manualPause?words.paused:words.resumed;});
    carousel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')block('hover',true);});
    carousel.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')block('hover',false);});
    carousel.addEventListener('focusin',()=>block('focus',true));
    carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget))block('focus',false);});
    carousel.addEventListener('keydown',event=>{
      const move={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:slides.length-1}[event.key];
      if(move!==undefined){event.preventDefault();show(move,true);}
    });
    carousel.addEventListener('pointerdown',event=>{
      if(!['touch','pen'].includes(event.pointerType))return;
      if(event.target.closest('[data-carousel-toggle]')){touchStart=null;return;}
      manual();touchStart=event.target.closest('.carousel-stage')?{x:event.clientX,y:event.clientY}:null;
    },{passive:true});
    carousel.addEventListener('pointerup',event=>{
      if(!touchStart)return;
      const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)show(index+(dx<0?1:-1),true);
    },{passive:true});
    carousel.addEventListener('pointercancel',()=>{touchStart=null;});
    document.addEventListener('visibilitychange',()=>block('document',document.hidden));
    motion.addEventListener('change',event=>{carousel.dataset.carouselReduced=String(event.matches);if(event.matches){manualPause=true;updateToggle();}});
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{for(const entry of entries)block('offscreen',!entry.isIntersecting||entry.intersectionRatio<.15);},{threshold:[0,.15]});
      observer.observe(carousel);
      addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    }else block('offscreen',false);
    addEventListener('pagehide',()=>{clock.dispose();if(transitionTimer)clearTimeout(transitionTimer);},{once:true});
    carousel.querySelectorAll('button').forEach(button=>button.disabled=false);
    block('document',document.hidden);updateToggle();carousel.dataset.carouselReady='true';playback();
    ensureImage(slides[0]).then(()=>block('first-photo',false)).catch(()=>{manual();block('first-photo',false);status.textContent=words.error;});
  });
}
