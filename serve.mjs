import http from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist',import.meta.url));
const types={'.geojson':'application/geo+json; charset=utf-8','.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.avif':'image/avif','.png':'image/png','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','X-Frame-Options':'SAMEORIGIN'};
async function securityHeaders(){
 const headers={...baseHeaders};
 try{let global=false;for(const line of (await readFile(path.join(root,'_headers'),'utf8')).split('\n')){if(!line.trim())continue;if(!/^\s/.test(line)){global=line.trim()==='/*';continue;}if(global){const colon=line.indexOf(':');if(colon>0)headers[line.slice(0,colon).trim()]=line.slice(colon+1).trim();}}}catch{}
 return headers;
}
http.createServer(async(req,res)=>{
 const headers=await securityHeaders();
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end();return;}
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1:4173').pathname);
  if(/[\x00-\x1F\\]/.test(pathname)||pathname.split('/').some(p=>p.startsWith('.')||['node_modules','originals','_headers'].includes(p)))throw Error();
  let target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep))throw Error();
  if((await stat(target)).isDirectory())target=path.join(target,'index.html');
  const relative=path.relative(await realpath(root),await realpath(target));
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error();
  const body=await readFile(target);
  res.writeHead(200,{...headers,'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{...headers,'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:'<h1>Página não encontrada</h1><a href="/">Voltar ao início</a>');}
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
