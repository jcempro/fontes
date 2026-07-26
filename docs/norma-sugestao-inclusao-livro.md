# NORMA-IF-SIL-001 — Sugestão Estruturada para Inclusão de Livro

## 1. Autoridade, finalidade e limite

- `SIL-001` Esta norma DEVE ser subordinada ao `RCF-IF-001` e especifica exclusivamente a produção, em JSON ou YAML, de uma sugestão completa para inclusão de um Livro no schema 5.
- `SIL-002` JSON e YAML DEVEM representar o mesmo modelo de dados. Formato, indentação, aspas, marcador de lista e terminador de linha NÃO DEVEM alterar significado, obrigatoriedade, valor, ordem normativa ou validação.
- `SIL-003` A sugestão DEVE conter exatamente as propriedades definidas nesta norma. Chave desconhecida, alias, chave duplicada, propriedade omitida ou valor fora do domínio DEVE produzir diagnóstico e impedir sua classificação como sugestão completa.
- `SIL-004` Toda chave estrutural marcada como obrigatória DEVE existir. Quando a informação puder faltar, a chave DEVE continuar presente com o único valor vazio autorizado: `null`, `{}` ou `[]`, conforme a matriz desta norma.
- `SIL-005` “Opcional” qualifica o valor informativo interno, nunca autoriza omitir uma chave estrutural obrigatória.
- `SIL-006` A sugestão recebida por Issue DEVE ser tratada como entrada não confiável. Ela NÃO DEVE alterar `metadata.json`, Hash Global, Hash da Fonte, asset, índice ou publicação sem aquisição independente, validação integral e fluxo editorial normal.
- `SIL-007` A Issue DEVE ser apenas evidência e proposta. Hash, tamanho, autoria, edição, categoria, token, URL, associação e equivalência declarados pelo proponente DEVEM ser recalculados ou confirmados por fonte independente.
- `SIL-008` Esta norma NÃO cria propriedade nova no schema 5, NÃO substitui o schema publicado e NÃO autoriza código, workflow, importação ou publicação.
- `SIL-009` Em conflito, o RCF vigente DEVE prevalecer. O exemplo original que usa `./source-*.7z` em `sources.url` NÃO atende a `RCF-IF-DATA-019`; nesta norma, `assets.url` identifica o pacote local servido e `sources.url` preserva a URL HTTP(S) consultada.
- `SIL-010` No escopo de sugestão completa de inclusão, `sources` DEVE possuir ao menos um item porque a proposta precisa identificar a origem de ao menos um artefato editorial. Essa restrição qualifica somente este perfil e NÃO altera o contrato geral de leitura do schema 5.

## 2. Perfil de interoperabilidade JSON/YAML

### 2.1 Modelo semântico comum

| Conceito | JSON | YAML | Regra |
| --- | --- | --- | --- |
| objeto | object | mapping | chaves textuais únicas e sensíveis a caixa |
| lista ordenada | array | sequence | a ordem DEVE ser preservada |
| texto | string | string scalar | Unicode válido, sem controle proibido |
| inteiro | number sem fração | integer scalar | base decimal, sem expoente |
| ausência autorizada | `null` | `null` | NÃO usar `~`, chave vazia ou string `"null"` |
| objeto vazio | `{}` | `{}` | permitido somente em `book.edition` |
| lista vazia | `[]` | `[]` | permitida somente onde a matriz autoriza |

- `SIL-FMT-001` As chaves DEVEM usar exatamente `snake_case` ASCII conforme a matriz.
- `SIL-FMT-002` A representação DEVE ser um único documento com um único objeto raiz.
- `SIL-FMT-003` JSON DEVE ser UTF-8 válido, sem BOM, comentários, vírgula final, `NaN`, `Infinity` ou chave duplicada.
- `SIL-FMT-004` YAML DEVE usar o subconjunto seguro compatível com YAML 1.2: mapping, sequence, string, integer e `null`. Âncora, alias, merge key, tag explícita, objeto tipado, diretiva, documento múltiplo e execução de construtor DEVEM ser rejeitados.
- `SIL-FMT-005` Em YAML, hash, token, idioma, URL, ID, slug, data ou texto que possa sofrer resolução implícita DEVE ser tratado como string. Emissor DEVERIA colocar aspas em toda string.
- `SIL-FMT-006` Conversão YAML → modelo intermediário → JSON NÃO DEVE alterar caixa, Unicode, ordem de listas, inteiro, `null`, `{}`, `[]` ou sequência hexadecimal.
- `SIL-FMT-007` O `metadata.json` publicado DEVE continuar sendo JSON. YAML é somente representação interoperável de entrada ou autoria.
- `SIL-FMT-008` Alias tolerado pelo parser geral de Issues NÃO DEVE aparecer na sugestão completa canônica.

## 3. Estrutura integral, obrigatoriedade e valores

### 3.1 Objeto raiz

| Caminho | Obrigatória | Tipo | Cardinalidade/valor possível | Regra |
| --- | --- | --- | --- | --- |
| `schema_version` | sim | inteiro | exclusivamente `5` | versão do contrato; não inferir nem converter string |
| `book` | sim | objeto | exatamente 7 chaves | identidade e descrição editorial |
| `short_token` | sim | string | `[A-Za-z0-9_-]+` | case-sensitive, estável e único |
| `global_hashes` | sim | lista | 1 ou 2 itens | exatamente um item para cada PDF/EPUB aceito |
| `assets` | sim | lista | 3 a 5 itens no perfil corrente | contêineres aceitos, capa, QR e pacote agregado facultativo |
| `sources` | sim | lista | 1 ou mais itens | uma entrada por fonte/formato efetivamente proposto |

