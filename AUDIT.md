> Registro de uma revisão anterior. O acesso foi posteriormente autorizado como público; a conclusão atual está em ENTRADA-E-MAPA.md.

# Auditoria técnica — Ademir Transportes

Data: 26/10/2026. Escopo: projeto existente, dez páginas em português e espanhol, formulários, galerias, imagens públicas, exportação HTML, configurações e publicação privada existente. A identidade visual, os cinco tipos de página, as animações, os contatos e as funcionalidades foram preservados. A retirada de fotografias pendentes de revisão atende à prioridade de privacidade do briefing.

## Segurança

| Achado | Gravidade e evidência | Correção e situação |
| --- | --- | --- |
| Envio nativo dos formulários poderia usar GET quando o módulo não carregasse | Moderada: dados pessoais poderiam entrar na URL, histórico e registros de acesso. O HTML anterior não declarava método seguro nem impedia esse fallback. | `method="post"`, botões inicialmente desabilitados e habilitados após inicialização; CSP `form-action 'none'`. Os formulários continuam abrindo o WhatsApp por JavaScript. Teste com o módulo removido manteve os dados fora da URL e o envio desabilitado. |
| Validação incompleta e espalhada entre interface e montagem de mensagens | Moderada para integridade dos pedidos: entradas malformadas, datas/horários e limites poderiam passar ao gerador chamado diretamente. Não havia endpoint de processamento próprio. | Novo módulo central valida tipos, campos próprios, obrigatórios, limites, telefones de 8–15 dígitos, calendário real, datas futuras ou de hoje, horário futuro no dia atual, 1–4 passageiros, 0–20 malas e ajudante permitido. NFC, controles invisíveis e UTF-16 malformado são tratados. Erros estão em PT/ES. |
| Acionamento repetido do formulário | Baixa: abertura acidental de várias janelas com a mesma solicitação. | Bloqueio em memória e botão ocupado/desabilitado por três segundos, sem gravar dados ou identificadores. Isso não equivale a controle contra bots no servidor. |
| Placa parcial do reboque fora da máscara anterior | Alta para a privacidade exigida: as coordenadas anteriores não cobriam a placa no limite direito da fotografia. | Máscara corrigida, desfoque reforçado e todas as variantes regeneradas antes da publicação. Cinco regiões de placa foram tratadas em quatro fotografias. |
| Políticas do navegador ausentes/incompletas | Medida preventiva; a ausência não prova uma exploração de XSS. | CSP por página com hashes dos scripts JSON-LD; sem `unsafe-inline` ou `unsafe-eval`. Escape de texto/atributos e JSON seguro no build. URLs de ampliação limitadas às imagens locais aprovadas ou dados WebP/AVIF do exportador. |

**XSS:** a exibição de dados do visitante usa `textContent`. Não foi encontrada uma via comprovada de execução de HTML do visitante no código revisado. Foram testadas entradas com `<img onerror>`, `<script>`, caracteres especiais, quebras de linha e tentativa de fechamento do script JSON-LD. A mensagem exibiu os caracteres literalmente, sem criar elementos HTML. A URL usa destino fixo por serviço e um parâmetro `text` construído com `encodeURIComponent`. Parâmetros arbitrários de URL não são usados como HTML; o exportador resolve apenas IDs de página existentes.

**Segredos e arquivos:** a revisão e a verificação automatizada dos arquivos públicos não encontraram credenciais, tokens privados, `.env`, originais, relatórios internos ou scripts de diagnóstico. Não há API própria, banco de dados ou upload de visitantes. O servidor local agora só aceita GET/HEAD, bloqueia arquivos internos, caminhos inválidos e saídas do diretório permitido, inclusive por links simbólicos. Não registra conteúdo de formulários. Novos serviços de backend exigirão validação também no servidor.

**Dependências:** `npm audit --omit=dev --json` retornou zero vulnerabilidades. O projeto não possui dependências npm de execução ou desenvolvimento; o lockfile contém apenas o projeto raiz. Isso limita a superfície auditada, sem garantir ausência de falhas no navegador, Node, hospedagem ou serviços externos. Pillow é ferramenta opcional de preparação de fotos e não é distribuído como código de execução do site. A biblioteca de medição ficou exclusivamente na pasta de QA, fora da publicação.

