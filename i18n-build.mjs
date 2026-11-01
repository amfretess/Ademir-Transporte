import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {escapeHtml,safeJson,hashScript,contentPolicy,headerRules} from './security-policy.mjs';
import {welcomeScreen,languageMountScript} from './language-welcome.mjs';
const pairs=[['/','/es/'],['/fretes','/es/fletes'],['/taxi','/es/taxi'],['/sobre','/es/nosotros'],['/contato','/es/contacto']];
const proper=new Set(['Ademir Transportes','ADEMIR','TRANSPORTES','Bombinhas','Itapema','Porto Belo','Florianópolis','Navegantes','Morrinhos','Santa Catarina','Bombinhas, Santa Catarina','Bombinhas, Santa Catarina.','Bombinhas · Santa Catarina','Rua Lavanda, 76 · Morrinhos','Bombinhas, SC','FLN','NVT','WhatsApp','Português (Brasil)','Español','PT-BR','ES','SC','BR','BR-101','IBGE','OpenStreetMap contributors','N','10 km']);
const normalize=s=>s.replace(/\s+/g,' ').trim();
export async function renderBilingual(pages,header,footer,schema,origin,{stylesheet='/assets/style.css',logo='Ademir Transportes'}={}){
  await mkdir('locales',{recursive:true});
  let es={};try{es=JSON.parse(await readFile('locales/es.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const catalog=new Set(),missing=new Set();
  const t=(value,lang)=>{
    const key=normalize(value);
    if(!key||!/[A-Za-zÀ-ÿ]/.test(key)||proper.has(key))return value;
    catalog.add(key);
    if(lang!=='es')return value;
    if(!Object.hasOwn(es,key)){missing.add(key);return value;}
    return value.replace(/\S[\s\S]*\S|\S/,es[key]);
  };
  const esRoute=route=>pairs.find(p=>p[0]===route)?.[1]||route;
  const translate=html=>html.replace(/<script\b[\s\S]*?<\/script>|<[^>]+>|[^<]+/g,token=>{
    if(token.startsWith('<script'))return token;
    if(!token.startsWith('<'))return escapeHtml(t(token,'es'));
    token=token.replace(/\b(alt|aria-label|aria-roledescription|placeholder|title|data-caption)="([^"]*)"/g,(_,attr,value)=>`${attr}="${escapeHtml(t(value,'es'))}"`);
    if(/^<meta\b/.test(token)&&/(?:name|property)="(?:description|og:title|og:description)"/.test(token))token=token.replace(/content="([^"]*)"/,(_,value)=>`content="${escapeHtml(t(value,'es'))}"`);
    token=token.replace(/\bhref="(\/[^"\s]*)"/g,(_,href)=>{const [path,anchor]=href.split('#');return `href="${esRoute(path)}${anchor?'#'+anchor:''}"`;});
    token=token.replace(/\bhref="(https:\/\/wa\.me\/[^\"]+)"/g,(_,href)=>{const url=new URL(href);const message=url.searchParams.get('text');if(message)url.searchParams.set('text',t(message,'es'));return `href="${url.toString()}"`;});
    return token;
  });
  const selector=(route,lang)=>{const pt=route,spanish=esRoute(route);return `<details class="language-switch"><summary aria-label="${lang==='es'?'Seleccionar idioma':'Selecionar idioma'}"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span>${lang==='es'?'ES':'PT-BR'}</span><span aria-hidden="true">⌄</span></summary><div class="language-options"><a href="${pt}" data-language="pt-BR" hreflang="pt-BR" lang="pt-BR" ${lang!=='es'?'aria-current="true"':''}>Português (Brasil)</a><a href="${spanish}" data-language="es" hreflang="es" lang="es" ${lang==='es'?'aria-current="true"':''}>Español</a><button type="button" data-language-reset>${lang==='es'?'Volver a la selección inicial':'Reabrir seleção inicial'}</button></div></details>`;};
  const languageCode=(await readFile('client/language.js','utf8')).replace(/\r\n?/g,'\n').replaceAll('</script','<\\/script');
  const entryHashes=[hashScript(languageCode),hashScript(languageMountScript)];
  const allPages=[],scriptHashes=[...entryHashes];
  const photos=JSON.parse(await readFile('photos.json','utf8'));
  const social=photos['bombinhas/bombinhas-vista'];
  for(const page of pages)for(const lang of ['pt-BR','es']){
    const route=lang==='es'?esRoute(page.route):page.route;
    let body=header(page.route)+`<main id="main">${page.html}</main>`+footer();
    // Catalog PT text with the exact same parser used by Spanish rendering.
    if(lang==='es')body=translate(body);
    body=body.replace('</nav>',selector(page.route,lang)+'</nav>');
    const title=t(page.title,lang),description=t(page.description,lang);
    const data=structuredClone(schema);data.url=origin+route;data.inLanguage=lang;
    data.description=t(data.description,lang);
    data.contactPoint.forEach(p=>p.contactType=t(p.contactType,lang));
    const json=safeJson(data),scriptHash=hashScript(json);scriptHashes.push(scriptHash);
    const csp=contentPolicy({scriptHashes:[scriptHash,...entryHashes]});
    const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#181B22"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${origin}${route}"><link rel="alternate" hreflang="pt-BR" href="${origin}${page.route}"><link rel="alternate" hreflang="es" href="${origin}${esRoute(page.route)}"><link rel="alternate" hreflang="x-default" href="${origin}${page.route}"><meta property="og:type" content="website"><meta property="og:locale" content="${lang==='es'?'es_ES':'pt_BR'}"><meta property="og:locale:alternate" content="${lang==='es'?'pt_BR':'es_ES'}"><meta property="og:site_name" content="Ademir Transportes"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${origin}${route}"><meta property="og:image" content="${origin}${social.src}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="/assets/manrope-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/inter-latin.woff2" as="font" type="font/woff2" crossorigin><script>${languageCode}</script><link rel="stylesheet" href="${stylesheet}"><script type="application/ld+json">${json}</script>`;
    const dir=route==='/'?'dist':`dist${route.replace(/\/$/,'')}`;
    await mkdir(dir,{recursive:true});
    await writeFile(`${dir}/index.html`,`<!doctype html><html lang="${lang}"><head>${head}</head><body>${welcomeScreen(logo)}<script>${languageMountScript}</script><div id="site-shell" class="site-shell" data-service-theme="${page.route==='/taxi'?'taxi':page.route==='/fretes'?'fretes':'brand'}">${body}</div></body></html>`);
    allPages.push({route,lang,title,description});
  }
  await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${allPages.map(p=>{const pair=pairs.find(pair=>pair.includes(p.route));return `<url><loc>${origin}${p.route}</loc><xhtml:link rel="alternate" hreflang="pt-BR" href="${origin}${pair[0]}"/><xhtml:link rel="alternate" hreflang="es" href="${origin}${pair[1]}"/></url>`;}).join('')}</urlset>`);
  await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  const notFound='<section class="page-heading"><div class="container"><p class="eyebrow light">404 · VAMOS RETOMAR O CAMINHO</p><h1>Esse destino não foi encontrado.</h1><p>Acesse o início para encontrar seu transporte.</p><a class="button primary" href="/">Voltar ao início</a></div></section>';
  for(const lang of ['pt-BR','es']){let body=header('')+`<main id="main">${notFound}</main>`+footer();if(lang==='es')body=translate(body);body=body.replace('</nav>',selector('/',lang)+'</nav>');const title=t('Página não encontrada | Ademir Transportes',lang);await writeFile(`dist/${lang==='es'?'es/':''}404.html`,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentPolicy())}"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="${stylesheet}"></head><body>${body}</body></html>`);}
  await writeFile('dist/_headers',headerRules(scriptHashes));
  await writeFile('locales/pt-BR.json',JSON.stringify(Object.fromEntries([...catalog].sort().map(key=>[key,key])),null,2)+'\n');
  await writeFile('locales/missing-es.json',JSON.stringify([...missing].sort(),null,2)+'\n');
  await writeFile('routes.json',JSON.stringify(allPages,null,2)+'\n');
  if(missing.size&&!process.argv.includes('--collect-i18n'))throw Error(`Faltam ${missing.size} traduções em locales/es.json. Consulte locales/missing-es.json.`);
}
