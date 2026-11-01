# Carrosséis e fotografias reais — Ademir Transportes

Atualização de 29/10/2026, no projeto existente e com o mesmo acesso público.

## Resultado e locais

Foram integrados quatro carrosséis, sem novas seções: os espaços de fotografia dos dois cards da página inicial, o destaque da página de fretes e o destaque da página de táxi. As versões em espanhol usam os mesmos componentes. Os quadros mantêm suas dimensões entre as trocas.

| Local | Fotografias |
| --- | --- |
| Início — fretes | `fretes/real-reboque`, `fretes/real-madeira` |
| Início — táxi | `taxi/real-mirante`, `taxi/real-campo` |
| Hero de fretes | `fretes/real-mudanca`, `fretes/real-reboque` |
| Hero de táxi | `taxi/real-aeroporto`, `taxi/real-bombinhas` |
| Galeria de fretes, ampliável | `fretes/real-carga`, `fretes/real-madeira` |
| Galeria de táxi, ampliável | `taxi/real-mirante`, `taxi/real-campo` |

Os cards da home funcionam como prévias dos serviços; essa é a razão da reutilização de algumas fotos nas páginas de detalhe. Sobre e frota também passam a usar os registros originais novos. A foto panorâmica da home e as fotografias ilustrativas de aviação foram preservadas. Fretes continua vermelho/grafite; táxi usa amarelo `#F5BF25` e grafite `#25282D`.

## Comportamento

Troca automática a cada cinco segundos em condições normais, com fade de 600 ms. Há setas, indicadores, contador e controle de pausa/retomada. Mouse sobre o quadro e foco de teclado pausam temporariamente; navegação manual e interação por toque suspendem a troca até a retomada explícita. Setas do teclado, Home/End e gesto horizontal são atendidos. Toque vertical continua permitindo rolar a página.

Carrosséis fora da tela ou em documento oculto não ficam avançando. A reprodução espera a primeira foto carregar. A segunda fotografia não tem `src` inicial: só é requisitada quando necessária. A próxima imagem é decodificada antes de substituir a atual; uma conexão lenta não mostra um quadro vazio nem provoca trocas rápidas para recuperar atraso. Pausar durante uma requisição automática pendente cancela aquela troca.

Com `prefers-reduced-motion`, o estado inicial é pausado e o fade é removido; a navegação manual continua disponível. O usuário pode habilitar a troca, mantendo as transições sem animação. Sem JavaScript, permanece a primeira foto de cada espaço. Os controles são habilitados somente depois de inicializados, com espaço reservado desde o início.

## Fotografias e enquadramentos

Oito fotografias reais foram selecionadas dentre 19 JPEG; foram geradas 48 variantes WebP, somando 4.608.056 bytes. Não houve geração por IA, alteração de cenário, reconstrução de veículos ou ampliação. Os originais, incluindo o MP4, foram preservados fora da pasta pública, com hashes conferidos.

Foram usados recortes manuais, pequenos ajustes tonais quando necessários, nitidez leve após redução e desfoque localizado de placas. EXIF não é incluído nos derivados. O tratamento, máscaras, recorte e tamanhos de **cada fotografia** estão descritos em `FOTOS-CARROSSEIS.md` e `carousel-photo-audit.json`.

As proporções finais variam de acordo com a composição real. O componente centraliza as fotos com `contain` sobre superfície neutra, evitando novos cortes automáticos no desktop e no celular. Foram inspecionados tanto os WebP finais em quadros largos/estreitos quanto os componentes reais. Inclinações da captura foram mantidas onde endireitar cortaria caminhonete/carga ou exigiria preenchimento artificial.

Placas próximas foram tornadas ilegíveis antes da geração dos tamanhos menores; as maiores versões finais foram revistas ampliadas. No aeroporto, 19 pequenas regiões de possíveis placas de terceiros ao fundo também receberam desfoque localizado. Na foto da madeira, o recorte remove integralmente a pessoa distante. A imagem com uma pessoa próxima ao reboque não foi publicada.

Fotos repetidas, excessivamente cortadas, inadequadas ao quadro ou com pessoa identificável foram excluídas da seleção; a lista de cada arquivo e sua justificativa está no relatório fotográfico. O vídeo fornecido tem 368 × 496 pixels e cerca de 2,54 s: foi preservado e inventariado, sem player ou extração de quadros. Não havia fotografias do interior do táxi neste lote.

## Arquivos modificados

