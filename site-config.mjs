export const DEFAULT_SITE_URL='https://ademir-transportes-bombinhas.erickfestagames.chatgpt.site';

// Configuração de build; nenhum segredo ou configuração de servidor no navegador.
export function getSiteOrigin(value=process.env.SITE_URL??DEFAULT_SITE_URL){
 let url;
 try{url=new URL(value);}catch{throw new Error('SITE_URL deve ser uma origem HTTPS válida, por exemplo https://www.seudominio.com.br.');}
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)
  throw new Error('SITE_URL deve conter apenas a origem HTTPS, sem caminho, credenciais, query ou fragmento.');
 return url.origin;
}
