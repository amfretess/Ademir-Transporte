import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {getSiteOrigin} from '../site-config.mjs';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const origin=getSiteOrigin();
async function walk(dir,prefix=''){
 const files=[];
 for(const e of await readdir(dir,{withFileTypes:true})){
  const name=prefix+e.name;
  if(e.isDirectory())files.push(...await walk(dir+'/'+e.name,name+'/'));else files.push(name);
 }
 return files;
}
const files=await walk('dist'),names=new Set(files);
const exists=url=>{
 const path=new URL(url,origin).pathname.slice(1);
 assert(names.has(path)||names.has(path.replace(/\/$/,'')+'/index.html')||(!path&&names.has('index.html')),`Referência ausente ou com maiúsculas incorretas: ${url}`);
};
const routes=JSON.parse(await readFile('routes.json','utf8'));
assert.equal(routes.length,10);
for(const route of routes){
 const pathname=route.route==='/'?'index.html':route.route.replace(/^\/|\/$/g,'')+'/index.html';
 const html=await readFile('dist/'+pathname,'utf8');
 assert(html.includes(`<link rel="canonical" href="${origin}${route.route}">`));
 for(const locale of ['pt-BR','es','x-default'])assert(html.includes(`hreflang="${locale}"`));
 const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(json.url,origin+route.route);
 for(const m of html.matchAll(/(?:src|href|data-carousel-src)="(\/[^"#?]*)/g))exists(m[1]);
 for(const m of html.matchAll(/(?:srcset|data-carousel-srcset)="([^"]*)"/g))for(const entry of m[1].split(','))exists(entry.trim().split(/\s+/)[0]);
 for(const m of html.matchAll(/https:\/\/wa\.me\/(\d+)\?text=([^"<>]*)/g)){
  assert(['5547997813000','5547997302343'].includes(m[1]));
  assert(decodeURIComponent(m[2]).trim());
 }
}
const sitemap=await readFile('dist/sitemap.xml','utf8');
const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(locations.sort(),routes.map(r=>origin+r.route).sort());
assert((await readFile('dist/robots.txt','utf8')).includes(`Sitemap: ${origin}/sitemap.xml`));
assert(names.has('404.html')&&names.has('es/404.html'));
for(const file of files){
 assert(!/(?:^|\/)(?:\.env(?:\.|$)|\.git|node_modules|originals|review-masters)|\.(?:pem|key|pfx|p12)$/i.test(file),`Arquivo privado no build: ${file}`);
 if(file.endsWith('.css'))for(const m of (await readFile('dist/'+file,'utf8')).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){
  if(m[1].startsWith('data:'))continue;
  exists(new URL(m[1],origin+'/'+file).href);
 }
 if(/\.m?js$/.test(file))for(const m of (await readFile('dist/'+file,'utf8')).matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))exists(new URL(m[1],origin+'/'+file).href);
}
const photos=JSON.parse(await readFile('photos.json','utf8'));let variants=0;
for(const [key,p] of Object.entries(photos)){
 assert.equal(p.review,'approved-redacted',key);
 for(const v of p.variants){
  exists(v.src);const bytes=await readFile('dist'+v.src);
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  assert(v.src.includes('-'+hash+'.'),`Hash da imagem divergente: ${v.src}`);variants++;
 }
}
const headers=await readFile('dist/_headers','utf8');
assert(headers.includes('Content-Security-Policy:'));
assert(Math.max(...headers.split('\n').map(l=>l.length))<=2000,'Linha de _headers acima do limite da Pages');
const sizes=await Promise.all(files.map(async f=>({file:f,bytes:(await stat('dist/'+f)).size})));
console.log(JSON.stringify({origin,routes:routes.length,photos:Object.keys(photos).length,variants,files:files.length,totalBytes:sizes.reduce((n,f)=>n+f.bytes,0),largestFile:sizes.sort((a,b)=>b.bytes-a.bytes)[0],maxHeaderLine:Math.max(...headers.split('\n').map(l=>l.length)),status:'passed'},null,2));
