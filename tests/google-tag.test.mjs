import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {GOOGLE_TAG_ID,googleTagScript} from '../google-tag.mjs';
import {hashScript,contentPolicy} from '../security-policy.mjs';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const decode=text=>text.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&');
const directive=(policy,name)=>policy.split('; ').find(item=>item.startsWith(name+' ')).split(' ').slice(1);

test('tag única no head das dez rotas PT/ES e das duas páginas 404, permitida pelas duas CSPs',async()=>{
 const routes=JSON.parse(await read('routes.json'));
 const pages=[...routes.map(p=>'dist/'+(p.route==='/'?'':p.route.replace(/^\/|\/$/g,'')+'/')+'index.html'),'dist/404.html','dist/es/404.html'];
 const headers=await read('dist/_headers');
 const headerPolicy=headers.match(/Content-Security-Policy: ([^\n]+)/)[1];
 for(const name of pages){
  const html=await read(name),head=html.match(/<head>([\s\S]*?)<\/head>/)[1];
  assert.equal((html.match(/src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-9JF0G9JMKV"/g)||[]).length,1,name);
  assert.equal((html.match(/gtag\('config', 'G-9JF0G9JMKV'\)/g)||[]).length,1,name);
  assert(head.includes(`<script>${googleTagScript}</script>`),name);
  assert(head.includes('async src="https://www.googletagmanager.com/gtag/js?id='+GOOGLE_TAG_ID+'"'),name);
  const metaPolicy=decode(head.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
  assert(head.indexOf('http-equiv="Content-Security-Policy"')<head.indexOf('<!-- Google tag'),name);
  for(const policy of [metaPolicy,headerPolicy]){
   assert(directive(policy,'script-src').includes(hashScript(googleTagScript)),name);
   assert(directive(policy,'script-src').includes('https://www.googletagmanager.com'),name);
   for(const host of ['https://www.googletagmanager.com','https://*.google-analytics.com','https://*.analytics.google.com'])assert(directive(policy,'connect-src').includes(host),name);
   assert(!/unsafe-inline|unsafe-eval/.test(policy),name);
   assert.deepEqual(directive(policy,'form-action'),["'none'"]);
  }
  assert(!html.includes('cookies de rastreamento ou armazenamento')&&!html.includes('cookies de seguimiento ni almacenamiento'),name);
  assert(html.includes(name.includes('/es/')?'Usamos Google Analytics para medir las visitas':'Usamos o Google Analytics para medir visitas'),name);
 }
});

test('inicialização preserva a fila existente e configura somente o ID solicitado',()=>{
 for(const existing of [undefined,[['existing']]]){
  const context=vm.createContext({});context.window=context;
  if(existing)context.dataLayer=existing;
  vm.runInContext(googleTagScript,context);
  if(existing)assert.equal(context.dataLayer,existing);
  const commands=Array.from(context.dataLayer,item=>Array.from(item));
  assert.deepEqual(commands.slice(-2).map(item=>item[0]),['js','config']);
  assert.equal(commands.at(-1)[1],GOOGLE_TAG_ID);
  assert.equal(commands.at(-1).length,2);
 }
});

test('exportação offline mantém conexões e scripts externos bloqueados',()=>{
 const policy=contentPolicy({local:true,analytics:true});
 assert.deepEqual(directive(policy,'connect-src'),["'none'"]);
 assert(!policy.includes('google'));
});
