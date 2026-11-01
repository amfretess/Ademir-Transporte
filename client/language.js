(()=>{
 const pairs=[['/','/es/'],['/fretes','/es/fletes'],['/taxi','/es/taxi'],['/sobre','/es/nosotros'],['/contato','/es/contacto']];
 const key='ademir-language',root=document.documentElement,local=root.dataset.localSite==='true';
 const valid=value=>value==='pt-BR'||value==='es';
 const normalize=route=>route==='/'?'/':route.replace(/\/$/,'');
 const slug=(route,index)=>(index?'es-':'pt-')+(['/','/es/'].includes(route)?'inicio':route.split('/').filter(Boolean).at(-1));
 const read=()=>{try{const value=localStorage.getItem(key);return valid(value)?value:null;}catch{return null;}};
 const save=value=>{try{localStorage.setItem(key,value);return localStorage.getItem(key)===value;}catch{return false;}};
 function current(){
  const url=new URL(location.href);let hash='';try{hash=decodeURIComponent(url.hash.slice(1));}catch{}
  const pair=local?(pairs.find(p=>p.some((route,i)=>hash===slug(route,i)||hash.startsWith(slug(route,i)+'-')))||pairs[0]):pairs.find(p=>p.some(route=>normalize(route)===normalize(url.pathname)));
  return {url,pair,hash};
 }
 function destination(pair,lang,url,{home=false,persistent=true,anchor=''}={}){
  const selected=home?pairs[0]:pair,index=lang==='es'?1:0,target=new URL(url.href);
  if(local)target.hash=slug(selected[index],index)+anchor;else {target.pathname=selected[index];if(home)target.hash='';}
  if(persistent)target.searchParams.delete('idioma');else target.searchParams.set('idioma',lang);
  return target;
 }
 function state(value){root.dataset.languageState=value;}
 function accessibility({focus=false}={}){
  const gate=document.getElementById('language-welcome'),shell=document.getElementById('site-shell');
  if(!gate)return;
  if(!gate.dataset.nativeGuard){
   gate.dataset.nativeGuard='true';
   gate.addEventListener('cancel',event=>{if(root.dataset.languageState==='choose')event.preventDefault();});
   gate.addEventListener('close',()=>{if(root.dataset.languageState==='choose'){delete root.dataset.languageDialog;accessibility();}});
  }
  const choosing=root.dataset.languageState==='choose',wasOpen=gate.open;
  gate.setAttribute('aria-hidden',String(!choosing));
  if(choosing){
   if(!gate.open){gate.showModal();gate.querySelector('#language-title')?.focus({preventScroll:true});}
   root.dataset.languageDialog='open';shell?.setAttribute('inert','');shell?.setAttribute('aria-hidden','true');
  }else{
   if(gate.open)gate.close();delete root.dataset.languageDialog;
   shell?.removeAttribute('inert');shell?.removeAttribute('aria-hidden');
   if(focus||wasOpen){const heading=(local?shell?.querySelector('.local-page:target h1,.local-page:has(:target) h1'):null)||shell?.querySelector('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
  }
 }
 function readyEvent(){if(root.dataset.languageState==='ready')document.dispatchEvent(new CustomEvent('ademir-language-ready'));}
 function resolve(){
  const {url,pair,hash}=current();if(!pair){state('ready');return;}
  const parameter=url.searchParams.get('idioma'),explicit=valid(parameter)?parameter:null,preferred=explicit||read();
  if(!preferred){state('choose');return;}
  const persistent=explicit?save(preferred):true;
  let anchor='';if(local){const existing=pair.map((route,i)=>slug(route,i)).find(id=>hash===id||hash.startsWith(id+'-'));if(existing)anchor=hash.slice(existing.length);}
  const target=destination(pair,preferred,url,{persistent,anchor});
  const samePage=local?target.hash===url.hash:normalize(target.pathname)===normalize(url.pathname);
  if(!samePage){state('redirect');location.replace(target.href);return;}
  if(target.href!==url.href)try{history.replaceState(null,'',target.href);}catch{}
  state('ready');
 }
 // Runs synchronously in the head, before the stylesheet and first paint.
 resolve();
 document.addEventListener('ademir-language-markup',()=>{accessibility();readyEvent();});
 document.addEventListener('DOMContentLoaded',()=>{accessibility();readyEvent();},{once:true});
 document.addEventListener('cancel',event=>{if(event.target.id==='language-welcome'&&root.dataset.languageState==='choose')event.preventDefault();},true);
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-language-reset]')){
   event.preventDefault();try{localStorage.removeItem(key);}catch{}
   const url=new URL(location.href);url.searchParams.delete('idioma');try{history.replaceState(null,'',url.href);}catch{}
   location.reload();return;
  }
  const link=event.target.closest('[data-language]');if(!link||!valid(link.dataset.language))return;
  const {url,pair}=current();if(!pair)return;
  const lang=link.dataset.language,persistent=save(lang),target=destination(pair,lang,url,{home:link.hasAttribute('data-welcome-choice'),persistent});
  link.href=target.href;
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  const samePage=local?target.hash===url.hash:target.pathname===url.pathname;
  if(samePage){try{history.replaceState(null,'',target.href);}catch{if(target.href!==url.href){location.assign(target.href);return;}}state('ready');accessibility({focus:true});readyEvent();}
  else {state('redirect');location.assign(target.href);}
 },true);
 document.addEventListener('click',event=>{
  if(read())return;const {url}=current(),fallback=url.searchParams.get('idioma');if(!valid(fallback))return;
  const link=event.target.closest('a[href]');if(!link||link.hasAttribute('data-language'))return;
  try{const target=new URL(link.getAttribute('href'),url);if(target.origin!==url.origin)return;if(local?target.pathname!==url.pathname:!pairs.some(p=>p.some(route=>normalize(route)===normalize(target.pathname))))return;target.searchParams.set('idioma',fallback);link.href=target.href;}catch{}
 },true);
 document.addEventListener('keydown',event=>{
  if(root.dataset.languageState==='choose'&&event.key==='Escape'){event.preventDefault();event.stopPropagation();return;}
  if(root.dataset.languageState!=='choose'||event.key!=='Tab')return;
  const gate=document.getElementById('language-welcome'),links=gate?.querySelectorAll('[data-welcome-choice]');if(!links?.length)return;
  const first=links[0],last=links[links.length-1];
  if(event.shiftKey&&(document.activeElement===first||!Array.from(links).includes(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!Array.from(links).includes(document.activeElement))){event.preventDefault();first.focus();}
 },true);
 addEventListener('pageshow',event=>{if(event.persisted){resolve();accessibility();}});
 if(local)addEventListener('hashchange',()=>{resolve();accessibility();readyEvent();});
})();
