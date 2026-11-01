"""Deterministic, non-generative processing of user-supplied original photographs.

Only copies and derivatives are written underneath this work directory. The input
folder is read-only to this script. No generative fill, sky replacement, artificial
detail recovery, stretching or upscaling is used.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
import hashlib, json, math, shutil, struct

import argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--originals',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
HERE=Path(args.output).resolve()
SRC=Path(args.originals).resolve()
if HERE==SRC or HERE.is_relative_to(SRC): raise ValueError('Output must be outside the originals directory')
ORIGINALS=HERE/'originals-preserved'
PUBLIC=HERE/'public-ready'/'images'
MASTERS=HERE/'review-masters'
PROOF=HERE/'review-proof'
for folder in [ORIGINALS,PUBLIC,MASTERS,PROOF]: folder.mkdir(parents=True,exist_ok=True)

def sha(data): return hashlib.sha256(data).hexdigest()

def boxes(data,start,end):
    pos=start
    while pos+8<=end:
        size,kind=struct.unpack_from('>I4s',data,pos);header=8
        if size==1:
            if pos+16>end: break
            size=struct.unpack_from('>Q',data,pos+8)[0];header=16
        elif size==0: size=end-pos
        if size<header or pos+size>end: break
        yield kind.decode('ascii',errors='replace'),pos+header,pos+size
        pos+=size

def mp4_metadata(data):
    found={}
    def visit(start,end):
        for kind,payload,finish in boxes(data,start,end):
            if kind in ['moov','trak','mdia']: visit(payload,finish)
            elif kind=='mvhd':
                version=data[payload]
                timescale=struct.unpack_from('>I',data,payload+(20 if version==1 else 12))[0]
                duration=struct.unpack_from('>Q' if version==1 else '>I',data,payload+(24 if version==1 else 16))[0]
                found['duration_seconds']=duration/timescale if timescale else None
            elif kind=='tkhd' and finish-payload>=8:
                width,height=struct.unpack_from('>II',data,finish-8)
                if width and height: found.update(width=width/65536,height=height/65536)
    visit(0,len(data))
    return found

# Mask coordinates are hand-reviewed in the full-resolution original coordinate
# system, before a crop or resize. Masks expand slightly beyond each plate edge.
PLATE_CARGA=[(526,1062),(597,1083),(574,1128),(505,1104)]
PLATE_REBOQUE=[(600,696),(659,671),(674,707),(613,731)]
PLATE_MIRANTE=[(1028,1124),(1152,1110),(1140,1184),(1021,1198)]
PLATE_CAMPO=[(107,1014),(188,993),(213,1073),(133,1092)]
# Tiny plate/bumber regions of parked third-party cars. Their characters already
# have insufficient source detail, but the localized regions are still defocused.
AIRPORT_ZONES=[(184,549,197,559),(211,551,224,559),(273,552,286,560),
 (321,551,332,559),(360,549,375,558),(421,550,434,558),(486,549,498,558),
 (945,562,958,570),(989,567,1004,576),(1026,563,1038,571),
 (1052,565,1065,573),(1107,565,1122,574),(1146,570,1159,579),
 (1198,569,1210,578),(1245,567,1259,577),(1295,570,1310,580),
 (1345,570,1358,579),(1395,571,1410,581),(1444,571,1458,581)]

CONFIG=[
 dict(key='fretes/real-mudanca',file='WhatsApp Image 2026-10-24 at 16.18.17.jpeg',
      crop=(0,150,1528,1460),brightness=1.055,contrast=1.01,
      alt='Caminhonete da Ademir Fretes com reboque de dois eixos durante uma mudança',
      altEs='Camioneta de Ademir Fretes con remolque de dos ejes durante una mudanza',
      notes='Retirados somente excessos de céu e piso. Mantida a inclinação real para não cortar a caminhonete ou a carga. Placas fora do ângulo de visão.',
      slots=['freight hero','home freight secondary']),
 dict(key='fretes/real-reboque',file='WhatsApp Image 2026-10-24 at 16.18.18.jpeg',
      crop=(0,80,1600,1120),plates=[PLATE_REBOQUE],
      alt='Caminhonete e reboque da Ademir Fretes com móveis protegidos para transporte',
      altEs='Camioneta y remolque de Ademir Fretes con muebles protegidos para su transporte',
      notes='Recorte leve de fachada e piso, preservando caminhonete, reboque e móveis. Exposição e cores mantidas.',
      slots=['freight hero','home freight primary']),
 dict(key='fretes/real-madeira',file='WhatsApp Image 2026-10-24 at 16.18.18 (2).jpeg',
      crop=(0,620,899,1340),gamma=.97,
      alt='Detalhe do reboque de dois eixos transportando madeira',
      altEs='Detalle del remolque de dos ejes transportando madera',
      notes='Enquadramento de detalhe da carga e reboque. O recorte remove integralmente a pessoa que aparece distante no original. Sombras levantadas discretamente; sem placas visíveis no enquadramento final.',
      slots=['home freight secondary','freight gallery']),
 dict(key='fretes/real-carga',file='WhatsApp Image 2026-10-24 at 16.18.15.jpeg',
      crop=(0,400,899,1230),plates=[PLATE_CARGA],brightness=1.025,
      alt='Detalhe da caminhonete Ademir Fretes transportando uma caixa de água',
      altEs='Detalle de la camioneta Ademir Fretes transportando un depósito de agua',
      notes='Enquadramento de detalhe da caçamba e carga, sem tentar reconstruir a frente já ausente no original. Exposição elevada 2,5%.',
      slots=['freight gallery']),
 dict(key='taxi/real-aeroporto',file='WhatsApp Image 2026-10-24 at 22.20.53 (2).jpeg',
      crop=(160,425,1450,1080),zones=AIRPORT_ZONES,brightness=1.025,contrast=1.01,
      alt='Táxi branco fotografado de perfil em frente a um terminal de aeroporto',
      altEs='Taxi blanco fotografiado de perfil frente a una terminal de aeropuerto',
      notes='Removidos céu e piso excedentes e o carro parcialmente visível à esquerda. Carro principal completo. Zonas minúsculas de placas dos veículos estacionados ao fundo também receberam desfoque localizado.',
      slots=['taxi hero primary']),
 dict(key='taxi/real-bombinhas',file='WhatsApp Image 2026-10-24 at 22.20.53.jpeg',
      crop=(0,0,1600,1120),gamma=.95,contrast=1.01,
      alt='Táxi branco da Ademir Transportes junto ao letreiro de Bombinhas',
      altEs='Taxi blanco de Ademir Transportes junto al letrero de Bombinhas',
      notes='Recorte apenas do piso inferior. Sombras do contraluz levantadas discretamente, preservando o aspecto real. Ângulo lateral não mostra placas. O limite traseiro do enquadramento original não foi inventado.',
      slots=['taxi hero secondary']),
 dict(key='taxi/real-mirante',file='WhatsApp Image 2026-10-24 at 22.20.54.jpeg',
      crop=(215,420,1200,1380),plates=[PLATE_MIRANTE],
      alt='Táxi branco com identificação no teto e vista do mar de Bombinhas ao fundo',
      altEs='Taxi blanco con identificación en el techo y vista del mar de Bombinhas al fondo',
      notes='Recorte manual remove poste e céu excedente, preservando veículo, identificação do táxi, mar e vegetação reais. Exposição e cores já adequadas foram mantidas.',
      slots=['home taxi primary','taxi gallery']),
 dict(key='taxi/real-campo',file='WhatsApp Image 2026-10-29 at 08.28.03 (1).jpeg',
      crop=(30,320,1170,1260),plates=[PLATE_CAMPO],
      alt='Táxi branco estacionado em área arborizada, visto de frente e de lado',
      altEs='Taxi blanco estacionado en una zona arbolada, visto de frente y de lado',
      notes='Recorte manual reduz céu e chão excedentes sem cortar o veículo. Luz quente natural mantida. Inclinação da captura preservada porque endireitar exigiria cortes prejudiciais ou preenchimento artificial.',
      slots=['home taxi secondary','taxi gallery']),
]

DISCARDED={
 'WhatsApp Image 2026-10-24 at 16.18.16 (1).jpeg':'Retrato muito inclinado e repetição do serviço de mudança. Exigiria um corte ruim para os espaços principais; escolhidos registros completos mais adequados.',
 'WhatsApp Image 2026-10-24 at 16.18.16.jpeg':'Frente cortada no original, porta aberta e forte inclinação. Escolhido conjunto caminhonete/reboque mais completo.',
 'WhatsApp Image 2026-10-24 at 16.18.17 (1).jpeg':'Mesma cena da mudança com enquadramento cortando a frente e menor resolução. Preferido o original mais amplo 16.18.17.jpeg.',
 'WhatsApp Image 2026-10-24 at 16.18.17 (2).jpeg':'Pessoa identificável próxima ao reboque, sem autorização específica de imagem. Não publicada; revisão humana necessária se desejar utilizá-la.',
 'WhatsApp Image 2026-10-24 at 16.18.17 (3).jpeg':'Frente da caminhonete ausente no enquadramento e veículo de terceiro com placa ao fundo. Não acrescenta um enquadramento melhor que os escolhidos.',
 'WhatsApp Image 2026-10-24 at 16.18.18 (1).jpeg':'Retrato da caminhonete com prancha, com veículo e prancha cortados no original. Crop para os espaços disponíveis perderia elementos importantes.',
 'WhatsApp Image 2026-10-24 at 22.20.53 (1).jpeg':'Foto do exterior em garagem, frente cortada e contraluz forte. Não é uma foto do interior. Preferidos registros externos mais completos.',
 'WhatsApp Image 2026-10-24 at 22.20.54 (1).jpeg':'Quase duplicata visual da foto 22.20.53.jpeg, com compressão diferente. Uma única versão da cena do letreiro foi selecionada.',
 'WhatsApp Image 2026-10-29 at 08.28.03 (2).jpeg':'Forte inclinação, muito espaço de árvores e frente do táxi já cortada no original. Preferida a foto 08.28.03 (1) com veículo completo.',
 'WhatsApp Image 2026-10-29 at 08.28.03.jpeg':'Frente e limite traseiro cortados no original. Registro lateral próximo repete o veículo sem melhorar os espaços disponíveis.',
 'WhatsApp Image 2026-10-29 at 08.28.04.jpeg':'Duplicata binária exata de WhatsApp Image 2026-10-24 at 22.20.53 (2).jpeg. Não carregada novamente.',
}

def redact(im,poly=None,box=None):
    if poly:
        box=(math.floor(min(p[0] for p in poly))-2,math.floor(min(p[1] for p in poly))-2,
             math.ceil(max(p[0] for p in poly))+3,math.ceil(max(p[1] for p in poly))+3)
    l,t,r,b=box
    region=im.crop(box)
    # A severely low-pass region cannot retain the character shapes. Gaussian
    # finishing gives an ordinary defocus appearance rather than sharp blocks.
    region=region.resize((2,2),Image.Resampling.BOX).resize(region.size,Image.Resampling.BILINEAR).filter(ImageFilter.GaussianBlur(max(2,min(region.size)/7)))
    mask=Image.new('L',region.size,0)
    d=ImageDraw.Draw(mask)
    if poly:d.polygon([(x-l,y-t)for x,y in poly],fill=255)
    else:d.rectangle((0,0,region.width,region.height),fill=255)
    if poly:mask=mask.filter(ImageFilter.GaussianBlur(.65))
    im.paste(region,(l,t),mask)
    return box

inventory=[]
before_hashes={}
for file in sorted(SRC.iterdir()):
    if file.suffix.lower() not in ['.jpeg','.jpg','.mp4']:continue
    data=file.read_bytes();digest=sha(data);before_hashes[file.name]=digest
    destination=ORIGINALS/file.name
    if not destination.exists():shutil.copy2(file,destination)
    assert sha(destination.read_bytes())==digest
    row=dict(file=file.name,sha256=digest,bytes=len(data))
    if file.suffix.lower()=='.mp4':
        row.update(status='not-used',reason='Briefing solicita carrosséis fotográficos; nenhum player de vídeo foi pedido. Preservado sem publicar ou extrair quadros.',metadata=mp4_metadata(data))
    elif file.name in DISCARDED:row.update(status='not-used',reason=DISCARDED[file.name])
    else:row['status']='used'
    inventory.append(row)

manifest={};audit=[];translations={}
for config in CONFIG:
    source=SRC/config['file'];original=ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    im=original.copy();redactions=[]
    for poly in config.get('plates',[]):redactions.append(dict(kind='vehicle-plate',polygon=poly,box=redact(im,poly=poly)))
    for box in config.get('zones',[]):redactions.append(dict(kind='distant-third-party-plate-zone',box=redact(im,box=box)))
    crop=config['crop'];assert 0<=crop[0]<crop[2]<=im.width and 0<=crop[1]<crop[3]<=im.height
    im=im.crop(crop)
    if config.get('gamma',1)!=1:
        gamma=config['gamma'];lut=[round(255*(n/255)**gamma)for n in range(256)];im=im.point(lut*3)
    if config.get('brightness',1)!=1:im=ImageEnhance.Brightness(im).enhance(config['brightness'])
    if config.get('contrast',1)!=1:im=ImageEnhance.Contrast(im).enhance(config['contrast'])
    service,slug=config['key'].split('/')
    localmaster=MASTERS/(slug+'.jpg');im.save(localmaster,quality=94,subsampling=0,optimize=True,progressive=True)
    sizes=[w for w in [320,480,640,800,1024,1280,1600]if w<=im.width]
    if sizes and im.width!=sizes[-1] and im.width/sizes[-1]<1.06:sizes[-1]=im.width
    elif im.width not in sizes:sizes.append(im.width)
    rows=[]
    (PUBLIC/service).mkdir(parents=True,exist_ok=True)
    for width in sizes:
        height=round(im.height*width/im.width)
        variant=im.resize((width,height),Image.Resampling.LANCZOS) if width!=im.width else im.copy()
        if width<im.width:variant=variant.filter(ImageFilter.UnsharpMask(radius=.6,percent=25,threshold=4))
        temp=PUBLIC/service/(slug+'-temporary.webp')
        variant.save(temp,'WEBP',quality=82,method=6)
        raw=temp.read_bytes();digest=sha(raw)[:12];name=f'{slug}-{width}-{digest}.webp';target=PUBLIC/service/name;temp.replace(target)
        rows.append(dict(src=f'/images/{service}/{name}',width=width,height=height,bytes=len(raw)))
    main=rows[-1]
    manifest[config['key']]={**{key:main[key]for key in ['src','width','height']},'alt':config['alt'],'altEs':config['altEs'],'variants':rows,'review':'approved-redacted','originalWidth':original.width,'originalHeight':original.height,'fit':'contain','objectPosition':'center'}
    translations[config['alt']]=config['altEs']
    audit.append(dict(key=config['key'],source=config['file'],source_sha256=before_hashes[config['file']],originalSize=list(original.size),crop=list(crop),finalSize=list(im.size),redactions=redactions,brightness=config.get('brightness',1),contrast=config.get('contrast',1),gamma=config.get('gamma',1),whiteBalance='unchanged: no correction warranted',saturation='unchanged',denoise='none: no heavy smoothing warranted',sharpening='Only downscaled responsive variants: unsharp radius 0.6, 25%, threshold 4',rotation='none: no destructive straightening or filled corners',notes=config['notes'],recommendedSlots=config['slots'],recommendedFit='contain; central alignment; neutral matte; same safe crop on desktop/mobile',master=str(localmaster.relative_to(HERE)).replace('\\','/'),variants=rows))
    # Review images are local-only and already redacted. They are never placed
    # alongside public-ready derivatives.
    preview=im.copy();preview.thumbnail((1000,750),Image.Resampling.LANCZOS);preview.save(PROOF/(slug+'.png'))
    for index,item in enumerate(redactions):
        if item['kind']!='vehicle-plate':continue
        box=item['box'];margin=15
        rect=(max(crop[0],box[0]-margin)-crop[0],max(crop[1],box[1]-margin)-crop[1],min(crop[2],box[2]+margin)-crop[0],min(crop[3],box[3]+margin)-crop[1])
        review=Image.open(localmaster).crop(rect);review=review.resize((review.width*3,review.height*3),Image.Resampling.NEAREST);review.save(PROOF/(slug+f'-plate-{index+1}.png'))

groups={'freightHero':['fretes/real-mudanca','fretes/real-reboque'],'taxiHero':['taxi/real-aeroporto','taxi/real-bombinhas'],'homeFreight':['fretes/real-reboque','fretes/real-madeira'],'homeTaxi':['taxi/real-mirante','taxi/real-campo'],'freightGallery':['fretes/real-carga','fretes/real-madeira'],'taxiGallery':['taxi/real-mirante','taxi/real-campo']}
for file,digest in before_hashes.items():assert sha((SRC/file).read_bytes())==digest
for file in PUBLIC.rglob('*.webp'):
    out=Image.open(file);assert out.format=='WEBP' and not out.getexif()
result={'method':'Traditional deterministic Pillow processing; no generative model or synthetic scene/detail used.','date':'2026-10-29','originals_preserved':True,'originals_unchanged_verified':True,'no_upscale':True,'publicFiles':sum(1 for _ in PUBLIC.rglob('*.webp')),'publicBytes':sum(p.stat().st_size for p in PUBLIC.rglob('*.webp')),'inventory':inventory,'used':audit,'groups':groups,'limits':['Não há fotografia de interior do táxi no lote.','Pessoas sem autorização não foram publicadas; uma presença distante foi removida exclusivamente pelo recorte documentado.','Fotos com forte inclinação não foram artificialmente endireitadas ou preenchidas.','Fotos de detalhe não devem ser usadas como fotografia de veículo inteiro.']}
(HERE/'photos-additions.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'photo-translations-es.json').write_text(json.dumps(translations,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'carousel-photo-groups.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'carousel-photo-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=['# Fotografias reais dos carrosséis — tratamento e enquadramento','', 'Data: 29/10/2026. Oito fotografias escolhidas dentre 19 JPEG. Nenhuma imagem foi gerada por IA.','', '## Originais e método','', 'Os 19 JPEG e o MP4 foram preservados integralmente em `originals-preserved/`, fora da pasta pública. Os hashes SHA-256 dos arquivos de entrada foram conferidos antes e depois. Não houve alterações nos originais.','', 'Foram usados somente recortes manuais, ajustes tonais leves quando necessários, desfoque localizado de placas, redução proporcional Lanczos, nitidez leve nas versões reduzidas e compressão WebP. Nada foi esticado ou ampliado. EXIF não é incluído nos arquivos públicos.','', '## Fotos utilizadas','']
for item in audit:
    lines.extend([f"### {item['key']}",'',f"Original: `{item['source']}`. Dimensões {item['originalSize'][0]} × {item['originalSize'][1]}; recorte {item['crop']}; final {item['finalSize'][0]} × {item['finalSize'][1]}.",'',item['notes'],'',f"Tratamento: brilho {item['brightness']}; contraste {item['contrast']}; gama {item['gamma']}. Balanço de branco e saturação mantidos. Máscaras: {len(item['redactions'])}. WebP em {', '.join(str(v['width']) for v in item['variants'])} px.",'','Usar `contain` e alinhamento central no quadro estável, com fundo neutro. Não aplicar novo crop automático em mobile. O enquadramento seguro mantém os elementos principais nas duas telas.',''])
lines.extend(['## Imagens não utilizadas',''])
for row in inventory:
    if row['status']=='not-used':lines.append(f"- `{row['file']}`: {row['reason']}"+(f" Metadados do vídeo: {row['metadata']}."if 'metadata'in row else''))
lines.extend(['','## Privacidade e revisão','', 'Placas próximas foram reduzidas a informação de cor de 2 × 2 pixels e receberam Gaussian blur sob máscara localizada, sem alterar carro, logotipo ou telefone. Regiões minúsculas de placas de terceiros no estacionamento ao fundo do aeroporto receberam tratamento localizado adicional. A maior versão final e ampliações das áreas redigidas estão em `review-proof/`, para revisão visual antes da integração.','', 'Não há foto de interior no lote. A foto com pessoa próxima do reboque foi excluída, e o pequeno vulto ao fundo da madeira foi totalmente removido pelo enquadramento; se houver interesse em usar esses originais completos, é necessária revisão da autorização.','',f"Total de derivados: {result['publicFiles']} WebP; {result['publicBytes']:,} bytes. Arquivos públicos somente em `public-ready/images/`. Manifests e documentos ficam fora da pasta pública."])
(HERE/'FOTOS-CARROSSEIS.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({key:result[key]for key in ['originals_unchanged_verified','publicFiles','publicBytes']},indent=2))