- `SIL-ROOT-001` O objeto raiz DEVE conter somente as seis chaves da tabela.
- `SIL-ROOT-002` A ordem recomendada DEVE ser a da tabela; consumidor NÃO DEVE depender da ordem de chaves.
- `SIL-ROOT-003` `global_hashes`, `assets` e `sources` NÃO DEVEM usar `null`.

### 3.2 `book`

| Caminho | Obrigatória | Tipo | Valor possível | Valor vazio | Obtenção normativa |
| --- | --- | --- | --- | --- | --- |
| `book.id` | sim | string | `[a-z0-9]+(?:-[a-z0-9]+)*` | proibido | atribuição inicial determinística e verificação de unicidade |
| `book.title` | sim | string | texto editorial Unicode não vazio | proibido | título principal comprovado |
| `book.contributors` | sim | lista | 1 ou mais objetos | proibido | evidência editorial; ao menos um `author` |
| `book.edition` | sim | objeto | `{}`, `qualifier`, `year` ou ambos | `{}` | somente dado editorial não inferível |
| `book.language` | sim | string | etiqueta BCP 47 válida em minúsculas | proibido | idioma da edição, não da interface |
| `book.primary_category` | sim | string | `[a-z0-9]+(?:-[a-z0-9]+)*` | proibido | vocabulário editorial controlado |
| `book.tags` | sim | lista | zero ou mais slugs únicos | `[]` | classificação adicional comprovada |

#### 3.2.1 Identidade e título

- `SIL-BOOK-001` `book.id` DEVE permanecer imutável depois de atribuído, mesmo que rota, título, token ou classificação mudem.
- `SIL-BOOK-002` Para Livro novo sem ID histórico, o candidato DEVERIA resultar de `language + "-" + primary_category + "-" + title`, com normalização Unicode, remoção de diacríticos, minúsculas, conversão de separadores para hífen e colapso de hífens. A atribuição somente DEVE ocorrer após busca de colisão, alias e tombstone.
- `SIL-BOOK-003` Colisão de ID NÃO DEVE ser resolvida silenciosamente. Identificador editorial confiável, edição ou desambiguador humano aprovado DEVE decidir o novo ID.
- `SIL-BOOK-004` `book.title` DEVE preservar a forma editorial comprovada; slug, nome de arquivo, URL, cabeçalho corrente, título da janela ou resultado de OCR isolado NÃO DEVE substituí-lo.
- `SIL-BOOK-005` Qualificador de edição incorporado historicamente ao título DEVE permanecer no título para compatibilidade e também ser projetado em `book.edition.qualifier` quando o RCF assim exigir.

#### 3.2.2 `contributors`

| Caminho | Obrigatória | Tipo | Valor possível | Regra |
| --- | --- | --- | --- | --- |
| `book.contributors[].name` | sim | string | nome editorial Unicode não vazio | não abreviar, traduzir ou inventar |
| `book.contributors[].role` | sim | string | token `[a-z][a-z0-9-]*` | `author` possui semântica obrigatória; demais papéis são editoriais |

- `SIL-CONTRIB-001` O primeiro item com `role: "author"` DEVE representar o autor principal.
- `SIL-CONTRIB-002` Ao menos um item `author` DEVE existir. Ausência, conflito material ou baixa confiança DEVE impedir sugestão completa.
- `SIL-CONTRIB-003` Papéis recomendados quando comprovados são `author`, `editor`, `translator`, `compiler` e `illustrator`. Outro token conforme o padrão é permitido somente quando seu significado editorial estiver documentado na evidência; ele NÃO adquire semântica automática.
- `SIL-CONTRIB-004` A ordem DEVE seguir a ordem de crédito da edição; autores primeiro apenas quando a própria fonte editorial assim os apresenta.
- `SIL-CONTRIB-005` Duplicata exata de `name + role` DEVE ser removida; pessoas homônimas NÃO DEVEM ser fundidas sem evidência.

#### 3.2.3 `edition`

| Caminho | Obrigatória | Tipo | Valor possível | Regra |
| --- | --- | --- | --- | --- |
| `book.edition.qualifier` | não | string | texto não vazio | edição, versão, volume, adaptação, condensação ou qualificador equivalente comprovado |
| `book.edition.year` | não | inteiro | `1..9999` | ano editorial explicitamente conhecido |

- `SIL-EDITION-001` `book.edition` DEVE existir mesmo sem informação e, nesse caso, ser exatamente `{}`.
- `SIL-EDITION-002` Campo interno desconhecido, valor `null`, string vazia, estimativa, ano de download, ano do arquivo ou data do filesystem DEVE ser rejeitado.
- `SIL-EDITION-003` `qualifier` NÃO DEVE duplicar o título sem acrescentar identidade editorial.
- `SIL-EDITION-004` Ausência de ano DEVE resultar em omissão de `year` dentro do objeto, nunca em `0`, `null`, intervalo ou estimativa.

#### 3.2.4 Idioma, categoria e tags

- `SIL-CLASS-001` `book.language` DEVE ser validado como BCP 47 e serializado em minúsculas, por exemplo `pt-br`, `en-us` ou `es`.
- `SIL-CLASS-002` Idioma DEVE ser obtido, em ordem: metadado estruturado coerente; conteúdo editorial predominante; revisão humana. Nome de arquivo ou domínio isolado NÃO constitui evidência suficiente.
- `SIL-CLASS-003` `book.primary_category` DEVE conter exatamente um slug do vocabulário configurado. Para o exemplo, o valor é `livros`.
- `SIL-CLASS-004` Categoria e tags NÃO DEVEM ser inferidas do nome do arquivo.
- `SIL-CLASS-005` Cada item de `book.tags` DEVE atender ao mesmo padrão de slug da categoria, ser único, estar ordenado deterministicamente e não repetir `primary_category`.
- `SIL-CLASS-006` Sem tag adicional comprovada, `book.tags` DEVE ser `[]`.

### 3.3 `short_token`

