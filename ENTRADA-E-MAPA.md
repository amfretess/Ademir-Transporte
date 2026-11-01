# Conclusão da entrada de idioma e mapa real

Revisão de 26/10/2026 sobre o projeto existente da Ademir Transportes.

## Diagnóstico e ajuste da entrada

A versão publicada já continha o componente de idioma e o controlador atualizado: isso foi confirmado por leitura autorizada dos arquivos entregues pela hospedagem. Na visita anônima, porém, o endereço apresentava **“Entre para acessar”**, do ChatGPT, antes de carregar o código da empresa. Essa barreira é a configuração de acesso privado da hospedagem; nenhum componente do frontend pode substituir ou remover legitimamente esse login. Uma preferência válida já salva também faz o seletor ser omitido, conforme as regras solicitadas.

A integração foi reforçada para que a seleção seja uma etapa explícita do fluxo, além da apresentação visual:

1. O controlador existente é incorporado no head com hash CSP, antes do CSS e do conteúdo, eliminando a dependência de um arquivo externo para decidir a primeira entrada.
2. Sem preferência válida, o estado inicial é `choose`.
3. Assim que o HTML do seletor é interpretado, um pequeno ponto de montagem abre um **dialog nativo com showModal()**, antes do conteúdo principal. O fundo fica inerte. Escape não permite avançar sem escolher; um fechamento inesperado reabre o diálogo enquanto a escolha estiver pendente.
4. A entrada real de comportamento do site, `startSite()` em `client/app.js`, só inicializa os componentes depois do estado pronto ou do evento `ademir-language-ready`. Isso inclui formulários, menu, galeria e mapa.
5. Ao escolher português, abre-se `/`; espanhol abre `/es/`. Na mesma página, o diálogo fecha e a aplicação inicia sem recarga desnecessária. Quando a rota muda, segue para a URL correspondente. As páginas equivalentes e seus catálogos existentes continuam sendo utilizados.

Não foi criado outro sistema de tradução. A preferência continua em **localStorage, chave `ademir-language`**, com valores exclusivamente `pt-BR` ou `es`. Valores inválidos são ignorados. A troca pelo menu atualiza a mesma preferência. O parâmetro manual `idioma`, validado, continua como alternativa quando o armazenamento está indisponível; nesse caso a escolha acompanha a URL, sem promessa de persistência numa futura entrada na raiz sem o parâmetro.

O CSS evita a pintura prematura do fundo enquanto o diálogo nativo está sendo montado; ele não substitui o controle de fluxo. O código e os hashes incorporados têm finais de linha normalizados, com `.gitattributes` para preservar LF também em checkouts no Windows. A CSP continua sem `unsafe-inline` ou `unsafe-eval`.

O título principal passou a ser **“Bem-vindo! / ¡Bienvenido!”**, seguido de “Escolha seu idioma” e do subtítulo espanhol. Logo, cores, botões grandes, foco, animação curta e movimento reduzido foram mantidos.

## Mapa real

O desenho abstrato foi substituído no componente de cobertura compartilhado, usado na página inicial, fretes e contato nos dois idiomas.

- **Território e costa:** geometrias reais do IBGE, com limites municipais de Bombinhas, Porto Belo e Itapema.
- **Vias e referências:** dados OpenStreetMap preparados uma vez e hospedados no próprio projeto.
- **Projeção:** coordenadas GeoJSON em longitude/latitude e desenho em Web Mercator, preservando a relação geográfica dos pontos.
- **Marcadores:** Bombinhas como cidade-base, Porto Belo e Itapema como cidades atendidas; FLN e NVT nos terminais de passageiros. Bombinhas representa a cidade, não a localização exata da Rua Lavanda.
- **Conexões:** polilinhas derivadas da malha viária real, pelas conexões da BR-101; ligação norte pela BR-470 até NVT e sul pela Ponte Pedro Ivo Campos/SC-401/acesso do FLN.
- **Região:** destaque dos três polígonos municipais reais, sem criar um ponto chamado “Região”. A disponibilidade continua sujeita ao atendimento.
- **Uso:** ampliação, redução, restauração do enquadramento, teclas de seta e seleção de cidades/aeroportos. O link para Google Maps abre o itinerário externo atualizado somente por ação do visitante.

