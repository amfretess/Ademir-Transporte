export const GOOGLE_TAG_ID='G-9JF0G9JMKV';
export const googleTagScript=`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GOOGLE_TAG_ID}');
`;
export const googleTagHead=`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>
<script>${googleTagScript}</script>`;