- `SIL-TOKEN-001` `short_token` DEVE existir, ser único, case-sensitive, estável e corresponder ao registro central.
- `SIL-TOKEN-002` Para categoria Livro ou Devocional, token preferencial DEVERIA ser a sigla reconhecida ou a sigla normalizada do título, ignorando artigos, ligações gramaticais e designadores de volume conforme `RCF-IF-FC-010`.
- `SIL-TOKEN-003` Colisão DEVE tentar, nesta ordem: artigo inicial original; `-<idioma ISO>`; token sequencial.
- `SIL-TOKEN-004` Token sequencial DEVE usar o alfabeto `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`, sem padding e sem dígito zero à esquerda, conforme a conversão Base64 normativa do RCF.
- `SIL-TOKEN-005` Token atribuído, reservado ou removido NÃO DEVE ser reutilizado.
- `SIL-TOKEN-006` Token proposto por Issue DEVE ser tratado como preferência; somente o índice central confirma sua atribuição.

### 3.4 Matrizes de hash

| Caminho | Obrigatória | Tipo | Valor possível |
| --- | --- | --- | --- |
| `sha1` | sim | string | exatamente 40 caracteres `[0-9a-f]` |
| `sha256` | sim | string | exatamente 64 caracteres `[0-9a-f]` |
| `sha512` | sim | string | exatamente 128 caracteres `[0-9a-f]` |

- `SIL-HASH-001` As três propriedades DEVEM coexistir; valor parcial DEVE ser rejeitado.
- `SIL-HASH-002` Hash DEVE ser calculado sobre bytes, em fluxo binário, do primeiro ao último byte, sem conversão de texto, normalização, descompressão implícita ou mudança de fim de linha.
- `SIL-HASH-003` SHA-1 existe somente para interoperabilidade. Integridade e equivalência NÃO DEVEM depender isoladamente dele.
- `SIL-HASH-004` Implementação DEVERIA calcular os três algoritmos na mesma passagem de leitura e conferir tamanho antes e depois.
- `SIL-HASH-005` Hash informado pela Issue DEVE ser comparado em tempo constante quando a biblioteca oferecer esse recurso, mas a própria aquisição independente continua obrigatória.

### 3.5 `global_hashes`

| Caminho | Obrigatória | Tipo | Valor possível |
| --- | --- | --- | --- |
| `global_hashes[].artifact_id` | sim | string | `source-pdf` ou `source-epub` |
| `global_hashes[].format` | sim | string | `pdf` ou `epub` |
| `global_hashes[].sha1` | sim | string | matriz de hash |
| `global_hashes[].sha256` | sim | string | matriz de hash |
| `global_hashes[].sha512` | sim | string | matriz de hash |

- `SIL-GLOBAL-001` Cada item DEVE representar exclusivamente os bytes crus de um PDF ou EPUB editorial, fora de ZIP, 7Z ou outro invólucro.
- `SIL-GLOBAL-002` Cada formato aceito DEVE possuir exatamente um item e seu `artifact_id` DEVE ser `source-<format>`.
- `SIL-GLOBAL-003` PDF e EPUB da mesma obra DEVEM possuir matrizes próprias, mesmo quando o conteúdo textual for equivalente.
- `SIL-GLOBAL-004` Capa, QR Code, `.7z`, ZIP e pacote agregado NÃO DEVEM aparecer em `global_hashes`.
- `SIL-GLOBAL-005` A ordem canônica DEVE ser `pdf`, depois `epub`, quando ambos existirem.

### 3.6 `assets`

| Caminho | Obrigatória | Tipo | Valor possível | Valor vazio |
| --- | --- | --- | --- | --- |
| `assets[].id` | sim | string | `source-pdf`, `source-epub`, `cover`, `short-url-qr` ou `package` | proibido |
| `assets[].format` | sim | string | conforme matriz por ID | proibido |
| `assets[].url` | sim | string | caminho local `./<nome>` | proibido |
| `assets[].size` | sim | inteiro | `1..9007199254740991` | proibido |
| `assets[].source_hashes` | sim | objeto | matriz completa | proibido |
| `assets[].origin_url` | sim | string ou `null` | URI HTTP(S) absoluta ou `null` | `null` |

| `id` | `format` obrigatório | `url` obrigatório | `origin_url` |
| --- | --- | --- | --- |
| `source-pdf` | `7z` | `./source-pdf.7z` | URL do PDF original ou `null` se a proveniência local estiver registrada |
| `source-epub` | `7z` | `./source-epub.7z` | URL do EPUB original ou `null` se a proveniência local estiver registrada |
| `cover` | `png` | `./cover.png` | `null` |
| `short-url-qr` | `svg` | `./short-url.svg` ou nome central configurado | URL HTTPS curta absoluta |
| `package` | `7z` | `./package.7z` ou nome central configurado | `null` |

- `SIL-ASSET-001` `assets` DEVE conter `cover`, `short-url-qr` e um contêiner para cada item de `global_hashes`; `package` é o único item facultativo no perfil corrente.
- `SIL-ASSET-002` `assets[].source_hashes` DEVE ser calculado sobre os bytes exatos do asset servido, nunca sobre o conteúdo descompactado.
- `SIL-ASSET-003` `assets[].size` DEVE ser o tamanho em bytes do mesmo arquivo usado para `source_hashes`.
- `SIL-ASSET-004` Cada contêiner de formato DEVE conter exatamente um arquivo chamado `source.pdf` ou `source.epub`, byte a byte correspondente ao Hash Global.
- `SIL-ASSET-005` Contêiner DEVE usar 7Z, LZMA2 e nível máximo disponível, ter teste de integridade bem-sucedido e não conter path absoluto, traversal, symlink, temporário, cache, credencial ou segundo Livro.
- `SIL-ASSET-006` `cover.png` DEVE resultar da capa EPUB; sem capa EPUB utilizável, da primeira página PDF adequada. O resultado DEVE ter no máximo 800 px em cada dimensão, preservar proporção e legibilidade e remover metadado desnecessário.
- `SIL-ASSET-007` QR Code DEVE codificar exatamente `https://<dominio-curto>/<short_token>` e ser regenerado quando domínio, token ou parâmetro central mudar.
- `SIL-ASSET-008` `assets[].url` DEVE ser relativo ao diretório do Livro, sem segmento vazio, `.` adicional, `..`, barra invertida, query, fragmento ou codificação ambígua.
- `SIL-ASSET-009` Asset proposto por Issue NÃO DEVE ser considerado existente até ser materializado e recalculado pelo pipeline.

