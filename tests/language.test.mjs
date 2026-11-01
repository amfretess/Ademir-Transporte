import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script=await readFile(new URL('../client/language.js',import.meta.url),'utf8');
function boot({url='https://example.com/',saved=null,blocked=false,local=false}={}){
 let current=new URL(url),value=saved;const redirects=[],replacements=[],writes=[],states=[];
 const dataset=new Proxy({localSite:local?'true':undefined},{set(target,key,val){target[key]=val;if(key==='languageState')states.push(val);return true;}});
 const context={URL,document:{documentElement:{dataset},addEventListener(){}},addEventListener(){},history:{replaceState(a,b,href){current=new URL(href);replacements.push(href);}},location:{get href(){return current.href;},replace(href){redirects.push(href);},assign(href){redirects.push(href);}}};
 Object.defineProperty(context,'localStorage',{get(){if(blocked)throw new Error('Storage unavailable');return {getItem:()=>value,setItem:(key,v)=>{assert.equal(key,'ademir-language');writes.push(v);value=v;}};}});
 vm.runInNewContext(script,context);
 return {states,redirects,replacements,writes,value,url:current.href,state:dataset.languageState};
}
test('primeira visita exige escolha manual, ignorando armazenamento corrompido e parâmetro inválido',()=>{
 for(const saved of [null,'','pt','es-ES','undefined','<script>']){const result=boot({saved,url:'https://example.com/?idioma=https://evil.test'});assert.equal(result.state,'choose');assert.deepEqual(result.redirects,[]);assert.deepEqual(result.writes,[]);}
});
test('preferência válida nunca passa pelo estado de escolha e preserva as dez rotas',()=>{
 const pairs=[['/','/es/'],['/fretes','/es/fletes'],['/taxi','/es/taxi'],['/sobre','/es/nosotros'],['/contato','/es/contacto']];
 for(const pair of pairs)for(const [index,saved] of ['pt-BR','es'].entries()){
  const result=boot({url:'https://example.com'+pair[index],saved});assert.equal(result.state,'ready');assert(!result.states.includes('choose'));assert.equal(result.redirects.length,0);
  const other=boot({url:'https://example.com'+pair[1-index],saved});assert.equal(other.state,'redirect');assert.equal(other.redirects.length,1);assert.equal(new URL(other.redirects[0]).pathname,pair[index]);
  assert.equal(boot({url:other.redirects[0],saved}).redirects.length,0);
 }
});
test('redirecionamento conserva parâmetros e âncoras sem aceitar destino externo',()=>{
 const result=boot({url:'https://example.com/taxi?origem=anuncio#orcamento',saved:'es'});assert.equal(result.redirects[0],'https://example.com/es/taxi?origem=anuncio#orcamento');
 assert.equal(boot({url:'https://example.com/inexistente',saved:'es'}).state,'ready');
});
test('escolha explícita válida atualiza a preferência e limpa somente o marcador de idioma',()=>{
 const result=boot({url:'https://example.com/?idioma=pt-BR&origem=anuncio#servicos',saved:'es'});assert.equal(result.value,'pt-BR');assert.equal(result.state,'ready');assert.equal(result.url,'https://example.com/?origem=anuncio#servicos');
});
test('armazenamento bloqueado não lança erro; parâmetro manual permite continuar e recarregar',()=>{
 assert.equal(boot({blocked:true}).state,'choose');
 const result=boot({blocked:true,url:'https://example.com/es/taxi?idioma=es'});assert.equal(result.state,'ready');assert.deepEqual(result.redirects,[]);assert(result.url.includes('idioma=es'));
 assert.equal(boot({blocked:true,url:result.url}).state,'ready');
});
test('HTML independente usa o mesmo controlador e preserva âncoras nas duas línguas',()=>{
 const result=boot({local:true,url:'file:///C:/site/Ademir.html#pt-taxi-orcamento',saved:'es'});assert.equal(result.redirects[0],'file:///C:/site/Ademir.html#es-taxi-orcamento');
 assert.equal(boot({local:true,url:result.redirects[0],saved:'es'}).state,'ready');
 assert.equal(boot({local:true,url:'file:///C:/site/Ademir.html?idioma=es#es-inicio',blocked:true}).state,'ready');
 assert.doesNotThrow(()=>boot({local:true,url:'file:///C:/site/Ademir.html#%E0%A4',saved:null}));
});
test('páginas mantêm conteúdo HTML, SEO, fallback sem JS e decisão antes do CSS',async()=>{
 const routes=JSON.parse(await readFile(new URL('../routes.json',import.meta.url),'utf8'));
 for(const page of routes){const html=await readFile(new URL('../dist'+(page.route==='/'?'':page.route.replace(/\/$/,''))+'/index.html',import.meta.url),'utf8');assert.match(html,/<main id="main">/);assert.match(html,/<h1>/);assert.match(html,/<noscript><nav class="language-fallback"/);assert.match(html,/id="language-welcome"/);assert.equal((html.match(/id="language-welcome"/g)||[]).length,1);assert(html.includes('<script>'+script+'</script>'));assert(html.indexOf('<script>')<html.indexOf('<link rel="stylesheet"'));assert(!html.includes('src="/assets/language.js"'));assert(html.includes("document.dispatchEvent(new Event('ademir-language-markup'))"));assert.match(html,/<dialog id="language-welcome"/);assert.match(html,/rel="canonical"/);assert.match(html,/hreflang="es"/);assert.match(html,/hreflang="pt-BR"/);}
});
