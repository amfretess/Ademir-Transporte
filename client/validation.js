export class RequestValidationError extends Error{
 constructor(field,code,limit){super(`Invalid request field: ${field} (${code})`);this.name='RequestValidationError';this.field=field;this.code=code;this.limit=limit;}
}
export const FIELD_LIMITS=Object.freeze({nome:100,telefone:22,origem:200,destino:200,enderecoOrigem:250,enderecoDestino:250,data:10,objetos:3000,ajudante:3,observacoes:3000,horario:5,passageiros:1,malas:2});
export const localDate=(now=new Date())=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const fail=(field,code,limit)=>{throw new RequestValidationError(field,code,limit);};
const clean=(field,value)=>{
 if(value==null)return '';
 if(typeof value!=='string')fail(field,'pattern');
 const limit=FIELD_LIMITS[field];if(value.length>limit*4)fail(field,'maxLength',limit);
 let text=Array.from(value,c=>{const n=c.codePointAt(0);return n>=0xD800&&n<=0xDFFF?'\uFFFD':c;}).join('').normalize('NFC');
 text=text.replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'');
 text=['objetos','observacoes'].includes(field)?text.split('\n').map(line=>line.replace(/[\t ]+/g,' ').trimEnd()).join('\n').replace(/\n{4,}/g,'\n\n\n').trim():text.replace(/\s+/gu,' ').trim();
 if(text.length>limit)fail(field,'maxLength',limit);
 return text;
};
const validCalendarDate=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);if(year<1000||month<1||month>12||day<1||day>31)return false;
 return new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===value;
};
export function validateField(field,value,{required=false,now=new Date()}={}){
 if(!Object.hasOwn(FIELD_LIMITS,field))fail(field,'pattern');
 const text=clean(field,value);
 if(!text){if(required)fail(field,'required');return '';}
 if(field==='telefone'){
  const digits=text.replace(/\D/g,'');
  if(!/^\+?[0-9().\s-]+$/.test(text)||digits.length<8||digits.length>15)fail(field,'phone');
  return (text.startsWith('+')?'+':'')+digits;
 }
 if(field==='data'){if(!validCalendarDate(text))fail(field,'validDate');if(text<localDate(now))fail(field,'futureDate');}
 if(field==='horario'&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text))fail(field,'validTime');
 if(field==='passageiros'&&!/^[1-4]$/.test(text))fail(field,'passengers');
 if(field==='malas'&&(!/^\d{1,2}$/.test(text)||Number(text)>20))fail(field,'range');
 if(field==='ajudante'&&!['Sim','Não'].includes(text))fail(field,'pattern');
 return text;
}
export function normalizeRequest(service,input,{now=new Date()}={}){
 if(!['fretes','taxi'].includes(service))throw new Error('Invalid service');
 if(!input||typeof input!=='object'||Array.isArray(input))fail('nome','pattern');
 const required=service==='fretes'?['nome','telefone','origem','destino','data','objetos','ajudante']:['nome','telefone','origem','destino','data','horario','passageiros','malas'];
 const optional=service==='fretes'?['enderecoOrigem','enderecoDestino','observacoes']:['observacoes'];
 const normalized=Object.create(null);
 for(const field of [...required,...optional])normalized[field]=validateField(field,Object.hasOwn(input,field)?input[field]:'',{required:required.includes(field),now});
 if(service==='taxi'&&normalized.data===localDate(now)){
  const current=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  if(normalized.horario<=current)fail('horario','futureTime');
 }
 return normalized;
}
export function createSubmissionGuard({cooldownMs=3000,now=()=>Date.now()}={}){
 let previous=null,at=-Infinity;
 return {accept(message){const time=now();if(previous===message&&time-at<cooldownMs)return false;previous=message;at=time;return true;},reset(){previous=null;at=-Infinity;}};
}
export function safeImageUrl(value,base){
 if(typeof value!=='string')return null;
 if(/^data:image\/(?:webp|avif);base64,[A-Za-z0-9+/=]+$/.test(value))return value;
 try{const url=new URL(value,base),origin=new URL(base);if(url.origin===origin.origin&&/^\/images\/(?:fretes|taxi|bombinhas|aeroportos|empresa)\/[a-z0-9-]+\.(?:webp|avif)$/.test(url.pathname)&&!url.search&&!url.hash)return url.href;}catch{}
 return null;
}
