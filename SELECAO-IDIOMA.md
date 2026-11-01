> Registro de uma revisão anterior. O acesso foi posteriormente autorizado como público; a conclusão atual está em ENTRADA-E-MAPA.md.

# Seleção inicial de idioma — Ademir Transportes

Implementação de 26/10/2026, sobre o projeto existente. As cinco páginas PT e as cinco páginas ES, a identidade visual, os formulários, as galerias, os contatos e as proteções da auditoria foram preservados.

## Arquitetura e funcionamento

O projeto continua estático: `build.mjs` cria o conteúdo; `i18n-build.mjs` utiliza os catálogos existentes de português/espanhol e gera as dez URLs. Não foi criado outro sistema de tradução. A tela de entrada é um componente pequeno em `language-welcome.mjs`, com o logo existente, grafite #181B22, vermelho #C8102E, saudação bilíngue, título, subtítulo, duas opções grandes e descrição dos serviços.

O controlador existente `client/language.js` foi ampliado. Ele continua usando somente a preferência `ademir-language` no localStorage e aceita exclusivamente `pt-BR` ou `es`. Na primeira visita sem valor válido, apresenta a escolha manual; não consulta localização, IP ou idioma do navegador. Português abre `/`; espanhol abre `/es/`. O seletor do cabeçalho continua trocando para a página equivalente e atualiza a preferência. Valores corrompidos são ignorados sem executar seu conteúdo.

A decisão é síncrona no head, antes da folha de estilos e da primeira pintura. O seletor começa oculto por CSS e só é exibido quando necessário. Uma preferência válida não passa pelo estado de seleção; quando é preciso mudar de rota, o conteúdo aguarda a navegação para evitar mostrar o idioma incorreto. O redirecionamento usa somente as rotas locais conhecidas e não aceita destinos arbitrários.

Quando o armazenamento está bloqueado ou a gravação falha, o parâmetro `idioma=pt-BR` ou `idioma=es` conserva a escolha na URL e nos links internos. Quando o armazenamento volta a funcionar, a escolha é gravada e esse marcador é removido. Sem armazenamento, uma futura entrada na raiz sem o marcador voltará a solicitar a escolha; não é possível prometer persistência durável nessa situação.

O HTML independente usa o mesmo controlador incorporado, com as âncoras PT/ES já existentes, sem exigir servidor ou pacotes. A tela foi incluída uma única vez no arquivo, sem duplicá-la para cada página.

## Acessibilidade, SEO e preservação

- Os dois links de navegação têm aparência de botões grandes, nomes de idioma por extenso, atributo `lang`, foco visível e área mínima observada de 83 px de altura no celular.
- A escolha recebe foco no título; Tab e Shift+Tab circulam pelas duas opções. O restante do site fica inerte e fora da leitura assistiva durante a escolha. Ao continuar na mesma página, o foco vai ao título principal.
- Animação curta e transições sem espera artificial; `prefers-reduced-motion` remove animação e movimento. Sem fotografia, biblioteca ou chamada externa nova para a tela.
- O conteúdo principal permanece no HTML estático em todas as dez URLs, com H1, `lang`, canonical, hreflang, sitemap e metadados existentes. A seleção cobre o conteúdo por uma camada opaca; não aplica `display:none` ou `visibility:hidden` ao conteúdo principal durante a escolha. Não há detecção especial de robôs.
- Sem JavaScript, a tela não bloqueia o conteúdo. Links nativos de português/espanhol aparecem no topo. Formulários continuam dependendo de JavaScript, como antes, com links diretos de WhatsApp disponíveis.
- O site hospedado continua privado. A barreira de autenticação existente antecede o conteúdo e continua impedindo indexação pública. A revisão preserva a estrutura SEO, sem prometer indexação ou classificação no Google.
- Não houve alteração de fotografias, máscaras de placas, números, geração das mensagens ou coleta de dados. Não foram adicionados rastreadores ou dependências.

## Arquivos alterados ou adicionados

| Arquivo | Alteração |
| --- | --- |
| `client/language.js` | Decisão inicial, validação da preferência, persistência, fallback por URL, teclado e navegação PT/ES/local. |
| `language-welcome.mjs` | Novo componente com logo, textos e links de idioma, incluindo fallback sem JS. |
| `client/enhancements.css` | Estilos responsivos exclusivos da tela, foco, interação e movimento reduzido. |
| `i18n-build.mjs` | Inclusão do componente e do contêiner de conteúdo; execução inicial do controlador antes do CSS. |
| `build.mjs` | Reutilização do logo no componente. |
| `export-local.mjs` | Componente único e mesmo controlador incorporado, com hashes CSP e âncoras locais. |
| `tests/language.test.mjs` | Sete testes de regressão de idioma, rotas, armazenamento, SEO e fallback. |
| `package.json` | Inclusão dos testes de idioma no comando `npm test`. |
| `README.md` e `SELECAO-IDIOMA.md` | Funcionamento, manutenção e resultados. |
| `dist/` | HTML e assets gerados; CSS consolidado atualizado com hash e versão anterior retirada. |

