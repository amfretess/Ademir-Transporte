import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { makeRequest as createRequest } from './dist/assets/communication.js';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const makeRequest=(service,data,lang='pt-BR')=>createRequest(service,data,lang,{now:new Date(2026,9,26,12,30)});
const fields={nome:'Pessoa de teste',telefone:'47999999999',origem:'Bombinhas',destino:'Itapema',data:'2026-12-20',objetos:'Mesa, 4 cadeiras & caixas',ajudante:'Sim',horario:'09:30',passageiros:'4',malas:'2',observacoes:'Teste de prévia'};
const freight=makeRequest('fretes',fields),taxi=makeRequest('taxi',fields);
assert.equal(new URL(freight.url).pathname,'/5547997813000');
assert.equal(new URL(taxi.url).pathname,'/5547997302343');
assert.equal(new URL(freight.url).searchParams.get('text'),freight.message);
assert.equal(new URL(taxi.url).searchParams.get('text'),taxi.message);
assert.match(freight.message,/Mesa, 4 cadeiras & caixas/);
assert.match(freight.message,/20\/12\/2026/);
assert.match(taxi.message,/Passageiros: 4/);
assert.match(taxi.message,/depende da confirmação/);
assert.throws(()=>makeRequest('outro',fields));
for(const route of ['','/fretes','/taxi','/sobre','/contato','/es','/es/fletes','/es/taxi','/es/nosotros','/es/contacto']){
  const html=await readFile(`dist${route}/index.html`,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`H1 em ${route}`);
  assert.match(html,route.startsWith('/es')?/<html lang="es">/:/<html lang="pt-BR">/);
  assert.match(html,/<meta name="description"/);
  assert.match(html,/<link rel="canonical"/);
  assert(!html.includes('1.200 kg'));
  assert(!html.includes('vehicle-art')&&!html.includes('coastal-road.webp'));
  assert.match(html,/<link rel="alternate" hreflang="pt-BR"/);
  assert.match(html,/<link rel="alternate" hreflang="es"/);
  assert.match(html,/data-language="es"/);
  assert(!/aggregateRating|reviewRating/.test(html));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size,`IDs duplicados em ${route}`);
  for(const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)){
    const target=match[1];const p=target.includes('.')?`dist${target}`:`dist${target==='/'?'':target}/index.html`;
    await stat(p);
  }
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]),`Âncora #${match[1]} em ${route}`);
}
const taxiHtml=await readFile('dist/taxi/index.html','utf8');
assert.match(taxiHtml,/<option value="4">4 passageiros<\/option>/);
assert(!taxiHtml.includes('<option value="5">'));
assert.match(taxiHtml,/A reserva só estará confirmada após a confirmação do atendimento/);
const app=await readFile('dist/assets/app.js','utf8');
assert(!/localStorage|sessionStorage|document\.cookie|fetch\(/.test(app));
console.log('Verificação concluída: cinco rotas, assets e âncoras; metadados; WhatsApp e codificação das mensagens; contatos separados; confirmação do táxi; sem armazenamento ou avaliações inventadas.');
for(const service of ['fretes','taxi'])for(const lang of ['pt-BR','es']){
 const request=makeRequest(service,fields,lang);
 assert.equal(new URL(request.url).pathname,service==='fretes'?'/5547997813000':'/5547997302343');
 assert.equal(new URL(request.url).searchParams.get('text'),request.message);
 assert.match(request.message,lang==='es'?/¡Hola!/:/Olá!/);
 assert.match(request.message,lang==='es'?/Nombre: Pessoa de teste/:/Nome: Pessoa de teste/);
 if(lang==='es')assert(!/Precisa de ajudante|Aguardo|Observações|Telefone/.test(request.message));
}
assert.throws(()=>makeRequest('taxi',{...fields,passageiros:'5'},'es'),error=>error.field==='passageiros'&&error.code==='passengers');
const translations=JSON.parse(await readFile('locales/missing-es.json','utf8'));
assert.deepEqual(translations,[]);
const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,10);
const photos=JSON.parse(await readFile('photos.json','utf8'));
for(const image of Object.values(photos)){await stat('dist'+image.src);for(const variant of image.variants)await stat('dist'+variant.src);}
console.log('Bilinguismo verificado: dez rotas, catálogo completo, sitemap, hreflang, imagens responsivas e quatro combinações de formulário/idioma.');
