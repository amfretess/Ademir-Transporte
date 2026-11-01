import test from 'node:test';
import assert from 'node:assert/strict';
import {getSiteOrigin,DEFAULT_SITE_URL} from '../site-config.mjs';

test('origem HTTPS final aceita domínio próprio e remove a barra final',()=>{
 assert.equal(getSiteOrigin('https://ademir.example/'),'https://ademir.example');
 assert.equal(getSiteOrigin(DEFAULT_SITE_URL),DEFAULT_SITE_URL);
});
test('configuração rejeita URLs inadequadas para canonical e sitemap',()=>{
 for(const value of ['', 'http://ademir.example','https://ademir.example/fretes','https://user:pass@ademir.example','https://ademir.example?token=example','https://ademir.example#inicio','javascript:alert(1)'])
  assert.throws(()=>getSiteOrigin(value),/SITE_URL/);
});
test('domínio da produção vem da variável de build sem modificar o conteúdo',()=>{
 const before=process.env.SITE_URL;
 try{process.env.SITE_URL='https://transportes.example';assert.equal(getSiteOrigin(),'https://transportes.example');}
 finally{if(before===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=before;}
});
