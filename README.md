# Ademir Transportes — site bilíngue

Projeto existente atualizado, com a identidade visual original e cinco páginas em cada idioma. Não exige instalação de pacotes, cadastro, banco de dados ou servidor de aplicação.

## Abrir o arquivo local

Extraia o ZIP da versão para navegador e abra Ademir-Transportes-Bilingue.html com Chrome, Edge ou Firefox. A página inicial já está no HTML; fotos, fontes, estilos, formulários, galeria e ambos os idiomas estão incorporados. Links de WhatsApp e Google Maps precisam de internet.

Para gerar esse arquivo novamente a partir do código:

    node build.mjs
    npm test
    node export-local.mjs caminho-do-arquivo.html

Para visualizar a estrutura publicada localmente, execute node serve.mjs e abra http://127.0.0.1:4173.

## Conteúdo e código

- build.mjs: componentes e conteúdo existentes em português; fotografias e seções atualizadas.
- i18n-build.mjs: geração estática dos dois idiomas, metadados, canonical, hreflang e sitemap.
- locales/pt-BR.json e locales/es.json: catálogos completos de conteúdo. O build falha se faltar alguma tradução.
- client/app.js: menu, formulários, validação, privacidade e galeria com teclado, botões e gestos de toque.
- client/communication.js: geração de mensagens em português e espanhol, com contatos separados.
- client/validation.js: normalização e validação central, datas/horários, limites e bloqueio temporário de duplicidade.
- security-policy.mjs: CSP por hash e regras de cabeçalhos para hospedagem compatível.
- build-assets.mjs: consolidação do CSS de produção sem alterar os estilos.
- tests/security.test.mjs: regressões relevantes de segurança e privacidade.
- client/ui.js: mensagens e textos dinâmicos nos dois idiomas.
- client/language.js: preferência funcional de idioma, armazenada no navegador com tratamento para armazenamento bloqueado.
- client/enhancements.css: ajustes de fotos, galeria e seletor de idioma; style.css mantém a identidade anterior.
- public/images/: imagens WebP e versões responsivas organizadas por serviço, região e aeroportos.
- photos.json: manifesto das imagens.
- photo-treatment-audit.json: registro dos arquivos recebidos e das regiões em que foi aplicado desfoque técnico.
- export-local.mjs: exportação independente para abrir diretamente no navegador.
- dist/: arquivos prontos para hospedagem estática.

O build copia as imagens e os scripts de origem para dist. As fontes, licenças e o CSS principal existentes são preservados em public/assets e copiados para dist/assets, permitindo também um build do zero. Para Cloudflare Pages com GitHub, consulte [DEPLOY.md](DEPLOY.md).

## Rotas

Português: /, /fretes, /taxi, /sobre e /contato.

Espanhol: /es/, /es/fletes, /es/taxi, /es/nosotros e /es/contacto.

O seletor fica no cabeçalho e, no celular, dentro do menu. A preferência escolhida permanece nas próximas páginas e visitas quando o navegador permite armazenamento local. As URLs de cada idioma têm metadados próprios e estão incluídas no sitemap. O arquivo HTML independente usa âncoras locais equivalentes.

## Boas-vindas e seleção inicial de idioma

A primeira visita sem preferência válida mostra uma tela inteira em grafite e vermelho, com o logo existente e escolha manual entre Português (Brasil) e Español. O mesmo client/language.js que já administrava o idioma foi ampliado; ele continua usando a chave ademir-language. A decisão ocorre no cabeçalho antes do CSS e da primeira pintura, para evitar a aparição breve do seletor quando já existe preferência.

Valores inesperados são ignorados. Se localStorage estiver indisponível, a seleção segue no parâmetro idioma, limitado a pt-BR ou es, e acompanha os links internos. Nessa condição, a escolha permanece na navegação/URL atual, mas não pode ser prometida numa futura visita à raiz sem esse parâmetro. Sem JavaScript, o conteúdo estático e links nativos de idioma continuam acessíveis. O arquivo HTML independente incorpora exatamente o mesmo controlador e usa suas âncoras locais.

O novo componente está em language-welcome.mjs. Consulte SELECAO-IDIOMA.md para a lista de arquivos, resultados dos testes e limitações. Nenhuma biblioteca foi adicionada. O idioma pode ser alterado depois no menu existente; os contatos de fretes e táxi permanecem separados.

### Revisão de conclusão: entrada e mapa real

Consulte ENTRADA-E-MAPA.md para a revisão atual. O seletor agora é um dialog nativo aberto assim que sua marcação é interpretada. O controlador fica incorporado no head, protegido por hash CSP; startSite() em client/app.js só inicializa os componentes depois da escolha. Escape não libera a entrada sem selecionar um idioma. O arquivo .gitattributes mantém finais de linha LF para a estabilidade dos hashes.

A seção compartilhada de cobertura usa costa/municípios IBGE e vias/pontos OpenStreetMap reais, com projeção Web Mercator, zoom e destaque de cidades/aeroportos. Dados e licenças estão em public/maps, com crédito visível e download. Não há tiles, chave de API ou geolocalização do visitante. Os traçados indicam conexões sobre vias reais e exigem consulta ao itinerário atualizado para navegação. O HTML independente incorpora o mapa e seus dados.

