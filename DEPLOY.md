# Publicação na Cloudflare Pages com GitHub

Preparação local de 29/10/2026. **Nenhum repositório foi enviado ao GitHub e nenhuma implantação ou alteração de DNS foi realizada nesta revisão.** O site atualmente hospedado no Sites permanece como estava.

Atualização de 01/11/2026: o erro de mapa ausente foi reproduzido a partir do repositório GitHub incompleto. Consulte `CORRECAO-BUILD-CLOUDFLARE.md` e a configuração explícita de npm 11 abaixo antes de reenviar os arquivos.

## Tecnologia e compatibilidade

O projeto usa HTML, CSS e JavaScript nativos, gerados por scripts ES Modules em Node.js. Não usa Astro, React, Vite ou Next.js, não instala bibliotecas de aplicação e não precisa de servidor Node em produção. O npm e seu `package-lock.json` existentes foram mantidos.

Os formulários validam os dados no navegador, preparam uma mensagem e abrem um link do WhatsApp. Não enviam e-mail, não gravam reservas, não usam API própria ou banco de dados. O atendimento confirma disponibilidade e contratação fora do site. Mapas, fontes, imagens, traduções e carrosséis são locais. Somente o idioma é persistido no navegador. Não são necessárias Pages Functions, Workers, D1, R2, serviços de e-mail ou chaves de API para essas funcionalidades.

## Configuração do projeto na Pages

| Campo | Valor |
| --- | --- |
| Tipo de projeto | **Pages**, com integração Git |
| Framework preset | **None** |
| Production branch | A branch aprovada para produção, normalmente `main` |
| Root directory | Raiz que contém `package.json`; em um repositório exclusivo, deixar vazio |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | **24.x**, definido em `.node-version`; validado localmente com **24.16.0** |
| npm | **11.x**, validado com **11.13.0** |
| Servidor/comando de start | Não configurar; Pages serve os arquivos estáticos |

Se colocar o projeto em um repositório com várias pastas, configure Root directory para a pasta do site, nunca para a pasta `dist`. Não selecione Worker ou Next.js, nem configure `npm start` como comando de build.

## Variáveis de ambiente

**`SITE_URL` é a única configuração de conteúdo necessária para a migração.** Defina no ambiente de build da Cloudflare o endereço HTTPS final, por exemplo `https://www.seudominio.com.br`. Use o endereço realmente aprovado; não publique o exemplo. Não inclua `/fretes`, credenciais, parâmetros ou fragmentos.

Essa variável atualiza canonical, hreflang, Open Graph, JSON-LD, sitemap e a referência de sitemap em robots.txt, preservando títulos, descrições e textos comerciais. A barra final da origem é normalizada. Valores inválidos interrompem o build.

Sem `SITE_URL`, o build mantém o endereço da hospedagem atual para preservar o projeto existente. **Antes de publicar em um domínio novo, configure `SITE_URL` corretamente; manter o fallback na Pages deixaria o SEO apontando para a hospedagem antiga.** Defina também um valor adequado no ambiente Preview, caso o utilize. Para previews temporários, normalmente se mantém a origem canônica da produção aprovada.

Não há variáveis secretas, senhas, tokens de Cloudflare ou credenciais de GitHub necessárias ao código. A conexão entre os serviços usa a integração oficial, fora do repositório. Se precisar sobrescrever a seleção de runtime no painel, `NODE_VERSION=24` deve concordar com `.node-version`. O campo `engines` declara a versão esperada, mas não instala nem troca o npm da Cloudflare.

### Quando a Cloudflare disponibilizar npm 10

Node 24.22.1 satisfaz `>=24 <25`; o aviso `EBADENGINE` relatado vem do npm 10.9.2, fora de `>=11 <12`. Esse aviso é separado da falha fatal `ENOENT` causada pelo mapa ausente. Não use `npm@latest`, pois uma versão 12 também ficaria fora do intervalo declarado.

Para executar a instalação e o build com a versão npm 11 validada, configure **Production e Preview**, conforme o ambiente usado:

| Campo | Valor |
| --- | --- |
| `NODE_VERSION` | `24` (ou manter `.node-version` com `24`) |
| `SKIP_DEPENDENCY_INSTALL` | `1` |
| `SITE_URL` | Domínio HTTPS final aprovado |
| Output directory | `dist` |

Use este **Build command** completo, em uma linha:

```sh
npx --yes --package=npm@11.13.0 -- npm ci --ignore-scripts --no-audit --no-fund && npx --yes --package=npm@11.13.0 -- npm run build
```

