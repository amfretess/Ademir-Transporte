import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {regionMap,project} from '../region-map.mjs';
const body=await readFile(new URL('../public/maps/region.geojson',import.meta.url)),data=JSON.parse(body),points=data.features.filter(f=>f.properties.role==='point'),byId=Object.fromEntries(points.map(f=>[f.properties.id,f.geometry.coordinates]));
const distance=(a,b)=>Math.hypot((a[0]-b[0])*Math.cos((a[1]+b[1])*Math.PI/360),a[1]-b[1])*111195;
test('cinco pontos geográficos reais mantêm relação norte/sul e oeste/leste',()=>{
 assert.equal(points.length,5);assert(byId.nvt[1]>byId.itapema[1]);assert(byId.itapema[1]>byId.bombinhas[1]);assert(byId.bombinhas[1]>byId.fln[1]);assert(byId['porto-belo'][0]<byId.bombinhas[0]);
 for(const f of points){assert(Number.isSafeInteger(f.properties.osmId));const [x,y]=project(f.geometry.coordinates);assert(x>0&&x<720&&y>0&&y<880);}
 assert(project(byId.nvt)[1]<project(byId.bombinhas)[1]);assert(project(byId.bombinhas)[1]<project(byId.fln)[1]);
});
test('conexões preservam o comprimento do grafo real e chegam a menos de 200m das referências',async()=>{
 const audit=JSON.parse(await readFile(new URL('../map-route-audit.json',import.meta.url),'utf8'));
 const connections=data.features.filter(f=>f.properties.role==='connection');assert.equal(connections.length,4);
 for(const f of connections){const line=f.geometry.coordinates;assert(line.length>20);assert(distance(line[0],byId.bombinhas)<200);assert(distance(line.at(-1),byId[f.properties.id])<200);let length=0;for(let i=1;i<line.length;i++)length+=distance(line[i-1],line[i]);const original=audit.routes.find(r=>r.id===f.properties.id);assert(original.sourceWayIds.length>20);assert(Math.abs(1-length/original.roadLengthMeters)<.03);}
});
test('cobertura usa três polígonos municipais e costa terrestre com dados de origem',()=>{
 const land=data.features.find(f=>f.properties.role==='land');assert.equal(land.geometry.type,'MultiPolygon');assert(land.geometry.coordinates.length>=2);
 const areas=data.features.filter(f=>f.properties.role==='coverage');assert.deepEqual(areas.map(f=>f.properties.ibge).sort(),['4202453','4208302','4213500']);assert(areas.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type)));
});
test('mapa publicado traz atribuição, dados para download, aeroportos e controles acessíveis',()=>{
 const html=regionMap();for(const name of ['Bombinhas','Porto Belo','Itapema','Florianópolis','Navegantes','OpenStreetMap contributors','IBGE'])assert(html.includes(name));
 assert(html.includes('/maps/region.geojson'));assert(html.includes('Trajetos indicativos sobre vias reais'));assert(!html.includes('Sem escala geográfica'));assert(html.includes('data-map-focus="nvt"')&&html.includes('data-map-focus="fln"'));assert(html.includes('aria-label="Ampliar mapa"'));assert(!html.includes('NaN'));
});
test('fontes e cópia pública correspondem exatamente ao conjunto geográfico distribuído',async()=>{
 const sources=JSON.parse(await readFile(new URL('../public/maps/sources.json',import.meta.url),'utf8'));assert.equal(sources.sha256,createHash('sha256').update(body).digest('hex'));assert.equal(sources.bytes,body.length);assert.deepEqual(sources.boundingBox,data.bbox);
 assert.equal(createHash('sha256').update(await readFile(new URL('../dist/maps/region.geojson',import.meta.url))).digest('hex'),sources.sha256);
});