O login do ChatGPT observado na entrada é controlado pela hospedagem privada, antes do código do site. O seletor só é alcançado depois dessa barreira enquanto o acesso continuar privado; a configuração de público não é alterada pelo JavaScript.

## Contatos e privacidade

Fretes e mudanças: +55 47 99781-3000.

Táxi e transfer: +55 47 99730-2343.

Os formulários preparam uma mensagem; abrir o WhatsApp já encaminha seu conteúdo no link ao serviço externo. O visitante decide se envia a mensagem ao atendimento. Nenhuma mensagem é enviada automaticamente ao atendimento, e o código do site não armazena dados do formulário. A única preferência salva pelo site é o idioma escolhido. O táxi admite até quatro passageiros e a reserva depende da confirmação do atendimento. Não foram adicionados rastreadores ou tags de analytics; o projeto não possui identificadores configurados. As práticas internas da hospedagem e do WhatsApp não foram auditadas.

## Fotografias

Estado atual para produção: 15 fotografias e 88 variantes públicas aprovadas, incluindo as oito fotos reais dos carrosséis. Os parágrafos sobre sete fotos/40 variantes abaixo registram o lote inicial; consulte CARROSSEIS.md e FOTOS-CARROSSEIS.md para o lote seguinte e REVISAO-PRODUCAO.md para a conferência consolidada. A foto real do aeroporto do lote novo recebeu revisão de placas de terceiros e está aprovada; ela é distinta da imagem anteriormente retirada.

Os cinco arquivos de veículos recebidos foram confirmados pelo usuário como fotografias reais apenas tratadas. Quatro estão aprovados para publicação; a foto do estacionamento aguarda revisão manual de placas de terceiros e foi retirada do diretório público. Foram preservados o modelo, as características, os adesivos e os números presentes nos veículos. O tratamento adicional usa somente desfoque técnico localizado, conversão WebP e redimensionamento; nenhuma nova imagem de veículo foi gerada.

Os originais foram mantidos separados, na pasta work/photo-originals do chat, e não integram a publicação. Sete fotos e 40 variantes com hash estão aprovadas; três fotos foram retiradas até conferência manual/substituição. As duas fotos de aviação ainda precisam de originais em maior resolução. Todas as versões publicadas são derivadas dos arquivos tratados. O registro técnico está em photo-treatment-audit.json. Para preparar fotos novamente, use tools/prepare-photos.py com Pillow e --originals apontando ao diretório separado. O build exige manifesto aprovado.

A foto da praia com marca d'água de terceiros não foi utilizada. As fotografias de aviões têm legendas ilustrativas e não são identificadas como sendo de Florianópolis ou Navegantes. Nenhuma fotografia genérica representa o Ademir. Avaliações aguardam conteúdo real e autorização para publicação, como na versão anterior.

Manrope e Inter continuam hospedadas localmente. Consulte os arquivos FONT-LICENSE-MANROPE.txt e FONT-LICENSE-INTER.txt.

## Verificações

- Build de produção concluído com catálogo espanhol completo, sem traduções pendentes.
- Dez rotas, canonical, hreflang, sitemap, links internos, âncoras e variantes de imagem verificados.
- Trinta verificações de layout: as dez páginas nas larguras de 320, 768 e 1440 pixels, sem rolagem horizontal ou imagens quebradas.
- Os quatro formulários (fretes e táxi, PT-BR e ES) foram testados no navegador com dados fictícios. Erros de validação e mensagens foram exibidos no idioma correto; os números foram preservados. Nenhuma mensagem de teste foi enviada.
- Galeria ampliada testada com teclado no computador e botões no celular.
- Troca e persistência do idioma verificadas na navegação.
- Exportação local verificada quanto à sintaxe JavaScript, imagens incorporadas, links e IDs. A abertura por file:// não pode ser automatizada no navegador interno do Codex; abra o arquivo extraído no navegador do Windows.

## Hospedagem

O site existente é https://ademir-transportes-bombinhas.erickfestagames.chatgpt.site. O acesso público foi autorizado pelo usuário e ativado nesta revisão; visitantes não precisam entrar no ChatGPT. Nenhum sistema de autenticação foi criado no código do site. O arquivo HTML local abre sem autenticação.

Ao usar outro domínio, configure SITE_URL no ambiente de build e execute npm run build. Não é necessário editar os textos ou o domínio no código; consulte DEPLOY.md antes de publicar.

## Auditoria de 26/10/2026

Leia AUDIT.md para os achados, correções, limitações e métricas medidas. O HTML independente caiu de 18.225.698 para 3.183.923 bytes. A CSP foi verificada em prévia local e no artefato exportado; a aplicação de todos os cabeçalhos de dist/_headers depende de confirmação na resposta autenticada da hospedagem. HSTS não foi ativado sem verificar a preparação HTTPS. A proteção do formulário também impede fallback de envio nativo caso o módulo falhe. O projeto tem lockfile e não possui dependências npm; npm audit informou zero vulnerabilidades.

O menu de idioma também oferece Reabrir seleção inicial: remove somente a preferência ademir-language e recarrega a entrada. A liberação pública e o fluxo foram verificados no endereço definitivo.
