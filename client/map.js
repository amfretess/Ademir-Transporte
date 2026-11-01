export function initMaps(root,lang){
 const spanish=lang==='es',names={'bombinhas':'Bombinhas','porto-belo':'Porto Belo','itapema':'Itapema','fln':'Florianópolis','nvt':'Navegantes'};
 const coordinates={'bombinhas':[-27.151916,-48.487569],'porto-belo':[-27.154242,-48.542440],'itapema':[-27.094720,-48.613778],'fln':[-27.673708,-48.545580],'nvt':[-26.880442,-48.648851]};
 root.querySelectorAll('[data-map]').forEach(map=>{
  if(map.dataset.mapReady)return;map.dataset.mapReady='true';
  const svg=map.querySelector('[data-map-svg]'),full=svg.getAttribute('viewBox').split(' ').map(Number),description=map.querySelector('[data-map-description]'),directions=map.querySelector('[data-map-directions]');let view=[...full];
  const draw=()=>{view[2]=Math.min(full[2],Math.max(220,view[2]));view[3]=view[2]*full[3]/full[2];view[0]=Math.min(full[2]-view[2],Math.max(0,view[0]));view[1]=Math.min(full[3]-view[3],Math.max(0,view[1]));svg.setAttribute('viewBox',view.map(n=>Number(n.toFixed(2))).join(' '));};
  const show=id=>{
   if(!Object.hasOwn(names,id)&&id!=='region')return;
   map.querySelectorAll('[data-map-route]').forEach(el=>el.classList.toggle('is-selected',el.dataset.mapRoute===id));
   map.querySelectorAll('[data-map-marker]').forEach(el=>el.classList.toggle('is-selected',el.dataset.mapMarker===id));
   map.classList.toggle('show-map-area',id==='region');map.querySelectorAll('[data-map-focus]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mapFocus===id)));
   const section=map.closest('[data-coverage]');section.querySelectorAll('[data-region]').forEach(el=>{const match={'Bombinhas':'bombinhas','Itapema':'itapema','Porto Belo':'porto-belo','Bombinhas e região':'region'}[el.dataset.region];el.setAttribute('aria-pressed',String(match===id));});
   if(id==='region'){view=[...full];description.textContent=spanish?'Área destacada: Bombinhas, Porto Belo e Itapema. Consulte la disponibilidad para su recorrido.':'Área destacada: Bombinhas, Porto Belo e Itapema. Consulte a disponibilidade para seu trajeto.';}
   else{
    const point=map.querySelector(`[data-map-marker="${id}"]`),x=Number(point.dataset.x),y=Number(point.dataset.y);const base=map.querySelector('[data-map-marker="bombinhas"]'),bx=Number(base.dataset.x),by=Number(base.dataset.y);
    const width=Math.min(full[2],Math.max(370,Math.abs(x-bx)+260,(Math.abs(y-by)+220)*full[2]/full[3]));view=[(x+bx-width)/2,(y+by-width*full[3]/full[2])/2,width,width*full[3]/full[2]];
    description.textContent=id==='bombinhas'?(spanish?'Bombinhas es nuestra ciudad base. El marcador representa la ciudad.':'Bombinhas é nossa cidade-base. O marcador representa a cidade.'):(spanish?`${names[id]}: conexión desde Bombinhas por las vías de la región. Confirme el itinerario antes de viajar.`:`${names[id]}: conexão a partir de Bombinhas pelas vias da região. Confirme o itinerário antes de viajar.`);
   }
   const destination=coordinates[id]||coordinates.bombinhas,url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('origin',coordinates.bombinhas.join(','));url.searchParams.set('destination',destination.join(','));url.searchParams.set('travelmode','driving');directions.href=url.href;draw();
  };
  map.querySelectorAll('[data-map-focus]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.mapFocus)));
  map.closest('[data-coverage]').querySelectorAll('[data-region]').forEach(button=>button.addEventListener('click',()=>show({'Bombinhas':'bombinhas','Itapema':'itapema','Porto Belo':'porto-belo','Bombinhas e região':'region'}[button.dataset.region])));
  svg.addEventListener('click',event=>{const marker=event.target.closest('[data-map-marker]');if(marker)show(marker.dataset.mapMarker);});
  map.querySelectorAll('[data-map-zoom]').forEach(button=>button.addEventListener('click',()=>{
   if(button.dataset.mapZoom==='reset'){view=[...full];draw();return;}
   const factor=button.dataset.mapZoom==='in'?1/1.45:1.45,w=Math.min(full[2],Math.max(220,view[2]*factor)),h=w*full[3]/full[2];view=[view[0]+(view[2]-w)/2,view[1]+(view[3]-h)/2,w,h];draw();
  }));
  svg.addEventListener('keydown',event=>{const movement={'ArrowLeft':[-1,0],'ArrowRight':[1,0],'ArrowUp':[0,-1],'ArrowDown':[0,1]}[event.key];if(!movement)return;event.preventDefault();view[0]+=movement[0]*view[2]*.16;view[1]+=movement[1]*view[3]*.16;draw();});
 });
}
