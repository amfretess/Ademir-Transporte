import {createHash} from 'node:crypto';
export const hashScript=text=>`'sha256-${createHash('sha256').update(text).digest('base64')}'`;
export const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const safeJson=value=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
export function contentPolicy({scriptHashes=[],styleHashes=[],local=false,framing=false}={}){
 return ["default-src 'none'","base-uri 'none'","object-src 'none'",`script-src ${[...(local?[]:["'self'"]),...scriptHashes].join(' ')||"'none'"}`,`style-src ${[...(local?[]:["'self'"]),...styleHashes].join(' ')||"'none'"}`,`img-src ${local?'data:':"'self' data:"}`,`font-src ${local?'data:':"'self'"}`,"connect-src 'none'","frame-src 'none'","worker-src 'none'","form-action 'none'",...(framing?["frame-ancestors 'self'"]:[])].join('; ');
}
export function headerRules(scriptHashes){
 const policy=contentPolicy({scriptHashes:[...new Set(scriptHashes)],framing:true});
 return `/*\n  Content-Security-Policy: ${policy}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n  X-Frame-Options: SAMEORIGIN\n\n/images/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/assets/*\n  Cache-Control: public, max-age=0, must-revalidate\n`;
}