O mapa é cartografia vetorial real, renderizada como SVG a partir desses dados. Não é screenshot, imagem gerada por IA ou desenho com linhas arbitrárias. Não carrega tiles de terceiros, não exige chave de API, não usa geolocalização do visitante e não adiciona biblioteca de mapas. O HTML independente incorpora tanto o desenho quanto o conjunto GeoJSON para download.

Os trajetos são **indicativos sobre vias reais**. O preparo considerou sentidos únicos e excluiu vias privadas/proibidas, mas não avalia trânsito, restrições condicionais ou todas as relações de conversão. Não substitui navegação atualizada e não informa duração ou distância comercial garantida. A posição do terminal FLN foi confrontada com a [página oficial do Floripa Airport](https://floripa-airport.com/como-chegar).

Atribuições IBGE e OpenStreetMap estão visíveis. O GeoJSON derivado e as fontes/licenças estão em `public/maps/`; dados OSM usam ODbL 1.0. A base IBGE é creditada conforme sua licença. Consulte [API de Malhas do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3) e [OpenStreetMap — direitos autorais](https://www.openstreetmap.org/copyright). O detalhamento está em `MAPA-FONTES.md`.

## Arquivos modificados/adicionados

| Arquivo | Finalidade |
| --- | --- |
| `client/language.js` | Montagem imediata do diálogo, estado de entrada, foco, Escape, persistência e evento de liberação. |
| `language-welcome.mjs` | Diálogo nativo, títulos solicitados e ponto de montagem. |
| `client/app.js` | Entrada `startSite()` condicionada à escolha e inicialização do mapa. |
| `i18n-build.mjs` | Controlador incorporado com hashes CSP e montagem antes do conteúdo. |
| `region-map.mjs` | Cartografia SVG a partir das geometrias reais, marcadores, legendas e controles. |
| `client/map.js` | Seleção, zoom, teclado, destaque da área e link de itinerário. |
| `public/maps/` | GeoJSON, fontes/licenças e aviso de atribuição. |
| `map-route-audit.json`, `MAPA-FONTES.md` | Proveniência e rastreabilidade das conexões no código-fonte. |
| `client/enhancements.css` | Layout do diálogo e do mapa, acessibilidade e responsividade. |
| `build.mjs` | Reutilização da seção existente e cópia dos dados geográficos. |
| `export-local.mjs` | Mesmo fluxo, mapa e dados incorporados ao HTML independente; CSP verificada. |
| `locales/es.json` e `locales/pt-BR.json` | Textos do mapa em ambos os idiomas, sem novo motor i18n. |
| `tests/language.test.mjs`, `tests/security.test.mjs`, `tests/map.test.mjs` | Entrada, hashes, geografia, dados e regressões. |
| `package.json`, `.gitattributes`, `serve.mjs` | Testes, estabilidade dos hashes e MIME dos dados geográficos. |
| `README.md`, `ENTRADA-E-MAPA.md`, `dist/` | Documentação e saída atualizada. |

## Testes executados

**Build aprovado; 22 testes automatizados aprovados:** dez de segurança, sete de idioma e cinco de geografia/mapa. Os testes geográficos verificam os cinco pontos, relações norte/sul e oeste/leste, projeção, quatro conexões, proximidade dos terminais/cidades, preservação do comprimento do grafo original, polígonos municipais e correspondência de hashes dos dados.

| Teste solicitado | Resultado |
| --- | --- |
| 1–2. Entrada sem preferência e abertura automática | Aprovado na prévia: primeiro estado/pintura registrados como choose, diálogo nativo aberto e componentes principais ainda não inicializados. |
| 3–4. Escolha e página em português | Aprovado; a aplicação inicia após a escolha. |
| 5–6. Escolha e página em espanhol | Aprovado; interface, mapa e formulários em espanhol. |
| 7. Atualização | Aprovada com preferência salva, sem reabrir o seletor. Primeira pintura em ready e diálogo fechado. |
| 8. Navegação | Dez páginas conferidas nos dois idiomas; pares/ausência de ciclos também cobertos por testes. |
| 9. Fechar e abrir | Aba de teste fechada e outra aberta no mesmo navegador: idioma preservado. Não foi reiniciado o aplicativo inteiro, para preservar as abas/sessão do usuário. |
| 10. Limpeza de localStorage | Chave removida por fixture local de teste; entrada voltou a abrir o seletor. |
| 11. Flash antes da escolha | Instrumentação registrou a primeira pintura com diálogo aberto; não houve inicialização do mapa antes da escolha. |
| 12. Troca manual | Aprovada pelo menu, inclusive com armazenamento bloqueado e alternativa pela URL. |
| 13. WhatsApp | Quatro formulários PT/ES testados com dados fictícios; mensagens e números corretos. Nenhuma mensagem enviada ao atendimento. |
| 14. Responsividade | Trinta verificações: dez páginas em 320, 768 e 1440 px, sem overflow horizontal e com um H1. Diálogo adicionalmente conferido em 390 px; botões com 83–96 px de altura. |
| 15. Mapa real | Conferidos zoom, restauração, seleção FLN e destaque dos municípios; idioma dos controles/descrições correto. |
| 16. Geografia | Cinco pontos e quatro conexões aprovados, com base/municípios/aeroportos posicionados coerentemente. Fontes e licença distribuídas. |

Teclado: Tab, Shift+Tab, Enter e bloqueio de Escape aprovados. A árvore de acessibilidade isola o diálogo durante a escolha. Sem erros/avisos capturados nos percursos do site. Não foi executado leitor de tela específico nem teste em aparelho físico. `prefers-reduced-motion` está contemplado no CSS.

Armazenamento bloqueado foi simulado e aprovado com o parâmetro de idioma. Sem JavaScript, em simulação que remove os scripts e expõe noscript, o conteúdo, o mapa estático e os links de idioma continuam visíveis. Nessa condição, formulário, controles interativos e persistência dependem de JavaScript.

O HTML independente contém dez páginas, diálogo único e três scripts com hashes CSP exatos. Sintaxe, âncoras, IDs, mapa e assets incorporados foram verificados. Abertura automatizada por file:// permanece indisponível no navegador de automação; o arquivo local precisa ser aberto no navegador do Windows.

## Preservações e publicação

Fretes/mudanças: **(47) 99781-3000** — WhatsApp `5547997813000`.

Táxi/transfer: **(47) 99730-2343** — WhatsApp `5547997302343`.

Não foram alterados os serviços, a separação dos contatos, fotografias/placas ou o conteúdo comercial existente. URLs, metadados, canonical, hreflang e sitemap foram preservados. Não foi adicionado rastreamento ou dependência npm.

A configuração de público da hospedagem é separada da seleção de idioma. O login privado observado antes desta revisão impede que visitantes anônimos cheguem ao frontend. Sua remoção exige alteração explícita do acesso para público; o resultado final de publicação/acesso é registrado no relatório entregue. Nenhum login foi contornado no código do site.

## Acesso público confirmado

O usuário autorizou explicitamente tornar o site público. A configuração foi alterada para public, revisão 2, e a entrada anônima no endereço definitivo passou a mostrar automaticamente o diálogo, sem o login do ChatGPT. Espanhol, recarga, mapa NVT e troca para português foram conferidos na publicação, sem erros no console. O menu inclui Reabrir seleção inicial para remover apenas a preferência de idioma e repetir esse fluxo pelo próprio site.
