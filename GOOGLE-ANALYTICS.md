# Google Analytics — Ademir Transportes

Atualização de 06/11/2026. ID público: **G-9JF0G9JMKV**.

A tag fornecida foi centralizada em `google-tag.mjs` e incluída pelo gerador `i18n-build.mjs` uma única vez no `<head>` de cada uma das dez páginas em português/espanhol e das duas páginas 404. O carregamento de `gtag.js` é assíncrono. Não há variável de ambiente nem dependência npm adicional.

`security-policy.mjs` autoriza o script do Google e os destinos de coleta do Analytics tanto na meta CSP quanto em `dist/_headers`. A inicialização inline é autorizada por SHA-256. Permanecem os bloqueios de formulários nativos, frames, workers, `unsafe-inline` e `unsafe-eval`. Os destinos seguem a documentação do Google para Analytics sem recursos de publicidade; nenhuma tag Google Ads foi adicionada.

O aviso de privacidade em PT/ES foi atualizado porque o texto anterior afirmava não utilizar cookies de rastreamento. O código de formulários, os números de WhatsApp, os textos comerciais, o design, as fotografias e o mapa permanecem iguais. Não foram adicionados eventos personalizados nem dados de formulários à fila do Analytics. A exportação HTML independente para uso offline continua sem carregar recursos externos.

## Build e publicação manual

```sh
npm run build
npm test
npm run check
npm run check:pages
```

O build gera a versão atualizada em `dist`. Use os arquivos-fonte do ZIP completo atualizado para GitHub ou o ZIP complementar desta tag sobre o projeto já corrigido. Preserve `dist/_headers` na hospedagem; editar somente o HTML ou somente os cabeçalhos pode bloquear a tag. Não insira uma segunda cópia do snippet no painel da hospedagem ou em outro componente.

Não foi feito commit, push ou deploy. Como a integração GitHub → Cloudflare pode publicar automaticamente um push, revise seus controles de implantação antes de enviar os arquivos. As configurações de Node 24/npm 11, build e saída permanecem as de `DEPLOY.md`.

## Validação após publicar

Abra o domínio final com o [Tag Assistant](https://tagassistant.google.com/) e confira o ID **G-9JF0G9JMKV**. Verifique também os relatórios de tempo real da propriedade Google Analytics correspondente. A presença da tag no build não confirma recebimento de eventos pela propriedade: essa confirmação depende da versão publicada, do navegador e do acesso à conta do Analytics. Bloqueadores de rastreamento podem impedir a coleta.

Referências oficiais: [instalação gtag.js](https://developers.google.com/tag-platform/gtagjs), [CSP para Google Analytics](https://developers.google.com/tag-platform/security/guides/csp), [privacidade do Google](https://policies.google.com/privacy).
