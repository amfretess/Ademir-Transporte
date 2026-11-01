import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const defaultRoot=fileURLToPath(new URL('..',import.meta.url));
const requiredBase=[
 'package.json','package-lock.json','build.mjs','photos.json','locales/es.json',
 'public/maps/region.geojson','public/maps/sources.json','public/maps/FONTES.txt',
 'public/assets/style.css','public/assets/inter-latin.woff2','public/assets/manrope-latin.woff2',
 'public/assets/FONT-LICENSE-INTER.txt','public/assets/FONT-LICENSE-MANROPE.txt',
 'client/app.js','client/language.js','client/enhancements.css','client/service-themes.css','client/carousel.css'
];

export function inspectBuildInputs(root=defaultRoot){
 root=path.resolve(root);
 const files=new Set(),required=new Set(requiredBase),issues=[];
 function walk(dir,prefix=''){
  for(const e of readdirSync(dir,{withFileTypes:true})){
   if(['.git','node_modules','dist','.cache','.wrangler','outputs','work'].includes(e.name))continue;
   const name=prefix+e.name;
   if(e.isDirectory())walk(path.join(dir,e.name),name+'/');else if(e.isFile())files.add(name);
  }
 }
 walk(root);
 const visited=new Set();
 function imports(name){
  required.add(name);
  if(visited.has(name)||!files.has(name))return;
  visited.add(name);
  const source=readFileSync(path.join(root,name),'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
   const relative=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));
   if(relative.startsWith('../')){issues.push('Import fora do projeto: '+name);continue;}
   imports(relative);
  }
 }
 imports('build.mjs');imports('client/app.js');
 let variants=0;
 if(files.has('photos.json'))try{
  const photos=JSON.parse(readFileSync(path.join(root,'photos.json'),'utf8'));
  for(const photo of Object.values(photos)){
   required.add('public'+photo.src);
   for(const variant of photo.variants){required.add('public'+variant.src);variants++;}
  }
 }catch{issues.push('photos.json inválido; preserve o manifesto original de fotografias.');}
 let mapSha256=null;
 if(files.has('public/maps/region.geojson')&&files.has('public/maps/sources.json'))try{
  const bytes=readFileSync(path.join(root,'public/maps/region.geojson'));
  const sources=JSON.parse(readFileSync(path.join(root,'public/maps/sources.json'),'utf8'));
  const data=JSON.parse(bytes.toString('utf8'));
  mapSha256=createHash('sha256').update(bytes).digest('hex');
  if(sources.sha256!==mapSha256||sources.bytes!==bytes.length)issues.push('O mapa não corresponde ao hash/tamanho de public/maps/sources.json. Reponha os arquivos originais juntos.');
  if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||!Array.isArray(data.bbox))issues.push('region.geojson não contém o conjunto geográfico esperado.');
 }catch{issues.push('Mapa ou registro de fontes inválido. Reponha os dados originais; não substitua por coordenadas inventadas.');}
 const missing=[...required].filter(name=>!files.has(name)).sort();
 return {status:missing.length||issues.length?'failed':'passed',required:required.size,photoVariants:variants,mapSha256,missing,issues};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=inspectBuildInputs();
 if(result.status==='failed'){
  console.error('Build interrompido: o checkout está incompleto ou contém dados divergentes.');
  for(const file of result.missing)console.error('AUSENTE: '+file);
  for(const issue of result.issues)console.error('DIVERGÊNCIA: '+issue);
  console.error('Confira os arquivos na branch/commit da Cloudflare e a pasta raiz do projeto. Extraia o ZIP completo e envie as pastas preservando os caminhos e maiúsculas/minúsculas.');
  process.exitCode=1;
 }else console.log(`Entradas do build verificadas: ${result.required} arquivos, ${result.photoVariants} variantes de fotos e mapa original íntegro.`);
}
