import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {contentPolicy,escapeHtml,hashScript,safeJson} from './security-policy.mjs';
import {languageMountScript} from './language-welcome.mjs';
const base=fileURLToPath(new URL('.',import.meta.url));
const destination=path.resolve(process.argv[2]||path.join(base,'Ademir-Transportes-Local.html'));
const routes=JSON.parse(await readFile(path.join(base,'routes.json'),'utf8'));
const pages=routes.map(p=>({...p,slug:(p.lang==='es'?'es-':'pt-')+(p.route==='/'||p.route==='/es/'?'inicio':p.route.split('/').filter(Boolean).at(-1))}));
const assets=new Map();
const imageRefs=new Map(),imageData={};
async function embed(url){
 if(assets.has(url))return assets.get(url);
 const ext=path.extname(url),mime={'.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'}[ext];
 if(!mime)throw Error('Unsupported local asset '+url);
 const value=`data:${mime};base64,${(await readFile(path.join(base,'dist',url))).toString('base64')}`;
 assets.set(url,value);return value;
}
const builtHome=await readFile(path.join(base,'dist/index.html'),'utf8');
const stylesheet=builtHome.match(/<link rel="stylesheet" href="([^"]+)"/)[1];
let css=await readFile(path.join(base,'dist',stylesheet),'utf8');
css=css.replace(/\r\n?/g,'\n');
css=css.replaceAll('/assets/manrope-latin.woff2',await embed('/assets/manrope-latin.woff2')).replaceAll('/assets/inter-latin.woff2',await embed('/assets/inter-latin.woff2'));
const bodyParts=[];let welcome='';
const mapData='data:application/geo+json;base64,'+(await readFile(path.join(base,'public/maps/region.geojson'))).toString('base64');
for(const page of pages){
 const html=await readFile(path.join(base,'dist',page.route.replace(/^\//,'').replace(/\/$/,''),'index.html'),'utf8');
 let body=html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script\b[\s\S]*?<\/script>/g,'');
 if(!welcome)welcome=body.match(/<!-- language-welcome:start -->[\s\S]*?<!-- language-welcome:end -->/)[0].replaceAll('href="/"','href="#pt-inicio"').replaceAll('href="/es/"','href="#es-inicio"');
 body=body.replace(/<!-- language-welcome:start -->[\s\S]*?<!-- language-welcome:end -->/,'').replace(/^<div id="site-shell" class="site-shell"[^>]*>/,'').replace(/<\/div>$/,'');
 body=body.replaceAll('href="/maps/region.geojson"','href="#" data-local-map-download');
 const ids=new Set([...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 body=body.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${page.slug}-${id}"`);
 body=body.replace(/\baria-(controls|labelledby|describedby)="([^"]+)"/g,(_,kind,ids)=>`aria-${kind}="${ids.split(' ').map(id=>page.slug+'-'+id).join(' ')}"`);
 body=body.replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${page.slug}-${id})`);
 body=body.replace(/href="([^"\s]+)"/g,(original,href)=>{
  if(href.startsWith('/')){const [route,anchor]=href.split('#');const target=pages.find(p=>p.route===route);if(target)return `href="#${target.slug}${anchor?'-'+anchor:''}"`;}
  if(href.startsWith('#')&&ids.has(href.slice(1)))return `href="#${page.slug}-${href.slice(1)}"`;
  return original;
 });
 body=body.replace(/\s(?:srcset|sizes|data-carousel-srcset)="[^"]*"/g,'');
 const imageUrls=[...new Set([...body.matchAll(/(?:src|data-full|data-carousel-src)="(\/(?:images|assets)\/[^\"]+)"/g)].map(m=>m[1]))];
 for(const url of imageUrls)if(!imageRefs.has(url)){const id='photo-'+imageRefs.size;imageRefs.set(url,id);imageData[id]=await embed(url);}
 body=body.replace(/\b(src|data-full|data-carousel-src)="(\/(?:images|assets)\/[^\"]+)"/g,(_,attribute,url)=>attribute==='src'?`src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-local-image="${imageRefs.get(url)}"`:attribute==='data-full'?`data-local-full="${imageRefs.get(url)}"`:`data-local-carousel="${imageRefs.get(url)}"`);
 const attr=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 bodyParts.push(`<div id="${page.slug}" class="local-page" data-service-theme="${page.route==='/taxi'||page.route==='/es/taxi'?'taxi':page.route==='/fretes'||page.route==='/es/fletes'?'fretes':'brand'}" data-page="${page.slug}" data-lang="${page.lang}" data-title="${attr(page.title)}" data-description="${attr(page.description)}">${body}</div>`);
}
const readClient=async name=>(await readFile(path.join(base,'client',name),'utf8')).replace(/\r\n?/g,'\n').replace(/^import[^\n]*\n/gm,'').replaceAll('export ','');
const validation=await readClient('validation.js'),communication=await readClient('communication.js'),ui=await readClient('ui.js'),mapCode=await readClient('map.js'),carouselCode=await readClient('carousel.js');
let app=await readClient('app.js');
app=app.split('\n').filter(line=>!line.startsWith("document.addEventListener('keydown'")&&!line.startsWith("document.addEventListener('click'")).join('\n');
app=app.replace("const lang=document.documentElement.lang==='es'?'es':'pt-BR';","const lang=root.dataset.lang;");
app=app.replace('initMaps(document,lang)','initMaps(root,lang)').replace('initCarousels(document,lang);','');
app=app.replaceAll('document.querySelectorAll(','root.querySelectorAll(').replaceAll('document.querySelector(','query(');
const js=`${validation}\n${communication}\n${ui}\n${mapCode}\n${carouselCode}
const localImages=${safeJson(imageData)};
const localMapData=${safeJson(mapData)};
function bindImages(page){page.querySelectorAll('img[data-local-image]').forEach(el=>{if(!el.dataset.localBound){el.src=localImages[el.dataset.localImage];el.dataset.localBound='true';}});page.querySelectorAll('[data-local-full]').forEach(el=>el.dataset.full=localImages[el.dataset.localFull]);page.querySelectorAll('[data-local-carousel]').forEach(el=>el.dataset.carouselSrc=localImages[el.dataset.localCarousel]);}
function initLocalPage(root){
 root.querySelectorAll('[data-local-map-download]').forEach(link=>link.href=localMapData);
 const query=selector=>root.querySelector(selector.replace(/#(navigation|privacy-dialog|region-description|gallery-dialog)/g,(_,id)=>'#'+root.dataset.page+'-'+id));
 ${app}
}
document.querySelectorAll('.local-page').forEach(initLocalPage);
document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.menu-toggle').forEach(el=>el.setAttribute('aria-expanded','false'));document.querySelectorAll('nav.open').forEach(el=>el.classList.remove('open'));document.querySelectorAll('.contact-widget[open],.language-switch[open]').forEach(el=>el.removeAttribute('open'));}});
document.addEventListener('click',event=>{
 document.querySelectorAll('.contact-widget[open],.language-switch[open]').forEach(el=>{if(!el.contains(event.target))el.removeAttribute('open');});
});
function updateLocale(){
 if(document.documentElement.dataset.languageState!=='ready')return;
 let target=null;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}
 const page=target?.closest('.local-page')||document.getElementById('pt-inicio');
 bindImages(page);
 initCarousels(page,page.dataset.lang);
 document.documentElement.lang=page.dataset.lang;document.title=page.dataset.title;document.querySelector('meta[name="description"]').content=page.dataset.description;
}
window.addEventListener('hashchange',updateLocale);
document.addEventListener('ademir-language-ready',updateLocale);
updateLocale();`;
new vm.Script(js);
const localCss=`.local-page{display:none}#pt-inicio{display:block}body:has(.local-page:target:not(#pt-inicio)) #pt-inicio,body:has(.local-page:not(#pt-inicio) :target) #pt-inicio{display:none}.local-page:target,.local-page:has(:target){display:block}@supports not selector(:has(*)){.local-page{display:block}}`;
const style=css+'\n'+localCss,script=js.replaceAll('</script','<\\/script'),languageScript=(await readFile(path.join(base,'client/language.js'),'utf8')).replace(/\r\n?/g,'\n').replaceAll('</script','<\\/script');
new vm.Script(languageScript);
const csp=contentPolicy({local:true,scriptHashes:[hashScript(languageScript),hashScript(languageMountScript),hashScript(script)],styleHashes:[hashScript(style)]});
const doc=`<!doctype html><html lang="pt-BR" data-local-site="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#181B22"><meta name="description" content="Ademir Transportes em Bombinhas"><title>Ademir Transportes</title><script>${languageScript}</script><link rel="icon" href="${await embed('/assets/favicon.svg')}"><style>${style}</style></head><body>${welcome}<script>${languageMountScript}</script><div id="site-shell" class="site-shell">${bodyParts.join('\n')}</div><script>${script}</script></body></html>`;
const ids=[...doc.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
for(const match of doc.matchAll(/href="#([^"]+)"/g))assert(ids.includes(match[1]),match[1]);
assert(!/(?:src|href|data-full)="\//.test(doc));assert.equal((doc.match(/class="local-page"/g)||[]).length,10);
await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,doc);
console.log(`Exportação local: ${destination} (${(Buffer.byteLength(doc)/1024/1024).toFixed(1)} MB). Dez páginas, dois idiomas, galeria e imagens incorporadas.`);