### 3.7 `sources`

| Caminho | Obrigatória | Tipo | Valor possível | Valor vazio |
| --- | --- | --- | --- | --- |
| `sources[].id` | sim | string | `[a-z0-9]+(?:-[a-z0-9]+)*` único | proibido |
| `sources[].title` | sim | string | hostname armazenador normalizado | proibido |
| `sources[].url` | sim | string | URI HTTP(S) absoluta integral | proibido |
| `sources[].type` | sim | string | token `[a-z][a-z0-9-]*`; no perfil preservado, `preserved-asset` | proibido |
| `sources[].format` | sim | string | `pdf` ou `epub` | proibido |
| `sources[].provider` | sim | string | identificador ou hostname não vazio do provedor editorial | proibido |
| `sources[].asset_id` | sim | string ou `null` | ID de asset existente ou `null` | `null` |
| `sources[].hashes` | sim | objeto ou `null` | matriz completa dos bytes entregues pela URL ou `null` | `null` |

- `SIL-SOURCE-001` `sources[].url` DEVE preservar integralmente a URL HTTP(S) consultada. Caminho local do pacote publicado pertence exclusivamente a `assets[].url`.
- `SIL-SOURCE-002` `sources[].title` DEVE identificar a fonte armazenadora, normalmente o hostname final permitido, sem repetir título do Livro.
- `SIL-SOURCE-003` `sources[].provider` DEVE identificar quem gerou, produziu ou publicou originalmente o artefato. Fonte e Provedor PODEM coincidir.
- `SIL-SOURCE-004` `sources[].format` DEVE identificar o formato editorial PDF/EPUB comprovado, mesmo quando a URL entregue usar ZIP ou 7Z.
- `SIL-SOURCE-005` `sources[].hashes` DEVE representar os bytes efetivamente entregues por `sources[].url`. Se a URL entregar o PDF/EPUB cru, a matriz DEVE coincidir com o Hash Global correspondente; se entregar contêiner, a matriz DEVE representar o contêiner e a equivalência DEVE ser provada após extração segura.
- `SIL-SOURCE-006` Fonte não obtida ou sem hash comparável DEVE usar `hashes: null`; zero, string vazia ou matriz parcial são proibidos.
- `SIL-SOURCE-007` `asset_id` DEVE referenciar o contêiner local que preserva o conteúdo equivalente. Sem asset preservado, DEVE ser `null`.
- `SIL-SOURCE-008` Para cada `asset_id` não nulo, o asset referido DEVE existir e preservar o mesmo formato editorial indicado.
- `SIL-SOURCE-009` `type: "preserved-asset"` DEVE ser usado quando o conteúdo da fonte foi aceito e preservado em asset local. Outro tipo somente DEVE ser usado quando a natureza estiver definida pelo RCF aplicável e comprovada.
- `SIL-SOURCE-010` Ordem canônica DEVE ser formato (`pdf`, `epub`), depois `title`, depois `id`, todos por comparação Unicode determinística.
- `SIL-SOURCE-011` Redirect DEVE ser seguido somente sob política de host confiável; a URL original e a URL final DEVEM permanecer na evidência de processamento, embora somente a URL canônica definida pelo RCF integre o campo.
- `SIL-SOURCE-012` URL com credencial embutida, host privado, loopback, link-local, esquema diferente de HTTP(S), path traversal ou redirect para host não permitido DEVE ser rejeitada.

## 4. Relações obrigatórias entre propriedades

- `SIL-REL-001` Para cada `global_hashes[].artifact_id`, DEVE existir exatamente um `assets[].id` igual.
- `SIL-REL-002` Para `global_hashes[].format = F`, o asset correlato DEVE ter `id = "source-" + F`, `format = "7z"` e `url = "./source-" + F + ".7z"`.
- `SIL-REL-003` Cada asset `source-pdf` ou `source-epub` DEVE ser referenciado por ao menos uma fonte do mesmo formato.
- `SIL-REL-004` `sources[].asset_id` não nulo DEVE referenciar exatamente um asset; ID inexistente ou ambíguo DEVE falhar.
- `SIL-REL-005` `book.id`, `short_token`, `assets[].id`, `sources[].id`, rota canônica e URL curta DEVEM ser únicos no acervo.
- `SIL-REL-006` `cover` e `short-url-qr` DEVEM existir uma única vez.
- `SIL-REL-007` `short-url-qr.origin_url` DEVE terminar no `short_token` percent-encoded sem mudar sua caixa.
- `SIL-REL-008` Quando `assets[source-F].origin_url` e `sources[format=F].url` representam a mesma aquisição original, os valores DEVEM ser idênticos.
- `SIL-REL-009` Hash do `.7z` em `assets[].source_hashes` NÃO DEVE ser copiado para `global_hashes`.
- `SIL-REL-010` Hash do PDF/EPUB cru em `global_hashes` NÃO DEVE ser copiado para a fonte se a URL entregar bytes de um contêiner diferente.
- `SIL-REL-011` PDF e EPUB somente DEVEM integrar o mesmo Livro quando manifesto comum ou identidade editorial e impressão textual normalizada comprovarem a mesma obra, idioma e edição.
- `SIL-REL-012` Dado inferível deterministicamente em build NÃO DEVE gerar propriedade adicional.

