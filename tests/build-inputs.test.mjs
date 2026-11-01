import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,rmdirSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectBuildInputs} from '../tools/check-build-inputs.mjs';

test('projeto completo inclui todas as variantes e o mapa original íntegro',()=>{
 const result=inspectBuildInputs();
 assert.equal(result.status,'passed');assert.equal(result.photoVariants,88);
 assert.equal(result.mapSha256,'8afb254b3dad163ce826d61e2f259e3fd517e033055738046056d2ca1af58e10');
});
test('checkout incompleto informa caminhos ausentes antes do gerador',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'ademir-build-inputs-'));
 try{
  const result=inspectBuildInputs(root);
  assert.equal(result.status,'failed');
  for(const name of ['public/maps/region.geojson','public/maps/sources.json','photos.json','public/assets/style.css','client/app.js'])assert(result.missing.includes(name));
 }finally{rmdirSync(root);}
});
test('verificação reconhece diferença de maiúsculas também no Windows',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'ademir-build-case-'));
 mkdirSync(path.join(root,'public','maps'),{recursive:true});
 const target=path.join(root,'public','maps','Region.geojson');
 copyFileSync(fileURLToPath(new URL('../public/maps/region.geojson',import.meta.url)),target);
 try{assert(inspectBuildInputs(root).missing.includes('public/maps/region.geojson'));}
 finally{unlinkSync(target);rmdirSync(path.join(root,'public','maps'));rmdirSync(path.join(root,'public'));rmdirSync(root);}
});
