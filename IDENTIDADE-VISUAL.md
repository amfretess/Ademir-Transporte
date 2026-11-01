# Atualização visual — Ademir Transportes

Data: 28/10/2026. Projeto existente, mesmo endereço e acesso público.

## Resultado

Fretes mantém vermelho e grafite. Táxi/transfer usa amarelo `#F5BF25`, grafite `#25282D`, cinza claro `#F7F7F5` e branco. A marca e o logotipo permanecem os mesmos. O amarelo aparece no contexto de passageiros; a página inicial mantém a identidade principal.

No táxi, foram refinados hero, hierarquia dos títulos, ações de reserva, borda e legenda da foto, faixa de confiança, ícones, cartões, aeroportos, passos, formulário, FAQ, navegação ativa e chamada final. O amarelo funciona como destaque; títulos e links em superfícies claras usam grafite, com detalhes amarelos. Botões amarelos sempre usam texto grafite.

Na página inicial, os dois cards têm ícone do serviço, borda e ação próprias: “Solicitar orçamento” em vermelho; “Reservar transporte” em amarelo. O mesmo critério foi aplicado ao hero, turismo, chamada final, contato, frota e barra móvel. Fretes e táxi continuam com seus telefones exclusivos.

## Organização dos temas

`client/service-themes.css` centraliza as variáveis semânticas `--service-accent`, `--service-hover`, `--service-on-accent`, `--service-text`, `--service-soft` e `--service-focus`. Os contextos usam `data-service-theme="brand|fretes|taxi"`. A classe `taxi-action` permite um botão de passageiros no contexto principal. O vermelho da marca fica separado do destaque do táxi.

As páginas PT e ES usam os mesmos componentes e o mesmo CSS. Não há cópias de páginas para trocar cores nem dependências adicionadas. O bundle CSS recebe nome com hash para atualizar o cache. O HTML independente usa exatamente o CSS completo gerado e preserva o tema de cada página.

## Arquivos e componentes

| Arquivo | Alteração |
| --- | --- |
| `client/service-themes.css` | Novo arquivo de tokens e estilos dos temas, componentes e estados acessíveis. |
| `client/enhancements.css` | Contraste do botão para reabrir a escolha de idioma. |
| `build-assets.mjs` | Inclui os temas no bundle único de estilos. |
| `build.mjs` | Contextos nos cards, hero, CTA, turismo, contatos, frota, rodapé e barra móvel; ícones de carga/passageiros. |
| `i18n-build.mjs` | Define o tema semântico da página no contêiner compartilhado. |
| `export-local.mjs` | Exporta o mesmo bundle publicado e mantém os temas nos dez painéis locais. |
| `locales/es.json`, `locales/pt-BR.json` | Catálogo atualizado para “Reservar transporte”. |
| `dist/` | Dez páginas e 404 PT/ES regenerados; novos assets e CSS com hash. |

Nenhum componente de formulário, validação ou mensagem foi reescrito. O arquivo CSS com hash anterior foi substituído pelo novo bundle, conforme o mecanismo já existente.

## Verificações

- Build concluído; `npm test` aprovado: 10 testes de segurança, 7 de idioma e 5 geográficos, total 22.
- 30 combinações de layout: dez páginas em 320, 768 e 1440 pixels. Uma H1 por página e nenhuma rolagem horizontal. Inspeção visual adicional do táxi em 390 pixels.
- Comparação com a versão anterior: SEO, canonicals, hreflang, dados estruturados, sitemap, robots, HTML dos quatro formulários e todos os links/mensagens WhatsApp idênticos. Hashes de validação, comunicação, controlador de idioma, política de segurança e catálogo de fotos preservados.
- Cores computadas verificadas: fretes vermelho com texto branco; táxi amarelo com texto grafite; ambos os cards diferenciados nos dois idiomas.
- Contraste: amarelo/grafite 8,70:1; hover amarelo/grafite 7,22:1; fretes vermelho/branco 5,88:1; texto cinza em fundo claro do táxi 5,82:1; placeholder 5,39:1; texto do hero 9,95:1.
- Escolha inicial de idioma reaberta, Escape bloqueado, Tab para a opção em espanhol, seleção por teclado e preferência mantida após recarga. A navegação PT/ES continua com as mesmas rotas.
- Formulário vazio bloqueado pelo campo obrigatório. Preparação de mensagem confirmada na interface para táxi PT e fretes PT/ES, com os números corretos; nenhuma mensagem foi enviada. As quatro combinações serviço/idioma passam nos testes de geração e validação.
- Galerias, mapa e contatos mantêm o código e as fotos existentes. Sem erros de JavaScript registrados na sessão de QA.
- HTML independente exportado com imagens/fontes/mapa incorporados; sintaxe, CSP, IDs e âncoras conferidos pelo exportador.

## Problemas encontrados e limites

O botão “Reabrir seleção inicial” tinha texto branco sobre o menu branco. O contraste foi corrigido, sem mudar a seleção de idioma.

Durante parte da sessão, a automação do navegador deixou de registrar cliques e teclas, inclusive em uma página de diagnóstico isolada, sem disparar eventos e sem erro JavaScript. Não foi encontrado defeito correspondente no código do site. A confirmação interativa final do formulário táxi ES, da abertura da FAQ e do menu móvel não foi concluída; essas verificações não são declaradas aprovadas na interface. A lógica dos formulários e do menu foi preservada, e os testes automatizados continuam aprovados.

Não foram usados dispositivos físicos ou leitor de tela real; foram inspecionados rótulos, semântica, estados de foco e árvore de acessibilidade. A abertura automatizada do HTML por `file://` continua indisponível no navegador de testes. Não foi realizado envio real de WhatsApp nem novo levantamento de Core Web Vitals.

## Entrega

Site: https://ademir-transportes-bombinhas.almondbell14.chatgpt.site/

Os arquivos locais e ZIPs são cópias para download; o site público recebe o mesmo código pelo fluxo de publicação do Sites. O relatório e as evidências registram explicitamente os testes concluídos e seus limites.