## 5. Aquisição e extração de evidência

### 5.1 Sequência normativa geral

1. `SIL-SEQ-001` Preservar corpo original da Issue e classificar JSON ou YAML sem executar conteúdo.
2. `SIL-SEQ-002` Validar limite de bytes, profundidade, quantidade de itens, chaves, tipos e duplicatas antes de acessar URL.
3. `SIL-SEQ-003` Normalizar somente para comparação; preservar título, nomes e URLs originais como evidência.
4. `SIL-SEQ-004` Validar URL, DNS, IP resolvido, redirect, hostname permitido, tamanho declarado e tipo de mídia.
5. `SIL-SEQ-005` Baixar para arquivo temporário exclusivo por streaming, com timeout, limite máximo e escrita atômica; não carregar arquivo grande integralmente em memória.
6. `SIL-SEQ-006` Calcular SHA-1, SHA-256 e SHA-512 sobre os bytes recebidos e registrar tamanho.
7. `SIL-SEQ-007` Identificar o formato por assinatura e estrutura, não somente por extensão ou `Content-Type`.
8. `SIL-SEQ-008` Extrair metadados estruturados, texto inicial, página de rosto, colofão, idioma, edição e capa por analisador próprio do formato.
9. `SIL-SEQ-009` Comparar evidências independentes; conflito material, arquivo cifrado inacessível, parser inseguro ou baixa confiança DEVE criar checkpoint e revisão humana.
10. `SIL-SEQ-010` Associar PDF e EPUB somente após comprovar identidade editorial; calcular impressão textual normalizada separada dos hashes de bytes.
11. `SIL-SEQ-011` Definir categoria, tags, ID e token somente após a identidade editorial.
12. `SIL-SEQ-012` Gerar contêineres, capa e QR; testar integridade; recalcular tamanho e Hash da Fonte de cada asset final.
13. `SIL-SEQ-013` Montar o modelo comum, validar todas as relações e somente então serializar JSON ou YAML.
14. `SIL-SEQ-014` Revalidar a serialização por parse independente e comparação profunda com o modelo comum.
15. `SIL-SEQ-015` Emitir diagnóstico por propriedade e manter a Issue como sugestão; publicação continua proibida até o fluxo editorial normal.

### 5.2 EPUB

- `SIL-EPUB-001` EPUB DEVE ser tratado como contêiner ZIP OCF não confiável.
- `SIL-EPUB-002` Antes da extração, DEVE limitar tamanho comprimido, tamanho expandido, razão de expansão, quantidade de entradas, profundidade e comprimento de path; path absoluto, `..`, symlink e colisão normalizada DEVEM ser rejeitados.
- `SIL-EPUB-003` O arquivo `mimetype`, `META-INF/container.xml`, cada `rootfile` e o Package Document OPF DEVEM ser analisados com parser ZIP/XML seguro, namespaces habilitados e entidades externas desabilitadas.
- `SIL-EPUB-004` Ordem de evidência para título, idioma e colaboradores DEVE ser: Package Document (`dc:title`, `dc:language`, `dc:creator` e refinamentos); página de rosto/colofão na ordem do `spine`; demais páginas iniciais. Identificador e `dcterms:modified` PODEM reforçar identidade, mas NÃO substituem título e autoria.
- `SIL-EPUB-005` A ordem de leitura DEVE seguir o `spine`; ordem física das entradas ZIP ou do `manifest` NÃO DEVE ser usada como ordem editorial.
- `SIL-EPUB-006` Capa DEVE usar primeiro o item com propriedade `cover-image`; fallback legado somente DEVE ser aceito quando sua referência for válida. Imagem arbitrária de maior dimensão NÃO DEVE ser presumida como capa.
- `SIL-EPUB-007` Impressão textual DEVE extrair texto dos documentos de conteúdo na ordem do `spine`, excluir script, style, navegação repetitiva e conteúdo não linear não editorial, normalizar Unicode e espaços somente em cópia derivada.
- `SIL-EPUB-008` Arquivo EPUB original NÃO DEVE ser reempacotado, corrigido ou normalizado antes do Hash Global.

### 5.3 PDF

- `SIL-PDF-001` PDF DEVE ser analisado por biblioteca que interprete objetos, xref, streams, fontes, páginas e metadados; regex sobre bytes crus NÃO DEVE ser usada para extrair título, autoria ou texto.
- `SIL-PDF-002` Ordem de evidência DEVE ser: página de rosto e colofão visíveis; XMP e Document Information coerentes; primeiras páginas textuais; OCR revisável quando não houver camada textual suficiente.
- `SIL-PDF-003` Metadado PDF isolado, nome de arquivo, nome da aba, data do filesystem ou primeira linha extraída NÃO DEVE ser aceito como prova única.
- `SIL-PDF-004` Extração de texto DEVE preservar número e ordem das páginas e registrar método. Layout complexo, texto fora de ordem, fonte sem mapeamento, página vazia ou quantidade anormalmente baixa DEVE reduzir confiança.
- `SIL-PDF-005` OCR somente DEVE ocorrer sobre renderização controlada quando o PDF for imagem ou a camada textual for insuficiente. Original e OCR DEVEM permanecer separados; OCR NÃO DEVE alterar os bytes usados no hash.
- `SIL-PDF-006` PDF cifrado sem autorização de leitura, corrompido, com limite excedido ou que exija execução externa insegura DEVE falhar com diagnóstico.
- `SIL-PDF-007` Capa PDF somente DEVE ser usada quando não houver capa EPUB utilizável; a primeira página adequada DEVE ser renderizada, recortada sem perda editorial e reduzida para o limite do RCF.
- `SIL-PDF-008` PDF original NÃO DEVE ser linearizado, salvo novamente, descomprimido, reparado ou normalizado antes do Hash Global.