Os catálogos de tradução e os arquivos de comunicação/validação dos formulários foram reutilizados. O componente de escolha é intencionalmente bilíngue, conforme o briefing; depois da escolha, aparece somente a interface do idioma correspondente.

## Resultados dos testes

| Verificação solicitada | Resultado e limites |
| --- | --- |
| Primeira visita sem preferência | Aprovada no navegador: somente a seleção é apresentada à interação/leitura assistiva. |
| Português | Aprovado por teclado: preferência pt-BR gravada e página inicial PT exibida. |
| Espanhol | Aprovado: preferência es gravada e página inicial ES exibida. |
| Atualização da página | PT e ES aprovados, sem retorno ao seletor. |
| Fechamento/reabertura | Aba de teste fechada e nova aba aberta no mesmo navegador: ES preservado. **Não foi reiniciado o navegador inteiro**, para preservar a sessão e as abas do usuário. |
| Navegação | Dez páginas verificadas no navegador em 390 px, idioma correto, um H1 e sem overflow horizontal; pares/ausência de ciclos também verificados em testes automatizados. |
| Troca pelo menu | Aprovada no celular e com armazenamento bloqueado, preservando a página equivalente; o valor salvo foi conferido no caso normal. |
| Limpeza/corrupção do armazenamento | Remoção da chave e valor inválido testados por fixtures locais de QA; o seletor voltou a aparecer. |
| Celular/tablet/computador | Seletor aprovado em 320, 390, 768 e 1440 px. Em 844 × 390, a composição mantém o logo acessível e oferece rolagem para o conteúdo restante. |
| Flashes de seleção | Em recargas PT/ES com preferência válida, a instrumentação registrou apenas estado ready e primeira pintura em ready. O teste se limita ao navegador/ambiente utilizado; não é medição de campo. |
| WhatsApp | Quatro formulários testados no navegador com dados fictícios: mensagens PT/ES corretas e destinos exclusivos por serviço. Nenhuma mensagem enviada ao atendimento. |
| Teclado/leitura assistiva | Tab, Shift+Tab, Enter, foco e isolamento do fundo conferidos. Estrutura/nomes observados na árvore de acessibilidade; não foi executado teste com NVDA ou leitor de tela físico. |
| Armazenamento indisponível | Getter bloqueado simulado na prévia de QA: escolha, navegação, recarga e troca pelo menu aprovadas usando o parâmetro de idioma. |
| JavaScript indisponível | Simulação local retirando os scripts e expondo o conteúdo de noscript: conteúdo e links nativos de idioma aprovados. Não foi alterada a configuração global de JavaScript do navegador. |
| Movimento reduzido | Regra CSS verificada; nenhuma preferência do sistema operacional foi alterada. |
| Build e testes | Build aprovado; `node check.mjs` aprovado; dez testes de segurança e sete testes de idioma aprovados. |
| Console | Sem erros ou avisos capturados nos percursos de teste do site. |
| HTML independente | Sintaxe, hashes CSP dos dois scripts e do CSS, IDs únicos, componente único, âncoras e assets incorporados verificados. Abertura automatizada por file:// continua indisponível no navegador de automação. |

As fixtures, a instrumentação de pintura e os resultados detalhados de QA ficam fora da pasta pública e do pacote de execução. Não há parâmetro de teste ou mecanismo de contorno publicado.

## Contatos confirmados

**Fretes e mudanças:** (47) 99781-3000 — destino WhatsApp `5547997813000`.

**Táxi e transfer:** (47) 99730-2343 — destino WhatsApp `5547997302343`.

Ambos foram conferidos nas mensagens dos quatro formulários e nos testes existentes. As funcionalidades originais continuam presentes.

## Referências e pendências

A composição é própria, usando a identidade existente. Foram consultados o conceito de escolha explícita da [União Europeia](https://european-union.europa.eu/index_en) e a organização de seleção de mercado da [Nestlé Professional](https://www.nestleprofessional.com/country-selector), sem copiar código ou layout. A referência Calvin Klein foi consultada, mas sua rota global redirecionou para uma versão regional, sem servir de modelo exato.

Pendências de verificação: reinício integral do navegador, leitores de tela específicos, dispositivos físicos e abertura automatizada do HTML por file://. As limitações de hospedagem/cabeçalhos e as fotografias retidas da auditoria anterior continuam documentadas em AUDIT.md; esta mudança não altera essas condições.
