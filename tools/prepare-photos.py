"""Deterministic photo processing. Originals stay outside the public tree."""
from PIL import Image,ImageOps,ImageFilter
from pathlib import Path
import argparse,json,hashlib,shutil

parser=argparse.ArgumentParser()
parser.add_argument('--originals',required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
originals=Path(args.originals).resolve()
public=root/'public/images'
dist=root/'dist/images'
old=json.loads((root/'photos.json').read_text(encoding='utf-8'))
# Remove only files explicitly listed in the previous manifest, in these two roots.
for folder in (public,dist):
 for image in old.values():
  for url in {image['src'],*[v['src'] for v in image['variants']]}:
   candidate=(folder/url.removeprefix('/images/')).resolve()
   if not candidate.is_relative_to(folder.resolve()) or candidate.suffix!='.webp':raise ValueError('Unexpected asset cleanup path')
   if candidate.is_file():candidate.unlink()
 for name in ('empresa/LEIA-ME.txt',):
  candidate=folder/name
  if candidate.is_file():candidate.unlink()

items=[
 ('Imagem do ChatGPT 25 de out. de 2026, 10_32_26-1.png','fretes/fretes-caminhonete',[(0,875,165,975)],'Caminhonete identificada da Ademir Fretes com reboque'),
 ('Imagem do ChatGPT 25 de out. de 2026, 10_32_26-2.png','fretes/fretes-reboque',[(530,610,625,680),(1400,525,1448,615)],'Reboque de dois eixos com móveis transportados'),
 ('Imagem do ChatGPT 25 de out. de 2026, 10_32_28-4.png','taxi/taxi-bombinhas',[(75,590,135,735)],'Veículo branco de táxi em Bombinhas'),
 ('Imagem do ChatGPT 25 de out. de 2026, 10_32_28-5.png','taxi/taxi-veiculo',[(900,1000,1100,1110)],'Veículo de táxi com a paisagem de Bombinhas ao fundo'),
 ('Vista-de-Bombinhas-SC.jpg','bombinhas/bombinhas-vista',[],'Vista panorâmica de Bombinhas ao pôr do sol'),
 ('360_F_1858069814_x4ydhZBIyyGNnJRoYF0QgSL6H7gUuwhe.jpg','aeroportos/aviao-pista',[],'Avião em pista ao entardecer, fotografia ilustrativa'),
 ('aa2f8729a824f1a338405f19be484437.jpg','aeroportos/aviao-pouso',[],'Avião em aproximação para pouso, fotografia ilustrativa'),
]
excluded=[
 {'key':'taxi/taxi-aeroporto','source':'Imagem do ChatGPT 25 de out. de 2026, 10_32_27-3.png','status':'manual_review_required','reason':'Vários veículos de terceiros ao fundo. Não é possível delimitar com confiança todas as placas sem desfoque excessivo. Fotografia excluída do diretório público até revisão manual ou substituição.'},
 {'key':'bombinhas/bombinhas-estrada','source':'public.jpg','status':'replacement_required','reason':'Original de apenas 980 × 580 com compressão visível e veículos pequenos demais para inspecionar as placas. Substituído pela vista panorâmica de 1920 × 1080.'},
 {'key':'aeroportos/aviao-patio','source':'pexels-photo-23825636.jpg','status':'manual_review_required','reason':'Foto não utilizada, com veículos de serviço ao fundo e placas sem delimitação confiável. Retirada do diretório público; original preservado.'},
]
manifest={};audit=[]
for filename,key,boxes,alt in items:
 source=originals/filename
 image=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
 original_size=image.size
 for box in boxes:
  patch=image.crop(box)
  patch=patch.resize((max(1,patch.width//24),max(1,patch.height//20)),Image.Resampling.BOX)
  patch=patch.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(14))
  image.paste(patch,box)
 widths=sorted(set(min(image.width,w) for w in (320,480,640,800,1024,1280,1600,1920)))
 variants=[]
 for width in widths:
  version=image if width==image.width else image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS)
  import io
  stream=io.BytesIO();version.save(stream,'WEBP',quality=90,method=6)
  data=stream.getvalue();digest=hashlib.sha256(data).hexdigest()[:12]
  relative=f'{key}-{width}-{digest}.webp'
  destination=public/relative;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
  variants.append({'src':'/images/'+relative,'width':width,'height':version.height,'bytes':len(data)})
 full=variants[-1]
 manifest[key]={'src':full['src'],'width':image.width,'height':image.height,'alt':alt,'variants':variants,'review':'approved-redacted','originalWidth':original_size[0],'originalHeight':original_size[1]}
 audit.append({'source':filename,'key':key,'original_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'original_resolution':list(original_size),'blur_regions':boxes,'public_variants':[v['src'] for v in variants],'status':'approved-redacted','notes':'Revisão visual ampliada; desfoque localizado forte antes de gerar qualquer variante. Sem recriação de detalhes, alteração do veículo, adesivos ou telefones.' if boxes else 'Sem placas identificáveis na fotografia; iluminação e cores do original preservadas.','quality_limitation':'Original de baixa resolução: solicitar substituição em maior resolução.' if image.width<800 else None})
(root/'photos.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'photo-treatment-audit.json').write_text(json.dumps({'approved':audit,'excluded':excluded},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(manifest)} fotografias aprovadas; {sum(len(i["variants"]) for i in manifest.values())} variantes; 3 fotografias fora da publicação. Originais preservados.')
