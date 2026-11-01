# Revisão para GitHub e Cloudflare Pages

Atualização em 01/11/2026: foi identificada uma cópia incompleta no GitHub (100 dos 152 arquivos originalmente entregues). O mapa e outras entradas já constavam no ZIP original. O relatório histórico abaixo registra a preparação de 29/10; o diagnóstico e a correção posteriores estão em [CORRECAO-BUILD-CLOUDFLARE.md](CORRECAO-BUILD-CLOUDFLARE.md).

Data: 29/10/2026. Base local: commit `2855e4a8b10b055ddb10bce4ffc94c4054371989`, que já contém a frase “Seu transporte em boas mãos.” / “Tu transporte en buenas manos.”.

**Resultado: preparação local concluída, com configuração pendente do domínio final e aprovação da primeira implantação. Nenhum push, commit, deploy, alteração de audiência ou mudança de DNS foi realizado nesta tarefa.**

## Diagnóstico

- Tecnologia: HTML/CSS/JavaScript nativos, gerador estático próprio em Node.js ES Modules; não usa framework de aplicação ou biblioteca externa.
- Gerenciador existente: npm, com `package-lock.json` v3 e zero dependências de aplicação.
- Build: `npm run build`. Saída: `dist`. Runtime escolhido: Node 24.x / npm 11.x; testes locais com Node 24.16.0 e npm 11.13.0.
- Compatível com Cloudflare Pages estática. Não exige processamento no servidor, banco de dados, autenticação, Pages Functions, Workers ou chaves de API.
- Os formulários preparam mensagens para o WhatsApp; não fazem reservas, pagamentos ou envio automático ao atendimento. O mapa é local e não consulta API externa.

## Ajustes realizados

1. `.gitignore`: dependências, temporários, saídas geradas, `.env` reais, configurações locais com credenciais, chaves privadas e diretórios de originais/revisão. `.env.example` continua versionável. Nenhum arquivo existente foi excluído ou retirado do índice.
2. `.node-version`, `package.json`, `package-lock.json`: runtime declarado e npm preservado; nenhuma dependência adicionada.
3. `public/assets/style.css`, `inter-latin.woff2`, `manrope-latin.woff2` e as duas licenças: cópias exatas dos arquivos já existentes em `dist/assets`. O build agora encontra suas entradas sem depender de uma saída antiga.
4. `site-config.mjs`, `build.mjs`, `.env.example`: origem de SEO configurável por `SITE_URL`, com validação de HTTPS e rejeição de caminhos, credenciais e parâmetros. Sem variável, mantém o domínio atual.
5. `tests/site-config.test.mjs`: três testes da nova configuração. `tools/check-pages.mjs` e `npm run check:pages`: conferência de rotas, origens de SEO, referências com maiúsculas/minúsculas exatas, imagens/variantes e hashes, imports, CSS e limites de cabeçalhos.
6. `DEPLOY.md`, `README.md`, este relatório: instruções de implantação e resultados atuais.

O build padrão continuou gerando os **mesmos 123 arquivos públicos, byte por byte**. Permaneceram intactos o CSS final, fotografias, conteúdo das dez páginas, formulários, contatos, mapa, seleção de idiomas, carrosséis e galeria. A configuração de domínio é aplicada apenas quando `SITE_URL` for fornecida.

## Segurança e dados no repositório

Varredura por padrões de chaves privadas, tokens comuns de GitHub/OpenAI/AWS/Slack/Google e atribuições suspeitas de credenciais: **nenhuma ocorrência encontrada** nos 263 arquivos originalmente rastreados, em 243 objetos textuais alcançáveis do histórico local e na revisão dos arquivos preparados. A configuração Git local não contém credencial embutida no remote nem `extraHeader` de autorização persistido. A revisão por padrões não constitui garantia contra todo formato possível de segredo.

Não há `.env` real, chave privada, cadastro de clientes ou banco de dados no projeto preparado. Telefones e endereço comercial já públicos foram preservados. O identificador `.openai/hosting.json` não é segredo e foi mantido para não romper a identidade da hospedagem existente. O pacote de transferência não inclui a pasta `.git`.