### 5.4 Precedência editorial e confiança

| Propriedade | Evidência primária | Evidência secundária | Falha obrigatória |
| --- | --- | --- | --- |
| `book.title` | página de rosto/colofão e OPF coerentes | XMP, Document Info, cabeçalhos iniciais | títulos materiais conflitantes |
| `contributors` | crédito editorial visível e OPF coerentes | XMP/Document Info | autor ausente, inventado ou conflito sem resolução |
| `edition` | página de rosto, verso, colofão | OPF/XMP | estimativa ou mistura de edições |
| `language` | OPF coerente e conteúdo predominante | detector linguístico como indício | idioma materialmente ambíguo |
| `primary_category` | vocabulário editorial e decisão humana | contexto da Issue | inferência por filename |
| `tags` | vocabulário editorial e decisão humana | assunto comprovado | tag inventada ou duplicada |
| `origin_url`/`sources.url` | URL de aquisição validada | manifesto lateral confiável | URL insegura ou não rastreável |
| hashes/tamanho | bytes adquiridos ou gerados | valor declarado para comparação | cálculo ausente ou divergente |

- `SIL-EVID-001` Evidência primária coerente prevalece sobre metadado técnico.
- `SIL-EVID-002` Resultado heurístico ou detector automático DEVE ser registrado como indício, nunca como fato isolado.
- `SIL-EVID-003` Conflito material NÃO DEVE ser resolvido escolhendo o primeiro valor.
- `SIL-EVID-004` Toda decisão não mecânica DEVE conservar origem, método, valor candidato e justificativa no diagnóstico, sem criar propriedade adicional no payload.

## 6. Métodos recomendados por ambiente

### 6.1 Node.js

| Operação | Método recomendado | Parâmetros/regras |
| --- | --- | --- |
| download | `fetch`/cliente HTTP com stream + `pipeline` | timeout, limite incremental, redirects validados, arquivo temporário exclusivo |
| hashes | `node:crypto.createHash("sha1"|"sha256"|"sha512")` | alimentar os três hashes com os mesmos chunks; `digest("hex")` minúsculo |
| tamanho | contador de bytes do stream e `stat` final | ambos DEVEM coincidir |
| EPUB | leitor ZIP com limites + parser XML seguro | sem extração cega; entidades externas desabilitadas |
| PDF | PDF.js ou analisador PDF equivalente mantido | `getMetadata`, texto por página, render controlado para capa |
| YAML | parser em modo schema seguro/core | bloquear alias, tag, merge e duplicata; limitar profundidade |
| JSON | `JSON.parse` após verificação de duplicatas por parser apropriado | validar estrutura depois do parse |

- `SIL-NODE-001` `Buffer.toString()` NÃO DEVE participar do cálculo de hash binário.
- `SIL-NODE-002` `Promise.all` sem limite NÃO DEVE ser usado para aquisição em lote; concorrência DEVE ser finita.
- `SIL-NODE-003` Processo externo para 7Z DEVE receber argumentos como array, sem interpolação de shell, usar diretório temporário validado e verificar exit code, listagem e teste do pacote.

### 6.2 Python

| Operação | Método recomendado | Parâmetros/regras |
| --- | --- | --- |
| download | cliente HTTP com streaming | timeout de conexão/leitura, limite incremental, redirects validados |
| hashes | `hashlib.sha1`, `hashlib.sha256`, `hashlib.sha512` | `update()` com o mesmo bloco binário; `hexdigest()` |
| tamanho | contador de bytes e `Path.stat().st_size` | ambos DEVEM coincidir |
| EPUB | `zipfile` para inspeção limitada + XML seguro | validar cada nome antes de extrair; não usar `extractall` sem guarda |
| PDF | `pypdf` para metadado/texto e PyMuPDF ou equivalente para render | processar por página; OCR separado quando necessário |
| YAML | carregador seguro | proibir construtores, aliases expansivos, tags e duplicatas |
| JSON | `json.load` com detecção de pares duplicados | rejeitar constantes não finitas |

- `SIL-PY-001` Arquivo DEVE ser aberto em modo `rb` para hash e identificação.
- `SIL-PY-002` `zipfile.extractall()` NÃO DEVE ser chamado antes da validação de todos os paths, links e limites.
- `SIL-PY-003` Subprocesso 7Z DEVE usar lista de argumentos, `shell=False`, cwd temporário validado, timeout e verificação de retorno.

### 6.3 Neutralidade tecnológica

- `SIL-TECH-001` Biblioteca citada é método recomendado, não dependência normativa.
- `SIL-TECH-002` Substituição de biblioteca somente é conforme quando preserva limites, evidência, bytes, ordem, segurança e resultados.
- `SIL-TECH-003` Versão e configuração efetivamente usadas DEVEM integrar o relatório de processamento, não o payload schema 5.

## 7. Validação e estados de resultado

### 7.1 Ordem de validação

1. sintaxe segura do formato;
2. chaves exatas e presença obrigatória;
3. tipos, padrões, intervalos e cardinalidades;
4. unicidade e ordem determinística;
5. referências cruzadas;
6. URL, proveniência e segurança;
7. existência, tamanho e hashes dos bytes;
8. integridade e conteúdo dos contêineres;
9. evidência editorial;
10. equivalência PDF/EPUB;
11. colisão de ID, rota e token;
12. serialização JSON/YAML equivalente;
13. revisão editorial e autorização externa à Issue.

### 7.2 Resultados permitidos