O `npx` do ambiente obtém o pacote oficial npm 11.13.0 e executa seus comandos sem alterar o npm global. `SKIP_DEPENDENCY_INSTALL=1` evita que a etapa automática anterior da Pages instale o projeto usando npm 10. Essa configuração não depende de `NPM_VERSION` ser reconhecida pela imagem de build. O comando foi validado em uma cópia limpa com Node 24 e npm 11.13.0; a configuração no painel não foi alterada nesta tarefa.

O comando básico do projeto continua sendo `npm run build`. A etapa `prebuild` agora verifica os arquivos obrigatórios e a integridade do mapa antes de importar o gerador. Ela não baixa, inventa ou substitui dados geográficos.

`.env.example` contém somente uma configuração pública de exemplo. O comando `npm run build` não carrega `.env` automaticamente. Configure `SITE_URL` no painel da Pages ou no ambiente do terminal. Não comite arquivos `.env` reais.

## Verificar localmente

Na raiz do projeto, com Node 24 e npm 11:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm test
npm run check
npm run check:pages
```

Para testar o novo domínio em PowerShell, antes dos comandos de build e verificação:

```powershell
$env:SITE_URL = 'https://www.seudominio.com.br'
npm run build
npm run check:pages
```

Depois do teste, remova essa variável do terminal se quiser voltar ao domínio padrão:

```powershell
Remove-Item Env:SITE_URL
```

`npm start` abre apenas o servidor de desenvolvimento em `http://127.0.0.1:4173`. Ele não é o servidor da Cloudflare nem publica o site. Python/Pillow só é usado nas ferramentas opcionais de preparação de fotografias, não no build de produção. Não execute essas ferramentas para implantar as imagens já aprovadas.

O CSS original, as fontes e as licenças agora têm entradas preservadas em `public/assets/`. Assim, o build funciona mesmo sem uma pasta `dist` anterior. O diretório `dist` gerado pode ser recriado, mas nenhum arquivo já rastreado foi removido do checkout existente.

## Preparar o GitHub sem afetar a hospedagem atual

O checkout atual pertence ao repositório do Sites. O seu remote e a identidade `.openai/hosting.json` foram preservados; esse identificador não é uma credencial e não é usado pela Cloudflare Pages.

O pacote `Ademir-Transportes-GitHub-Cloudflare.zip` é uma cópia de trabalho para um repositório próprio. Ele inclui fontes, traduções, ferramentas, testes, licenças e imagens públicas aprovadas, sem `.git`, `dist`, `node_modules`, originais privados ou arquivos do navegador de testes. O projeto original e seu histórico permanecem no local anterior.

Na correção de 01/11/2026, o pacote completo passou a se chamar `Ademir-Transportes-GitHub-Cloudflare-Corrigido.zip`. Ele contém todos os arquivos necessários, inclusive `public/maps/region.geojson`, `sources.json`, `FONTES.txt`, as 88 variantes de imagens e os arquivos que começam com ponto. O ZIP anterior também continha o mapa; a ausência ocorreu no repositório enviado ao GitHub.

**Não envie o ZIP como um arquivo dentro do repositório**: o GitHub não o extrai para a Cloudflare. Extraia o pacote e envie a estrutura de pastas. O envio pelo navegador permite até 100 arquivos por vez; prefira Git/GitHub Desktop para o projeto completo ou use o pacote complementar, que fica abaixo desse limite. Inclua também os arquivos ocultos. Se quiser manter a revisão sem implantação automática, pause as implantações da branch na Cloudflare antes de fazer um commit/push pelo GitHub. Nenhum push foi feito aqui.

1. Extraia o ZIP em uma pasta exclusiva. Confirme que `package.json` e este documento estão na raiz.
2. Crie um repositório no GitHub, preferencialmente privado durante a revisão.
3. Na pasta extraída, revise e prepare o commit:

```sh
git init -b main
git add .
git status --short
git diff --cached --stat
git commit -m "Prepare Ademir Transportes for Cloudflare Pages"
git remote add origin https://github.com/SEU_USUARIO/ademir-transportes.git
```

O endereço acima é ilustrativo. Substitua-o pelo repositório real. Somente depois da revisão, envie manualmente com `git push -u origin main`. Nenhum desses comandos de criação, commit ou envio foi executado por esta preparação.

