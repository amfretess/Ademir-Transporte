import {readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function bundleStyles(){
 const source=(await readFile('dist/assets/style.css','utf8'))+'\n'+await readFile('client/enhancements.css','utf8')+'\n'+await readFile('client/service-themes.css','utf8')+'\n'+await readFile('client/carousel.css','utf8');
 const hash=createHash('sha256').update(source).digest('hex').slice(0,12);
 const filename=`site-${hash}.css`;
 for(const entry of await readdir('dist/assets'))if(/^site-[a-f0-9]{12}\.css$/.test(entry)&&entry!==filename)await unlink('dist/assets/'+entry);
 await writeFile('dist/assets/'+filename,source);
 return '/assets/'+filename;
}
