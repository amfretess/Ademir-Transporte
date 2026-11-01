import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {makeRequest} from '../client/communication.js';
import {normalizeRequest,validateField,RequestValidationError,createSubmissionGuard,safeImageUrl} from '../client/validation.js';
import {contentPolicy,hashScript,safeJson} from '../security-policy.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const options={now:new Date(2026,9,26,12,30)};
const valid={nome:'María de Souza',telefone:'+55 (47) 99999-9999',origem:'Bombinhas',destino:'Itapema',data:'2026-12-20',objetos:'Mesa, caixas & itens frágeis',ajudante:'Sim',horario:'09:30',passageiros:'4',malas:'0',observacoes:''};
const invalid=(field,code,fn)=>assert.throws(fn,error=>error instanceof RequestValidationError&&error.field===field&&error.code===code);

test('WhatsApp tem somente o destino fixo do serviço e um parâmetro codificado, nos dois idiomas',()=>{
 for(const lang of ['pt-BR','es'])for(const service of ['fretes','taxi']){
  const request=makeRequest(service,{...valid,objetos:'<img src=x onerror=alert(1)> & ?phone=123 #'},lang,options);
  const url=new URL(request.url);assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,service==='fretes'?'/5547997813000':'/5547997302343');assert.equal(url.searchParams.size,1);assert.equal(url.searchParams.get('text'),request.message);assert(!url.hash);
  assert.match(request.message,lang==='es'?/¡Hola!/:/Olá!/);
 }
});
test('NFC e controles são normalizados sem injetar linhas em campos simples',()=>{
 const data=normalizeRequest('fretes',{...valid,nome:'  Jose\u0301\nDestino: falso\u202E\u0000  ',observacoes:'Primeira\r\nsegunda\tlinha'},options);
 assert.equal(data.nome,'José Destino: falso');assert.equal(data.observacoes,'Primeira\nsegunda linha');assert.equal(data.telefone,'+5547999999999');
 const request=makeRequest('fretes',{...valid,objetos:'Texto com \uD800 isolado'},'pt-BR',options);assert.match(request.message,/�/);
});
test('campos obrigatórios, objetos não textuais, propriedades herdadas e limites são recusados',()=>{
 invalid('nome','required',()=>normalizeRequest('fretes',{...valid,nome:' \n '},options));
 invalid('nome','pattern',()=>normalizeRequest('fretes',{...valid,nome:{toString(){throw Error('do not call');}}},options));
 invalid('nome','required',()=>normalizeRequest('fretes',Object.create(valid),options));
 invalid('objetos','maxLength',()=>makeRequest('fretes',{...valid,objetos:'x'.repeat(3001)},'es',options));
 const data=normalizeRequest('fretes',{...valid,__proto__:{polluted:true},unexpected:'ignored'},options);assert.equal(Object.getPrototypeOf(data),null);assert(!Object.hasOwn(data,'unexpected'));assert.equal({}.polluted,undefined);
});
test('telefone, calendário real, datas passadas e horários fora do intervalo são recusados',()=>{
 for(const phone of ['abc47999999999','12','+1234567890123456'])invalid('telefone','phone',()=>normalizeRequest('fretes',{...valid,telefone:phone},options));
 for(const date of ['2026-02-31','2030-02-29','2026-13-01'])invalid('data','validDate',()=>normalizeRequest('fretes',{...valid,data:date},options));
 invalid('data','futureDate',()=>normalizeRequest('fretes',{...valid,data:'2026-10-25'},options));
 assert.equal(validateField('data','2032-02-29',options),'2032-02-29');
 invalid('horario','validTime',()=>normalizeRequest('taxi',{...valid,horario:'24:00'},options));
 invalid('horario','futureTime',()=>normalizeRequest('taxi',{...valid,data:'2026-10-26',horario:'12:30'},options));
});
test('passageiros, malas e ajudante usam somente valores permitidos',()=>{
 for(const passengers of ['0','5','-1','1.5'])assert.throws(()=>normalizeRequest('taxi',{...valid,passageiros:passengers},options),RequestValidationError);
 for(const bags of ['-1','1.5','21','x'])assert.throws(()=>normalizeRequest('taxi',{...valid,malas:bags},options),RequestValidationError);
 invalid('ajudante','pattern',()=>normalizeRequest('fretes',{...valid,ajudante:'???'},options));
 assert.equal(normalizeRequest('taxi',valid,options).malas,'0');
});
test('bloqueio de duplicidade é temporário e não depende de armazenamento persistente',()=>{
 let time=100;const guard=createSubmissionGuard({now:()=>time});assert(guard.accept('same'));assert(!guard.accept('same'));time+=2999;assert(!guard.accept('same'));time++;assert(guard.accept('same'));guard.reset();assert(guard.accept('same'));
});
test('galeria recusa URL externa, JavaScript e tipos de imagem não permitidos',()=>{
 const base='https://example.com/taxi';assert.equal(safeImageUrl('/images/taxi/taxi-bombinhas-640-a1b2.webp',base),'https://example.com/images/taxi/taxi-bombinhas-640-a1b2.webp');
 for(const url of ['javascript:alert(1)','https://other.example/images/taxi/x.webp','data:text/html,evil','data:image/svg+xml,<svg/>','/images/taxi/x.webp?private=1'])assert.equal(safeImageUrl(url,base),null);
 assert.equal(safeImageUrl('data:image/webp;base64,YWJj',base),'data:image/webp;base64,YWJj');
});
test('JSON-LD não pode encerrar o elemento script',()=>{assert(!safeJson({text:'</script><img onerror=alert(1)>'}).includes('<'));});
test('páginas aplicam CSP sem unsafe-inline/eval, um CSS e formulários sem fallback GET',async()=>{
 const routes=JSON.parse(await readFile(path.join(root,'routes.json'),'utf8'));
 for(const page of routes){
  const html=await readFile(path.join(root,'dist',page.route.replace(/^\//,'').replace(/\/$/,''),'index.html'),'utf8');
  const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1].replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&');
  assert(policy.includes("form-action 'none'")&&!/unsafe-inline|unsafe-eval/.test(policy));
  const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];assert(policy.includes(hashScript(json)));
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('src='))assert(policy.includes(hashScript(match[2])));
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);assert(!/\son[a-z]+="|href="javascript:/i.test(html));
  for(const form of html.matchAll(/<form\b([\s\S]*?)<\/form>/g)){assert(form[1].includes('method="post"'));assert(/class="button primary form-submit"[^>]* disabled/.test(form[1]));}
 }
 const headers=await readFile(path.join(root,'dist/_headers'),'utf8');assert(headers.includes("frame-ancestors 'self'"));assert(headers.includes('X-Content-Type-Options: nosniff'));assert(!headers.includes('includeSubDomains'));
 assert(contentPolicy({local:true,scriptHashes:[hashScript('x')]}).includes("connect-src 'none'"));
});
test('arquivos públicos contêm somente imagens aprovadas e não incluem originais, diagnóstico ou segredos',async()=>{
 const photos=JSON.parse(await readFile(path.join(root,'photos.json'),'utf8'));
 assert(!photos['taxi/taxi-aeroporto']&&!photos['bombinhas/bombinhas-estrada']&&!photos['aeroportos/aviao-patio']);
 const allowed=new Set(Object.values(photos).flatMap(p=>{assert.equal(p.review,'approved-redacted');return p.variants.map(v=>v.src);}));
 async function walk(dir){for(const file of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,file.name);if(file.isDirectory()){assert(!/^\.git$|^node_modules$|^originals$|^__audit$/.test(file.name));await walk(full);}else{const relative='/'+path.relative(path.join(root,'dist'),full).replaceAll('\\','/');if(relative.startsWith('/images/'))assert(allowed.has(relative),relative);if(/\.(?:html|js|css|txt|xml)$/.test(file.name)){const text=await readFile(full,'utf8');assert(!/(?:sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{20,})/.test(text),relative);assert(!text.includes('/__audit/'),relative);}}}}
 await walk(path.join(root,'dist'));
});