O comportamento do `.gitignore` foi verificado para `.env.production`, `node_modules`, temporários, `dist`, certificados/chaves, `credentials.json` e estado do Wrangler. O exemplo público de ambiente e os assets necessários ao build continuam incluídos.

## Fotografias e placas

Revisados os 15 grupos de imagens públicas, inclusive assets legados ainda disponíveis por URL: 88 variantes WebP, todos registrados no manifesto como aprovados. As maiores variantes foram inspecionadas visualmente, com ampliações de **28 áreas de placas ou regiões distantes de veículos de terceiros**. As áreas redigidas permanecem ilegíveis; outras fotos não mostram placas identificáveis no enquadramento.

Os 88 arquivos mantêm seus hashes e correspondem às cópias em `dist`. Metadados privados de EXIF/GPS não foram encontrados nas variantes públicas. Fotografias e originais não foram editados nesta revisão. As cópias de originais continuam fora do repositório e do diretório público. As duas imagens ilustrativas de aviação de resolução menor foram preservadas; isso não impede a implantação.

## Testes executados

| Verificação | Resultado |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | Concluído, sem dependências adicionais |
| `npm run build` | Dez páginas PT/ES e artefatos de produção gerados |
| `npm test` | 31 testes: segurança 10, idioma 7, mapa 5, carrossel 6, configuração 3; todos passaram |
| `check.mjs`, incluído em `npm test` | Dez rotas, IDs, âncoras, SEO, traduções e quatro combinações serviço/idioma |
| `npm run check:pages` | 10 rotas, 15 fotos, 88 variantes, 123 arquivos; referências e hashes corretos |
| Build em cópia limpa, sem `.git`, `dist` ou `node_modules` | Instalação, build e verificação concluídos |
| Build limpo com `SITE_URL=https://production.example` | Origem propagada corretamente em SEO, sitemap e robots; testes passaram |
| HTTP em servidor local | Dez rotas com status 200; caminhos inexistentes em PT/ES com 404 |
| Navegador: quatro formulários | Telefone inválido bloqueado; dados válidos produziram prévia e URL iguais, com número e idioma corretos |
| Navegador: responsividade | 30 combinações: dez páginas em 320, 768 e 1440 px; sem overflow horizontal ou imagens quebradas, um H1 por página |
| Console durante os casos finais | Sem erros registrados |
| Preservação do resultado atual | Todos os 123 arquivos de `dist` mantiveram os hashes anteriores no build padrão |

Build atual: 13.212.568 bytes em 123 arquivos. Maior arquivo: 480.092 bytes. Maior linha de `_headers`: 906 caracteres, inferior ao limite da Pages. Não há fallback genérico de SPA; as páginas 404 existentes são preservadas.

Os formulários foram exercitados com dados fictícios. Um link real do WhatsApp foi aberto para confirmar o destino; nenhuma mensagem foi enviada. Nos quatro casos finais, a abertura de janela foi capturada por uma instrumentação exclusiva do servidor local de testes. Essa instrumentação não está no código ou no pacote de produção. A validação e a composição das mensagens usam os mesmos módulos de produção.

## Pendências antes da primeira publicação

1. Aprovar o domínio canônico e configurar `SITE_URL` na Cloudflare para esse endereço HTTPS.
2. Revisar os arquivos, criar/selecionar o repositório GitHub e conectar a integração oficial à Pages. Essas ações externas não foram executadas.
3. Autorizar expressamente a primeira implantação. O primeiro `pages.dev` pode ficar público antes mesmo de associar um domínio próprio; previews também exigem configuração de acesso se a revisão precisar ser privada.
4. Depois da implantação autorizada, conferir domínio real, DNS, TLS, normalização de URLs e cabeçalhos aplicados na borda da Cloudflare.

Não foi encontrado bloqueio funcional no projeto para a Pages. O ambiente da Cloudflare e a integração com a conta GitHub não foram exercitados, pois isso exigiria executar ações de publicação que o usuário pediu para adiar. Os layouts de celular foram emulados; não houve teste em aparelho físico nem auditoria de acessibilidade com leitor de tela real. A busca por segredos cobre o histórico local disponível, não outros repositórios ou credenciais guardadas nas contas dos serviços.

O procedimento completo e as fontes oficiais estão em [DEPLOY.md](DEPLOY.md).