| Estado | Condição | Efeito |
| --- | --- | --- |
| `completa` | todas as regras satisfeitas | elegível para revisão editorial; não publica |
| `parcial` | itens independentes válidos e pendências isoláveis | preservar válidos e solicitar somente correções necessárias |
| `ambigua` | duas ou mais interpretações materiais | nenhuma associação automática |
| `requer-correcao` | campo obrigatório ausente/inválido ou evidência insuficiente | diagnóstico por caminho |
| `rejeitada-por-seguranca` | URL, payload, arquivo ou extração insegura | nenhuma aquisição/aplicação adicional |
| `duplicada` | mesma identidade e revisão já registradas | vincular ao registro existente |

- `SIL-VAL-001` Diagnóstico DEVE identificar caminho da propriedade, regra, valor recebido de forma sanitizada e correção esperada.
- `SIL-VAL-002` Segredo, credencial, header, token de acesso, path temporário e stack trace NÃO DEVEM aparecer no diagnóstico público.
- `SIL-VAL-003` Item seguro independente NÃO DEVE ser perdido porque outro item falhou.
- `SIL-VAL-004` Sugestão `completa` NÃO significa Livro aceito, FT autorizada ou publicação concluída.

## 8. Exemplos semanticamente equivalentes

### 8.1 JSON

```json
{
  "schema_version": 5,
  "book": {
    "id": "pt-br-livros-atos-dos-apostolos",
    "title": "Atos Dos Apóstolos",
    "contributors": [
      {
        "name": "Ellen G. White",
        "role": "author"
      }
    ],
    "edition": {},
    "language": "pt-br",
    "primary_category": "livros",
    "tags": []
  },
  "short_token": "aa",
  "global_hashes": [
    {
      "artifact_id": "source-pdf",
      "format": "pdf",
      "sha1": "ef605032eb4011e6f058c100dc845f414e36e4f4",
      "sha256": "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a",
      "sha512": "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
    },
    {
      "artifact_id": "source-epub",
      "format": "epub",
      "sha1": "6df74abc8e2d57f82ff54a3b373d855c016f9f15",
      "sha256": "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29",
      "sha512": "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
    }
  ],
  "assets": [
    {
      "id": "source-pdf",
      "format": "7z",
      "url": "./source-pdf.7z",
      "size": 1245591,
      "source_hashes": {
        "sha1": "dca6d789019694b1340f7bace1c7b7878a1d1fec",
        "sha256": "50854ed458c4ee55f20177e8905718133d40ff59fccde7c6750afa12bc1c549e",
        "sha512": "e4ac22c5e0d323124f32e3bdebf94140d01ce025e7a5e2d4093047340c5f3f64f27cd1eb0cb3cb724288fe9a50bbaec2e1aeef21c23714079ea25f353770ad2d"
      },
      "origin_url": "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf"
    },
    {
      "id": "source-epub",
      "format": "7z",
      "url": "./source-epub.7z",
      "size": 755774,
      "source_hashes": {
        "sha1": "a0d51510cb2e3cb71390c658510aa3ea3c900c6c",
        "sha256": "924202c8f6706a2696c1882d1b7065184d12a9e4faf676b9523eeb3a871e1425",
        "sha512": "7f14eb7016233365e74517a804f6be74507239a444cbb56f25f75e5fee7043f048f1bd00af79c02c022735a2d269098044896fab84fab4397a4e2102e1f77ef3"
      },
      "origin_url": "https://media2.egwwritings.org/epub/pt_AA(AA).epub"
    },
    {
      "id": "cover",
      "format": "png",
      "url": "./cover.png",
      "size": 559523,
      "source_hashes": {
        "sha1": "417ddc2270c2b4adb412c6278937b75c81eec814",
        "sha256": "d2fd3abe8f9af2f303c31d397dfa1de88b81387f5388cdc96a0e502f58160b81",
        "sha512": "667df43e8c5aae67e8f5dd9bac7719f1a632cd2e15f81f73c2f7b87cc747973a0b5d310439b72549128ba8e41cbd3f7bdb9c22aa75b30b46998768126d9a3a80"
      },
      "origin_url": null
    },
    {
      "id": "short-url-qr",
      "format": "svg",
      "url": "./short-url.svg",
      "size": 1587,
      "source_hashes": {
        "sha1": "2a48830f91df4d504fd2a87988bcf25a018a03f0",
        "sha256": "70ef4acab1db5baf7a068d506db7ee6249cead355fcdee08a17dbc814c788450",
        "sha512": "a4d47ee0b02164f3d4a8560d89b8414fa9db92263d4e265ac740590654355511a20dcd1b2d583d7a4c6635375a462cb73d5b6dbece6024e4b671195fe72b0c11"
      },
      "origin_url": "https://f.jcem.pro/aa"
    }
  ],
  "sources": [
    {
      "id": "pdf",
      "title": "media2.egwwritings.org",
      "url": "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf",
      "type": "preserved-asset",
      "format": "pdf",
      "provider": "media2.egwwritings.org",
      "asset_id": "source-pdf",
      "hashes": {
        "sha1": "ef605032eb4011e6f058c100dc845f414e36e4f4",
        "sha256": "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a",
        "sha512": "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
      }
    },
    {
      "id": "epub",
      "title": "media2.egwwritings.org",
      "url": "https://media2.egwwritings.org/epub/pt_AA(AA).epub",
      "type": "preserved-asset",
      "format": "epub",
      "provider": "media2.egwwritings.org",
      "asset_id": "source-epub",
      "hashes": {
        "sha1": "6df74abc8e2d57f82ff54a3b373d855c016f9f15",
        "sha256": "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29",
        "sha512": "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
      }
    }
  ]
}
```

### 8.2 YAML

