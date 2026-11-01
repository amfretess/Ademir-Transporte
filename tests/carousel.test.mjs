import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCarouselClock,CAROUSEL_INTERVAL} from '../client/carousel.js';

function fakeTime(){
  let now=0,id=0;
  const jobs=new Map();
  return {
    timeout(fn,delay){jobs.set(++id,{fn,due:now+delay});return id;},
    cancel(key){jobs.delete(key);},
    now:()=>now,
    spend(ms){now+=ms;},
    async tick(ms){const end=now+ms;for(;;){const next=[...jobs].sort((a,b)=>a[1].due-b[1].due)[0];if(!next||next[1].due>end)break;jobs.delete(next[0]);now=next[1].due;await next[1].fn();}now=Math.max(now,end);},
    get count(){return jobs.size;}
  };
}

test('carrossel só avança visível, com intervalo de cinco segundos e um único timer',async()=>{
  const time=fakeTime();let count=0;
  const clock=createCarouselClock({...time,advance:async()=>{count++;}});
  await time.tick(20000);assert.equal(count,0);assert.equal(time.count,0);
  clock.set('offscreen',false);assert.equal(time.count,1);
  await time.tick(CAROUSEL_INTERVAL-1);assert.equal(count,0);
  await time.tick(1);assert.equal(count,1);assert.equal(time.count,1);
  clock.set('offscreen',false);assert.equal(time.count,1);
  await time.tick(CAROUSEL_INTERVAL);assert.equal(count,2);
});

test('hover, foco, documento oculto e pausa manual são independentes',async()=>{
  const time=fakeTime();let count=0;
  const clock=createCarouselClock({...time,advance:()=>{count++;}});
  clock.set('offscreen',false);clock.set('hover',true);clock.set('focus',true);
  clock.set('hover',false);await time.tick(10000);assert.equal(count,0);
  clock.set('document',true);clock.set('focus',false);await time.tick(10000);assert.equal(count,0);
  clock.set('manual',true);clock.set('document',false);await time.tick(10000);assert.equal(count,0);
  clock.set('manual',false);await time.tick(5000);assert.equal(count,1);
});

test('foto fora da tela e carregamento em andamento não acumulam trocas atrasadas',async()=>{
  const time=fakeTime();let count=0;
  const clock=createCarouselClock({...time,advance:()=>{count++;}});
  clock.set('offscreen',false);await time.tick(4000);clock.set('offscreen',true);
  await time.tick(60000);assert.equal(count,0);
  clock.set('offscreen',false);await time.tick(4999);assert.equal(count,0);
  clock.set('loading',true);await time.tick(10000);assert.equal(count,0);
  clock.set('loading',false);await time.tick(5000);assert.equal(count,1);
});

test('descartar o controlador cancela timers e impede reinício',async()=>{
  const time=fakeTime();let count=0;
  const clock=createCarouselClock({...time,advance:()=>{count++;}});
  clock.set('offscreen',false);clock.dispose();clock.set('manual',false);clock.reset();
  await time.tick(30000);assert.equal(count,0);assert.equal(time.count,0);assert(!clock.running);
});

test('fade normal mantém a cadência; download lento recebe novo período completo de exibição',async()=>{
  for(const [work,remaining]of [[600,4400],[4200,5000]]){
    const time=fakeTime();let count=0;
    const clock=createCarouselClock({...time,advance:()=>{count++;time.spend(work);}});
    clock.set('offscreen',false);await time.tick(5000);assert.equal(count,1);
    await time.tick(remaining-1);assert.equal(count,1);
    await time.tick(1);assert.equal(count,2);clock.dispose();
  }
});

test('PT/ES mantêm carrosséis por serviço, controles nomeados e segunda foto sem download inicial',async()=>{
  const pages=[['',2],['/es',2],['/fretes',1],['/es/fletes',1],['/taxi',1],['/es/taxi',1]];
  for(const [route,expected]of pages){
    const html=await readFile(new URL('../dist'+route+'/index.html',import.meta.url),'utf8');
    const carousels=[...html.matchAll(/<div id="(?:home|hero)-(?:fretes|taxi)" class="photo-carousel"[\s\S]*?<p class="carousel-announcement"[\s\S]*?<\/p><\/div>/g)].map(m=>m[0]);
    assert.equal(carousels.length,expected,route);
    for(const carousel of carousels){
      const service=carousel.match(/data-service-theme="(fretes|taxi)"/)[1];
      const sources=[...carousel.matchAll(/(?:\ssrc|data-carousel-src)="([^"]+)"/g)].map(m=>m[1]);
      assert.equal(sources.length,2);assert(sources.every(src=>src.startsWith('/images/'+service+'/')));
      assert.equal((carousel.match(/\ssrc="/g)||[]).length,1);
      assert.equal((carousel.match(/data-carousel-src="/g)||[]).length,1);
      assert.match(carousel,/aria-hidden="true" hidden inert/);
      assert.match(carousel,/data-carousel-toggle aria-label="[^"]+"/);
      assert.match(carousel,/aria-live="polite"/);
      assert.equal((carousel.match(/data-carousel-go="/g)||[]).length,2);
      for(const img of carousel.matchAll(/<img\b([^>]+)>/g))assert.match(img[1],/width="\d+" height="\d+"/);
    }
  }
});
