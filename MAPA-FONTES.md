# Mapa regional — fontes, tratamento e licenças

Dados preparados em 26/10/2026 para o mapa real da região de Bombinhas. O arquivo compacto `region.geojson` tem 17 feições e aproximadamente 295 KB. Nenhum tile raster ou print de mapa foi baixado.

## Base territorial

O contorno de Santa Catarina e os polígonos municipais de Bombinhas, Porto Belo e Itapema vieram da [API de Malhas Geográficas v3 do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3), em GeoJSON com qualidade máxima disponível nessa API simplificada. O contorno estadual foi recortado ao enquadramento regional; os três polígonos municipais foram mantidos. A API usa uma simplificação apropriada para exibição web; não é um levantamento cadastral de alta precisão.

Os IDs consultados foram estado 42 e municípios 4202453, 4213500 e 4208302. Não foi informado ano no parâmetro `periodo`; por isso não se afirma que a malha representa a última alteração administrativa. Os URLs exatos estão em `sources.json`.

O [documento técnico e legal da Malha Municipal Digital do IBGE](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102152.pdf), página 8, declara licença compatível com **Creative Commons BY 4.0**, permitindo adaptação e uso comercial com os créditos originais. A extração automática do PDF foi recusada pelo servidor; o texto da licença pôde ser verificado no índice de busca do próprio documento oficial.

## Ruas, vias e referências de localidade

Os dados são de **© OpenStreetMap contributors**, obtidos em uma consulta regional e armazenados localmente a partir da instância pública Overpass do VK Maps. A [lista oficial de instâncias do projeto OSM](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances) informa que essa instância permite uso em qualquer projeto. O site final não depende desse serviço em tempo de execução.

Dados OSM são licenciados sob **ODbL 1.0**. Manter a [atribuição ao OpenStreetMap](https://www.openstreetmap.org/copyright) visível e oferecer o conjunto derivado com as condições correspondentes. O arquivo `region.geojson` pode ser disponibilizado como download junto ao mapa; as origens e licenças por camada estão descritas em `sources.json`.

O snapshot efetivo está no campo `metadata.osmBase` do GeoJSON. Foram extraídas vias arteriais e ligações, com detalhe adicional perto das cidades atendidas. Segmentos contíguos de grau dois foram unidos, e as linhas foram simplificadas em aproximadamente 50 m na base e 13 m nas conexões. Os nomes e coordenadas não foram inventados; coordenadas e pontos foram arredondados a seis casas decimais.

## Marcadores e aeroportos

| Referência | Longitude | Latitude | Origem |
| --- | --- | --- | --- |
| Bombinhas | -48.487569 | -27.151916 | OSM town node 296141631 |
| Porto Belo | -48.542440 | -27.154242 | OSM town node 415523653 |
| Itapema | -48.613778 | -27.094720 | OSM town node 296141091 |
| Florianópolis — FLN | -48.545580 | -27.673708 | Centroide do terminal de passageiros OSM way 628144667 |
| Navegantes — NVT | -48.648851 | -26.880442 | Centroide do terminal de passageiros OSM way 424906014 |

Bombinhas é a referência geográfica da cidade/base de atendimento, **não a localização exata do endereço comercial**. Todos os cinco pontos foram verificados dentro do polígono terrestre do IBGE.

FLN foi conferido com a [página oficial atual de acesso do Floripa Airport](https://floripa-airport.com/como-chegar), que informa Rodovia Acesso ao Aeroporto 6.200 e incorpora mapa centrado em torno de longitude -48.548386 / latitude -27.672555. O polígono selecionado é o terminal de passageiros a sul da pista principal, com nome “Terminal de Passageiros do Floripa Airport”. Ele é distinto do terminal militar DTCEA-FL localizado a norte (way 247558872), que não foi usado. NVT está dentro do sítio aeroportuário com IATA NVT (relation 6632617).

## Conexões coerentes, sem promessa de navegação

As quatro conexões foram derivadas **localmente** do grafo real das vias OSM, por Dijkstra com preferência por vias arteriais. Sentidos únicos explícitos e padrão de autoestradas/rotatórias foram considerados; vias com acesso privado/proibido foram excluídas. Restrições de conversão em relações, condições temporárias, regras para veículos específicos e trânsito não foram avaliados.

As conexões devem ser apresentadas como **trajetos indicativos sobre vias reais**, sem instruções de navegação, trânsito, prazo ou quilometragem comercial garantida. As ligações norte seguem BR-101 e BR-470 até Navegantes; a ligação sul segue BR-101, Ponte Governador Pedro Ivo Campos e SC-401/acesso ao terminal FLN. Cada rota e os IDs OSM utilizados estão em `route-audit.json`.

Marcadores ficam no ponto geográfico da cidade ou no centroide do terminal; as linhas seguem os nós viários próximos, com deslocamentos de encaixe de 32 a 139 m. Não foram desenhados atalhos retos sobre água ou vias inexistentes.

Os polígonos de cobertura são os municípios reais, não uma garantia de atendimento irrestrito a todo ponto interno. A disponibilidade continua sujeita ao contato comercial.

O demo OSRM não foi utilizado, porque sua documentação restringe o serviço a casos não comerciais. Nenhuma chave de API, geolocalização do visitante ou chamada a terceiros é necessária para renderizar esses dados já preparados.

## Arquivos de preparação

- `prepare-region.mjs`: recorte, simplificação, união das vias, pontos e cálculo das conexões.
- `region.geojson`: conjunto compacto aprovado para integração.
- `route-audit.json`: origem dos pontos, encaixes e IDs das vias de cada conexão.
- `sources.json`: proveniência, hash, URLs, licenças e limites de uso.
- `*-raw.*`, consultas e página oficial de referência: evidências de preparação, fora da publicação.

Não é necessário publicar arquivos brutos ou ferramentas de obtenção dos dados para que o mapa funcione. Manter os avisos de origem/licença e disponibilizar o GeoJSON derivado é a forma recomendada de tornar a preparação verificável.