### Cabeçalhos e dependências da hospedagem

O build gera `dist/_headers` com CSP, `frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` e Permissions-Policy desabilitando câmera, microfone, geolocalização, pagamento e USB. O servidor local aplicou essas regras nos testes. As imagens com hash têm regra de cache imutável; arquivos com nome estável devem revalidar.

A CSP em `<meta>` foi testada nas páginas e na exportação; o arquivo HTML independente usa hashes exatos para CSS/JS incorporados. Proteção por `frame-ancestors` precisa de cabeçalho HTTP e não pode ser garantida por meta. [Referência MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

**Pendente no ambiente publicado:** as requisições sem autenticação à página e aos assets retornam HTTP 401 da barreira de acesso privado. Elas não permitem inspecionar a resposta autenticada da aplicação. Portanto, não se afirma que a hospedagem aplicou todos os cabeçalhos de `_headers`. Confirmar os cabeçalhos após autenticação no ambiente definitivo e, se necessário, aplicá-los na camada de hospedagem. A compatibilidade de `_headers` depende da plataforma e não se estende automaticamente a respostas dinâmicas. [Documentação Cloudflare](https://developers.cloudflare.com/workers/static-assets/headers/).

**HSTS não foi adicionado nesta revisão:** falta verificar a política HTTPS e os subdomínios pertinentes com o responsável pela hospedagem. Não foram configurados `includeSubDomains` ou preload sem essa evidência.

### Privacidade e integrações

Os formulários solicitam dados para orçamento/combinação do transporte. Endereços detalhados de fretes e observações continuam opcionais. O código não armazena respostas, não faz requisições de coleta e só grava a preferência de idioma no navegador. A mensagem fica temporariamente na página enquanto ela está aberta. Preenchimento automático e histórico do navegador pertencem ao próprio navegador.

O aviso PT/ES foi corrigido para explicar que **abrir o WhatsApp já encaminha o conteúdo no link ao serviço externo**; o envio da mensagem ao atendimento depende do visitante. Isso evita confundir ausência de banco de dados próprio com ausência de transmissão a terceiros. Os dados e práticas internas do atendimento no WhatsApp, os registros da plataforma e os cookies de autenticação da hospedagem não foram auditados. Esta revisão não certifica conformidade jurídica integral com a LGPD.

Não existem IDs ou scripts configurados de Google Analytics, Tag Manager ou Google Ads. Assim, não há integração de analytics/conversões ativa para validar ou alegar que funciona. Não foram adicionadas tags. Fontes são locais. Google Maps é somente link externo, sem iframe ou carregamento automático. WhatsApp e links de mapas mantêm `noopener noreferrer`; os destinos foram conferidos. A introdução futura de tags exige revisar CSP, consentimento e comportamento real.

## Fotografias

Os arquivos de frota fornecidos foram confirmados pelo usuário como fotos reais apenas tratadas. Nesta revisão não houve geração, reconstrução, alteração de veículo, cenário, logotipo ou número. Foram usados os originais disponíveis, com cores e iluminação preservadas, desfoque localizado, redimensionamento e WebP qualidade 90, sem ampliação acima do original. Não foi aplicada nitidez artificial.

| Fotografia aprovada | Original disponível | Ação |
| --- | --- | --- |
| Caminhonete com reboque — `10_32_26-1.png` | 1122 × 1402 | Desfoque forte da placa dianteira; seis tamanhos. |
| Reboque carregado — `10_32_26-2.png` | 1448 × 1086 | Placa traseira da picape e placa parcial do reboque à direita; sete tamanhos. |
| Táxi em Bombinhas — `10_32_28-4.png` | 1448 × 1086 | Reforço na placa dianteira parcial; sete tamanhos. |
| Táxi no mirante — `10_32_28-5.png` | 1122 × 1402 | Reforço forte na placa dianteira; seis tamanhos. |
| `Vista-de-Bombinhas-SC.jpg` | 1920 × 1080 | Oito tamanhos; substitui também a foto comprimida da estrada no destaque. Usada no compartilhamento social. Sem placas discerníveis na inspeção. |
| Avião na pista — `360_F_1858069814_…jpg` | 641 × 360 | Quatro tamanhos, sem inventar detalhes. **Necessita original em maior resolução**, especialmente para telas com alta densidade. |
| Avião pousando — `aa2f8729…jpg` | 474 × 711 | Dois tamanhos. **Necessita substituição por original maior**; a limitação não pode ser corrigida com compressão. |

Foram geradas **40 variantes de sete fotos**. Verificação de dimensões, limites do original, hashes, remoção de EXIF/XMP e identidade dos arquivos entre `public` e `dist`: aprovada. As máscaras foram aplicadas antes de produzir qualquer variante. A inspeção ampliada dos recortes finais não apresentou caracteres legíveis. O manifesto aprovado é obrigatório no build; as variantes antigas foram retiradas das pastas públicas. Originais permanecem fora da publicação, na pasta de trabalho separada `work/photo-originals`.

### Fotos retidas para revisão/substituição

- `Imagem do ChatGPT 25 de out. de 2026, 10_32_27-3.png`: estacionamento com vários carros de terceiros. Retirada da galeria e da pasta pública até revisão manual de todas as placas ou substituição. A galeria de táxi continua funcionando com duas fotografias.
- `public.jpg`: estrada, apenas 980 × 580, compressão visível e veículos pequenos demais para delimitar placas com confiança. Retirada e substituída pela vista panorâmica já fornecida.
- `pexels-photo-23825636.jpg`: veículos de serviço ao fundo sem delimitação confiável de todas as placas. Arquivo que não era exibido foi também retirado da pasta pública e requer revisão manual antes de qualquer uso.
- `praia-de-bombinhas.jpg`: já não utilizada por conter marca d'água de terceiro; continuou fora do site.

Esses arquivos não foram liberados por simples suposição de que as placas seriam pequenas. O registro completo de coordenadas, originais, motivos e derivados está em `photo-treatment-audit.json`. Cópias baixadas antes desta revisão e o histórico de versões não são eliminados pela substituição dos arquivos atuais.

### Carregamento e galerias

`srcset` com larguras reais e `sizes` ajustado ao espaço ocupado, incluindo o recorte de cobertura da imagem principal; largura/altura declaradas; prioridade alta e carregamento imediato das imagens principais; lazy loading nas fotos fora da primeira tela. Veículos usam enquadramento que preserva sua proporção e evita cortes indevidos. A ampliação usa o maior derivado disponível, com a mesma máscara de privacidade. Galerias testadas com clique, setas do teclado, Escape e controles em viewport de celular. Gestos de toque foram preservados no código, mas não houve ensaio em aparelho físico.

## Desempenho

- Dois CSS bloqueantes por página foram consolidados em um arquivo com hash, mantendo os estilos existentes.
- O HTML independente passou a incorporar cada foto uma única vez e a associá-la à página ativa. De **18.225.698 bytes para 3.183.923 bytes: redução de 82,53%** (18,23 → 3,18 MB decimais). Fontes, fotos, dez páginas, formulários e galerias permanecem incorporados.
- Inventário de todos os derivados de imagem: **7.041.557 → 6.723.194 bytes**. Esse total inclui todos os tamanhos, não representa o download inicial de uma visita. Segurança e qualidade tiveram prioridade sobre diminuir cada arquivo.
- Sem pacotes de UI ou bibliotecas novas no runtime. O novo módulo de validação acrescenta aproximadamente 4,3 KB de JavaScript para as verificações exigidas.
- Fontes Manrope/Inter continuam locais; animações e preferência por movimento reduzido foram mantidas.

### LCP, CLS e INP medidos

Comparação final instrumentada com `web-vitals@6.2.3`, navegador desktop do ambiente, viewport 390 × 844, DPR 1, servidor em loopback, respostas sem cache, sem limitação de CPU/rede. Uma rodada comparável de cinco páginas antes e cinco depois; duas interações com o menu. Capturas de tela garantiram que houvesse pintura antes das interações. A biblioteca ficou fora do produto. [Método da biblioteca GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals).

| Página PT | LCP antes → depois | CLS antes → depois | INP antes → depois |
| --- | --- | --- | --- |
| Inicial | 1.988 → 1.868 ms | 0 → 0 | 264 → 256 ms |
| Fretes | 1.852 → 1.852 ms | 0 → 0 | 256 → 256 ms |
| Táxi | 2.276 → 1.836 ms | 0 → 0 | 256 → 264 ms |
| Sobre | 1.836 → 1.852 ms | 0 → 0 | 264 → 256 ms |
| Contato | 1.880 → 1.640 ms | 0 → 0 | 256 → 264 ms |

**Limites:** amostra pequena e tempos afetados pela automação e pelo ambiente de renderização. Não demonstram ganho estatístico, desempenho em 4G, percentil 75 de usuários reais ou uma pontuação Lighthouse. Uma rodada anterior com LCP/INP nulos por ausência de pintura foi descartada, sem substituir nulo por zero. O CLS zero refere-se apenas ao período observado. Não há dados de campo ou ensaio em celular físico; o bloqueio privado impede uma medição pública representativa. Os dois idiomas passaram pelo teste de layout, mas esta tabela de desempenho mede somente as cinco rotas PT.

Melhorias futuras: obter originais maiores das duas imagens de aviação, revisar as fotos em quarentena, confirmar cabeçalhos e cache autenticados e medir usuários reais/rede móvel no ambiente final. Não foi removida funcionalidade para melhorar resultados.

## Testes e resultados

| Verificação | Resultado |
| --- | --- |
| `node build.mjs` | Aprovado: dez páginas, catálogos PT/ES completos. |
| `node check.mjs` | Aprovado: rotas, assets, âncoras, contatos separados, mensagens, sitemap, canonical e hreflang. |
| `node tests/security.test.mjs` | Dez testes aprovados: validação, tipos, limites, datas, horários, passageiros/malas, duplicidade, URLs da galeria, XSS/JSON-LD, CSP e inventário público. |
| Quatro formulários no navegador | Aprovados com dados fictícios; texto literal, mensagem no idioma correto e WhatsApp do serviço correto. Bloqueio temporário observado; nenhuma mensagem enviada ao atendimento. |
| Falha de inicialização do módulo | Envio desabilitado e nenhum dado acrescido à URL ao pressionar Enter. |
| Dez páginas × 320/768/1440 px | Trinta verificações aprovadas, sem overflow horizontal, imagens quebradas carregadas ou H1 ausente/duplicado. Fotos lazy ainda não solicitadas não foram classificadas como quebradas. |
| Galerias | Fretes 2/2 e táxi 2/2, ampliação, teclado, Escape e botões no celular aprovados. |
| Idioma | Troca PT/ES e retorno à página inicial preservando a preferência aprovados. |
| Privacidade | Diálogo atualizado conferido; dados em memória, idioma como única preferência própria persistida. |
| Console | Sem erros ou avisos capturados nos percursos de teste do site. |
| Fotos | Sete originais aprovados, 40 variantes e cinco máscaras conferidas; três fotos pendentes fora da pasta pública. |
| Dependências | Zero vulnerabilidades informadas pelo npm; zero pacotes dependentes. |
| Servidor de prévia | GET/HEAD aprovados; POST 405; arquivos internos e caminhos de escape 404. |
| HTML independente | Sintaxe JS, hashes CSP, dez páginas, IDs únicos, âncoras e ausência de fetch externo de assets aprovados. |
| Abertura automatizada por `file://` | **Não disponível:** o navegador de automação bloqueia esse protocolo. O artefato foi verificado estaticamente; a abertura direta precisa ser feita no navegador do Windows. |
| SEO/Ads | Estrutura SEO preservada e validada. Aprovação de campanhas, indexação e conversões não foram certificadas; o site continua privado. |
| Analytics, GTM e Ads tags | Não configurados; não existe integração ativa a testar. |
| Cabeçalhos autenticados/HSTS | Pendentes da hospedagem, conforme detalhado acima. |

Os números foram conferidos no gerador, nos links e nas mensagens: **fretes (47) 99781-3000** e **táxi (47) 99730-2343**. Nenhum número foi extraído ou inventado a partir de imagens.

## Manutenção

Arquivos centrais: `client/validation.js`, `client/communication.js`, `client/app.js`, `security-policy.mjs`, `build-assets.mjs`, `tools/prepare-photos.py` e `tests/security.test.mjs`. A preparação de fotos requer Pillow e o diretório separado de originais: `python tools/prepare-photos.py --originals ../photo-originals`. Depois, executar build, testes e exportação. Não recolocar arquivos em quarentena sem nova inspeção de placas. O servidor de QA e a instrumentação de métricas não integram `dist` nem o pacote de código entregue.