```yaml
schema_version: 5
book:
  id: "pt-br-livros-atos-dos-apostolos"
  title: "Atos Dos Apóstolos"
  contributors:
    - name: "Ellen G. White"
      role: "author"
  edition: {}
  language: "pt-br"
  primary_category: "livros"
  tags: []
short_token: "aa"
global_hashes:
  - artifact_id: "source-pdf"
    format: "pdf"
    sha1: "ef605032eb4011e6f058c100dc845f414e36e4f4"
    sha256: "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a"
    sha512: "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
  - artifact_id: "source-epub"
    format: "epub"
    sha1: "6df74abc8e2d57f82ff54a3b373d855c016f9f15"
    sha256: "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29"
    sha512: "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
assets:
  - id: "source-pdf"
    format: "7z"
    url: "./source-pdf.7z"
    size: 1245591
    source_hashes:
      sha1: "dca6d789019694b1340f7bace1c7b7878a1d1fec"
      sha256: "50854ed458c4ee55f20177e8905718133d40ff59fccde7c6750afa12bc1c549e"
      sha512: "e4ac22c5e0d323124f32e3bdebf94140d01ce025e7a5e2d4093047340c5f3f64f27cd1eb0cb3cb724288fe9a50bbaec2e1aeef21c23714079ea25f353770ad2d"
    origin_url: "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf"
  - id: "source-epub"
    format: "7z"
    url: "./source-epub.7z"
    size: 755774
    source_hashes:
      sha1: "a0d51510cb2e3cb71390c658510aa3ea3c900c6c"
      sha256: "924202c8f6706a2696c1882d1b7065184d12a9e4faf676b9523eeb3a871e1425"
      sha512: "7f14eb7016233365e74517a804f6be74507239a444cbb56f25f75e5fee7043f048f1bd00af79c02c022735a2d269098044896fab84fab4397a4e2102e1f77ef3"
    origin_url: "https://media2.egwwritings.org/epub/pt_AA(AA).epub"
  - id: "cover"
    format: "png"
    url: "./cover.png"
    size: 559523
    source_hashes:
      sha1: "417ddc2270c2b4adb412c6278937b75c81eec814"
      sha256: "d2fd3abe8f9af2f303c31d397dfa1de88b81387f5388cdc96a0e502f58160b81"
      sha512: "667df43e8c5aae67e8f5dd9bac7719f1a632cd2e15f81f73c2f7b87cc747973a0b5d310439b72549128ba8e41cbd3f7bdb9c22aa75b30b46998768126d9a3a80"
    origin_url: null
  - id: "short-url-qr"
    format: "svg"
    url: "./short-url.svg"
    size: 1587
    source_hashes:
      sha1: "2a48830f91df4d504fd2a87988bcf25a018a03f0"
      sha256: "70ef4acab1db5baf7a068d506db7ee6249cead355fcdee08a17dbc814c788450"
      sha512: "a4d47ee0b02164f3d4a8560d89b8414fa9db92263d4e265ac740590654355511a20dcd1b2d583d7a4c6635375a462cb73d5b6dbece6024e4b671195fe72b0c11"
    origin_url: "https://f.jcem.pro/aa"
sources:
  - id: "pdf"
    title: "media2.egwwritings.org"
    url: "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf"
    type: "preserved-asset"
    format: "pdf"
    provider: "media2.egwwritings.org"
    asset_id: "source-pdf"
    hashes:
      sha1: "ef605032eb4011e6f058c100dc845f414e36e4f4"
      sha256: "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a"
      sha512: "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
  - id: "epub"
    title: "media2.egwwritings.org"
    url: "https://media2.egwwritings.org/epub/pt_AA(AA).epub"
    type: "preserved-asset"
    format: "epub"
    provider: "media2.egwwritings.org"
    asset_id: "source-epub"
    hashes:
      sha1: "6df74abc8e2d57f82ff54a3b373d855c016f9f15"
      sha256: "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29"
      sha512: "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
```

- `SIL-EX-001` Os dois exemplos DEVEM produzir estruturas profundamente iguais após parse.
- `SIL-EX-002` Os exemplos corrigem `sources.url`, `sources.title` e `sources.hashes` para cumprir o RCF: a fonte usa a URL remota e hashes dos bytes remotos; o `.7z` local permanece em `assets`.

## 9. Referências normativas e técnicas

- `SIL-REF-001` RCF local: [`../RCF.md`](../RCF.md), especialmente `RCF-IF-DATA-006..025`, `RCF-IF-HASH-001..007`, `RCF-IF-FC-009..012`, `RCF-IF-WF-007..019` e `RCF-IF-ISSUE-001..020`.
- `SIL-REF-002` JSON: [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259).
- `SIL-REF-003` YAML: [YAML 1.2.2](https://yaml.org/spec/1.2.2/).
- `SIL-REF-004` Idiomas: [BCP 47 / RFC 5646](https://www.rfc-editor.org/rfc/rfc5646) e [IANA Language Subtag Registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry).
- `SIL-REF-005` EPUB: [EPUB 3.3](https://www.w3.org/TR/epub-33/), inclusive OCF, Package Document, metadados, manifest e spine.
- `SIL-REF-006` Hash em Node.js: [`node:crypto`](https://nodejs.org/api/crypto.html).
- `SIL-REF-007` PDF em Node.js: [PDF.js API](https://mozilla.github.io/pdf.js/api/).
- `SIL-REF-008` Hash em Python: [`hashlib`](https://docs.python.org/3/library/hashlib.html).
- `SIL-REF-009` EPUB/ZIP em Python: [`zipfile`](https://docs.python.org/3/library/zipfile.html).
- `SIL-REF-010` PDF em Python: [pypdf — extração de texto](https://pypdf.readthedocs.io/en/latest/user/extract-text.html) e [PyMuPDF — documentação](https://pymupdf.readthedocs.io/en/latest/).

## 10. Identidade legal

- `SIL-LEGAL-001` Toda publicação desta norma DEVE conservar o seguinte disclaimer: não existe vínculo com editoras; o projeto não responde pelo conteúdo de terceiros; fontes externas podem ficar indisponíveis; atribuição, licença, proveniência e resultado de integridade permanecem obrigatórios.
