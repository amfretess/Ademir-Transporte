# Correção do build: mapa ausente e versão do npm

Data: 01/11/2026. Alterações e testes exclusivamente locais; nenhum push ou deploy foi executado.

## Causa confirmada

O projeto original e o ZIP entregue em 29/10 contêm `public/maps/region.geojson`, com 295.290 bytes. O arquivo no ZIP é idêntico ao original e não é ignorado pelo `.gitignore`.

O pacote anterior `Ademir-Transportes-GitHub-Cloudflare.zip` contém 152 arquivos e mantém o SHA-256 registrado na entrega:

```text
37583ebe39aa453d2a51487a46054519d07d1747df84cfe34da2f02f3f21fcbd
```

A branch `main` de [amfretess/Ademir-Transporte](https://github.com/amfretess/Ademir-Transporte), no commit inspecionado `50371324bf65d573eb40c0148c6fa58253d2801b`, tem apenas **100 arquivos**. Todos os 100 correspondem byte por byte aos respectivos arquivos do pacote original. Faltam **52**:

- O mapa e seus dois registros de fontes/licenças em `public/maps/`.
- 44 variantes de imagens: sete de fretes e 37 de táxi.
- Cinco arquivos de configuração que começam com ponto: `.env.example`, `.gitattributes`, `.gitignore`, `.node-version`, `.openai/hosting.json`.

Portanto, a falha fatal é causada por um checkout incompleto no GitHub, anterior ao build da Cloudflare. Baixei uma cópia desse commit e reproduzi o mesmo `ENOENT` ao executar `npm run build`, mesmo usando npm 11. O mapa não precisa ser recriado ou buscado novamente na internet.

O envio pelo navegador do GitHub aceita até 100 arquivos por vez. A contagem observada é compatível com esse limite e com a omissão de arquivos ocultos na seleção, mas não permite afirmar qual ação de upload foi usada. O fato confirmado é que os arquivos não chegaram ao commit inspecionado.

## Mapa legítimo preservado

O GeoJSON original é uma `FeatureCollection` com 17 features, baseada nos dados IBGE/OpenStreetMap e nos processamentos documentados em `public/maps/sources.json` e `FONTES.txt`. Seu SHA-256 é:

```text
8afb254b3dad163ce826d61e2f259e3fd517e033055738046056d2ca1af58e10
```

Esse mesmo arquivo foi mantido em todos os novos pacotes. Nenhuma coordenada, limite municipal, ponto, via ou conexão foi inventada, trocada ou alterada nesta correção. As imagens públicas também permanecem com os mesmos bytes e hashes.

## Proteção adicionada ao build

`package.json` agora executa `tools/check-build-inputs.mjs` automaticamente como `prebuild`. A verificação cobre 118 entradas necessárias, incluindo as 88 variantes de fotos, arquivos de estilo, fontes, traduções, módulos e os três arquivos do mapa. Confere também o hash/tamanho registrados do mapa e a grafia exata dos caminhos, inclusive no Windows.

Se faltar algum arquivo, o build para antes de importar `region-map.mjs` e apresenta a lista completa dos caminhos ausentes. A verificação não tenta baixar dados nem criar um mapa substituto. Foram acrescentados três testes em `tests/build-inputs.test.mjs` para checkout completo, entradas ausentes e diferença de maiúsculas/minúsculas.

Não foram modificados `region-map.mjs`, textos comerciais, contatos, formulários, componentes visuais, fotografias ou coordenadas. O resultado estático completo continua igual ao anterior: 123 arquivos públicos, dez páginas em PT/ES, 15 fotos e 88 variantes.

## Aviso EBADENGINE

O Node **24.22.1** informado pela Cloudflare satisfaz `>=24 <25`. O **npm 10.9.2** não satisfaz `>=11 <12`. O aviso de versão não causou o `ENOENT`; são problemas distintos.

Mantive Node 24 e o requisito npm 11. Em vez de depender de `NPM_VERSION` ser reconhecida pela imagem, o guia atualizado executa explicitamente npm **11.13.0** usando o pacote oficial via npx, sem alterar o npm global.

Na Cloudflare, depois de sua revisão, configure o ambiente usado (Production/Preview):

```text
NODE_VERSION=24
SKIP_DEPENDENCY_INSTALL=1
SITE_URL=https://DOMINIO-FINAL-APROVADO
```

O último valor é um marcador: substitua pelo endereço real. O diretório de saída permanece `dist`. O Build command para a imagem que disponibiliza npm 10 é:

```sh
npx --yes --package=npm@11.13.0 -- npm ci --ignore-scripts --no-audit --no-fund && npx --yes --package=npm@11.13.0 -- npm run build
```

`SKIP_DEPENDENCY_INSTALL` desativa a instalação automática anterior com npm 10. O comando básico do projeto permanece `npm run build`. Não use `npm@latest`, pois npm 12 não corresponde ao intervalo declarado.

## Verificações concluídas

- Extração de um pacote de fontes em uma pasta nova, sem `.git`, `dist` ou `node_modules` pré-existentes.
- Mapa extraído idêntico ao original; conferência das demais entradas antes do build.
- Instalação por npm 11.13.0 via npx e build com esse mesmo npm, usando o comando documentado.
- `npm run build`: dez páginas geradas, sem o erro de arquivo ausente.
- `npm test`: **34 testes aprovados**, incluindo os cinco testes existentes dos dados geográficos e os três novos testes de entradas.
- `npm run check`: aprovado; rotas, assets, âncoras, SEO, quatro combinações de serviço/idioma e contatos separados preservados.
- `npm run check:pages`: aprovado; dez rotas, 15 fotos, 88 variantes, 123 arquivos, referências e hashes íntegros.
- Resultado do build comparado ao pacote anterior: conteúdo público preservado byte por byte.

O ambiente local validado usa Node 24.16.0 e npm 11.13.0. A imagem real da Cloudflare e o Node 24.22.1 do log não foram executados aqui. A mudança de configuração no painel e a implantação foram deixadas para sua revisão, como solicitado.

## Arquivos para atualizar no GitHub

Use o pacote completo `Ademir-Transportes-GitHub-Cloudflare-Corrigido.zip` ou o complementar `Ademir-Transportes-Correcao-GitHub.zip`. O complementar inclui os 52 arquivos ausentes do commit inspecionado e os arquivos alterados/adicionados nesta correção. Os caminhos exatos estão em `Arquivos-Atualizar-GitHub.txt`, entregue ao lado dos ZIPs.

As atualizações de código/documentação são:

- `package.json` — etapa prebuild e inclusão dos novos testes.
- `tools/check-build-inputs.mjs` — verificação prévia.
- `tests/build-inputs.test.mjs` — regressões de integridade do checkout.
- `DEPLOY.md`, `README.md`, `REVISAO-PRODUCAO.md` e este relatório — configuração de npm e diagnóstico do envio incompleto.

Não é necessário alterar os contatos ou reconstruir as fotos. `package-lock.json` mantém os requisitos já existentes e segue incluído no pacote completo. `region-map.mjs` não requer mudança: ele precisa receber o arquivo original no caminho que já usa.

**Extraia o ZIP antes de enviar.** Um ZIP armazenado como arquivo no GitHub não é extraído automaticamente pelo build. Preserve `public/maps/...`, `public/images/...`, arquivos ocultos e todas as demais pastas. Prefira Git/GitHub Desktop para enviar o projeto completo, ou carregue o pacote complementar pelo navegador, abaixo do limite de 100 arquivos por envio.

Como a Cloudflare pode implantar automaticamente após um commit na branch conectada, pause essas implantações antes de atualizar o GitHub se quiser manter a revisão sem deploy. Aqui não foi criado commit nem alterado arquivo remoto.

## Referências oficiais

- [Limite de arquivos por upload no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Ambiente de build e SKIP_DEPENDENCY_INSTALL na Cloudflare](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Execução de um pacote específico com npm exec/npx](https://docs.npmjs.com/cli/v11/commands/npm-exec/)