- `photo-carousel.mjs`: marcação compartilhada, semântica, setas, indicadores e pausa.
- `client/carousel.js`: temporização, carregamento, fade, controles, teclado/toque, visibilidade e movimento reduzido.
- `client/carousel.css`: quadros estáveis, enquadramento e controles nos temas existentes.
- `build.mjs`: fotos reais novas, quatro locais dos carrosséis e links dos cards sem elementos interativos aninhados.
- `build-assets.mjs`: inclui o CSS do componente no bundle único com hash.
- `client/app.js`: inicializa carrosséis depois da escolha do idioma, junto aos componentes existentes.
- `i18n-build.mjs`, `locales/es.json`, `locales/pt-BR.json`: rótulos, descrições e textos alternativos PT/ES.
- `photos.json`, `public/images/`, `dist/`: manifest e versões otimizadas; páginas/arquivos de produção regenerados.
- `export-local.mjs`: incorpora fotos e controlador, mantém o carregamento diferido e inicia apenas os carrosséis da página local ativa, depois de vincular as imagens.
- `tests/carousel.test.mjs`, `package.json`: seis testes específicos incorporados à suíte.
- `tools/prepare-carousel-photos.py`: processamento tradicional reproduzível com `--originals` e `--output`, sem sobrescrever os originais.
- `FOTOS-CARROSSEIS.md`, `carousel-photo-audit.json`: seleção, tratamentos e privacidade por arquivo.

Não foram adicionadas dependências, contas, integrações ou armazenamento de dados pessoais. Os estados dos carrosséis ficam somente em memória. As imagens e os arquivos antigos foram mantidos; as fotos novas substituem seu uso nas apresentações da frota.

## Testes concluídos

- Build e `npm test`: **28 testes aprovados** — 10 de segurança, 7 de idioma, 5 de mapa e 6 de carrossel.
- **30 combinações**: dez páginas em 320, 768 e 1440 px. Uma H1 por página, sem rolagem horizontal ou controles excedendo o quadro. Inspeção visual adicional em 390 px.
- Navegação manual por setas/indicadores e teclado; pausa e retomada; pausa ao passar o mouse e permanência da mesma imagem durante a pausa.
- Registro de trocas automáticas no navegador: cadência normal aproximadamente 5.000 ms, fade computado 0,6 s e altura de 300 px constante no tamanho observado.
- Simulação local de rede lenta: atraso de 3,5 s por imagem e transferência fracionada. Durante a espera, a foto anterior permaneceu visível; a segunda entrou após carregar, com a mesma altura. Layout shift observado no teste do carrossel: **0**.
- Movimento reduzido em fixture de mídia: reprodução inicialmente pausada, nenhuma troca automática, transição computada 0 s e navegação manual operante. Gesto e botão de pausa/retomada por toque verificados com eventos emulados.
- Tela inicial de idioma reaberta: zero carrosséis inicializados antes da escolha; depois de escolher espanhol, dois carrosséis da home inicializados com rótulos em espanhol.
- Galeria: abertura, próxima foto por teclado, contador 2/2 e fechamento por Escape.
- Comparação com a versão anterior: Títulos/descrições, HTML dos quatro formulários e todos os links/mensagens WhatsApp idênticos. As referências absolutas de canonical, hreflang, dados estruturados, sitemap e robots foram alinhadas exclusivamente ao endereço principal atualizado pela hospedagem, mantendo as mesmas rotas. Validação, comunicação, controlador de idioma e política de segurança preservados.
- Preparação de mensagens para os dois serviços nos dois idiomas aprovada pela suíte, com números exclusivos. Nenhuma mensagem real foi enviada.
- Sem erros ou avisos de JavaScript registrados na sessão final de QA.
- Exportação independente: sintaxe, hashes CSP, IDs/âncoras e imagens/fontes/mapa incorporados verificados estaticamente pelo exportador.

## Problemas resolvidos e limites

Na simulação lenta, a cadência foi ajustada para evitar encurtar a exibição da foto recém-carregada. O controle de pausa por toque foi separado do reconhecimento de gesto para que pausar e retomar funcionem nos dois sentidos. Não há pendência funcional identificada nesses componentes.

Toque e movimento reduzido foram exercitados por fixtures de teste, sem alterar as configurações do sistema. Não foi usado aparelho físico ou leitor de tela real. A simulação de rede não equivale a um teste de operadora móvel. O HTML por `file://` não foi aberto pela automação; sua verificação foi estática. Não foi realizado novo levantamento de Core Web Vitals do site inteiro.

As fotografias excluídas com pessoas somente poderão ser consideradas após revisão da autorização. Se desejar mostrar o interior do táxi no futuro, serão necessárias fotos reais desse interior.

## Endereço e entrega

https://ademir-transportes-bombinhas.erickfestagames.chatgpt.site/

O pacote local inclui o HTML independente e os relatórios. O ZIP de código contém os componentes, manifests e assets otimizados, sem originais brutos, arquivos de diagnóstico ou credenciais.

## Endereço principal atualizado pela hospedagem

A publicação do mesmo projeto passou a retornar `https://ademir-transportes-bombinhas.erickfestagames.chatgpt.site`. O endereço anterior `https://ademir-transportes-bombinhas.almondbell14.chatgpt.site` continua redirecionando para ele, com conteúdo atualizado e resposta final HTTP 200. As referências de SEO usam o destino final para evitar um canonical apontando para um redirecionamento. Nenhum domínio foi comprado, nenhum novo Site foi criado e o acesso permanece público.