O `.gitignore` protege dependências, saídas, `.env`, chaves privadas e temporários. Ele não remove automaticamente arquivos já presentes no histórico. A revisão deste checkout não encontrou credenciais nos arquivos rastreados nem nos objetos textuais alcançáveis do histórico local. Os telefones e o endereço comercial públicos foram mantidos. Refaça a conferência antes de acrescentar arquivos de outra origem.

## Conectar à Cloudflare Pages após aprovação

1. No painel da Cloudflare, abra **Workers & Pages → Create application → Pages → Import an existing Git repository**.
2. Conecte o GitHub e autorize o acesso ao repositório escolhido. Selecione o repositório do site.
3. Preencha os campos da tabela acima e configure `SITE_URL` no ambiente Production. Confira as definições separadas de Preview.
4. **Pare para revisar antes de acionar a primeira implantação.** Criar a implantação pode disponibilizar imediatamente o endereço `*.pages.dev`, mesmo sem domínio próprio. Um repositório privado no GitHub não torna o site privado.
5. Quando autorizar a publicação, inicie o deploy pelo painel e confira o log de build. Em integração Git, pushes posteriores na branch de produção podem implantar automaticamente; configure os controles de branches de acordo com seu processo de aprovação.
6. Somente depois da validação, associe o domínio aprovado na área **Custom domains** e siga as instruções de DNS apresentadas para esse domínio. Confira HTTPS antes de divulgar o endereço. A origem em `SITE_URL` deve coincidir com a opção canônica escolhida, com ou sem `www`.

Previews da Pages também são públicos por padrão. Se precisar de revisão restrita, configure Cloudflare Access para os previews e confira separadamente a proteção do domínio de produção. `noindex` não é controle de acesso. Nada disso foi ativado nesta preparação.

## Rotas, cabeçalhos e SEO

O build gera cinco páginas em cada idioma, além de `404.html` e `es/404.html`. Pages consegue servir os diretórios com `index.html`; o controlador de idiomas já reconhece os caminhos com ou sem barra final. Não adicione uma regra genérica `/* /index.html 200`: este é um site de várias páginas, e esse fallback encobriria erros 404.

Preserve `dist/_headers`. Ele contém CSP por hash, políticas de segurança e cache dos arquivos com hash. O tamanho das linhas é validado por `npm run check:pages` contra o limite de 2.000 da Pages. A tag solicitada `G-9JF0G9JMKV` e seus destinos de coleta estão autorizados na CSP, com hash para a inicialização inline e sem `unsafe-inline` ou `unsafe-eval`. O aviso de privacidade foi atualizado em PT/ES. Consulte `GOOGLE-ANALYTICS.md`; outras tags exigem revisar a CSP novamente.

`dist/sitemap.xml` contém as dez páginas e seus alternates PT/ES. `robots.txt` permite indexação da produção e aponta ao sitemap. As fotografias têm nomes com hash, srcset e tamanhos proporcionais; as secundárias dos carrosséis são carregadas sob demanda. Não publique a raiz do repositório como diretório estático: apenas `dist` deve ser servido.

## Conferência depois da implantação manual

- Abrir `/`, `/fretes`, `/taxi`, `/sobre`, `/contato` e as cinco versões `/es/`, `/es/fletes`, `/es/taxi`, `/es/nosotros`, `/es/contacto`, inclusive por acesso direto.
- Conferir seleção e troca de idioma, títulos, navegação, carrosséis, galeria e mapa em desktop e celular.
- Verificar os formulários e os contatos: fretes **(47) 99781-3000**, táxi **(47) 99730-2343**. Usar dados fictícios e não enviar mensagens de teste ao atendimento.
- Conferir no domínio final canonical, alternates, JSON-LD, `sitemap.xml`, `robots.txt`, cabeçalhos HTTP, imagens e respostas 404 em PT/ES.
- Validar DNS, certificado e comportamento de redirecionamentos no ambiente real. Essa etapa depende de uma implantação autorizada e não foi executada localmente.

Os resultados da preparação estão em `REVISAO-PRODUCAO.md`. Não foram alterados textos comerciais, design, cores, fotografias, formulários, contatos, comportamento do idioma ou componentes de apresentação.

## Referências oficiais consultadas

- [HTML estático na Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [Configuração de build](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Runtime e seleção de Node.js](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Integração Git](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [GitHub](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Rotas e páginas 404](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cabeçalhos](https://developers.cloudflare.com/pages/configuration/headers/)
- [Previews e controle de acesso](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Envio de arquivos no GitHub e limite por upload](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [npm exec/npx com uma versão específica](https://docs.npmjs.com/cli/v11/commands/npm-exec/)
