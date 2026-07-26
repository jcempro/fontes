# NORMA-IF-SIL-001 — Dados Formativos para Sugestão de Livro

## 1. Autoridade e escopo fechado

- `SIL-001` Esta norma DEVE ser subordinada ao `RCF-IF-001` e reger exclusivamente as propriedades `book`, `urls` e `global_hashes`, com suas propriedades descendentes expressamente definidas neste documento.
- `SIL-002` A estrutura DEVE ser semanticamente idêntica em JSON e YAML.
- `SIL-003` O objeto raiz DEVE conter exatamente `book`, `urls` e `global_hashes`.
- `SIL-004` `book` DEVE conter exatamente `title`, `contributors`, `edition`, `language`, `primary_category` e `tags`.
- `SIL-005` Cada item de `book.contributors` DEVE conter exatamente `name` e `role`.
- `SIL-006` `book.edition` DEVE ser exatamente o objeto vazio `{}` neste perfil restrito.
- `SIL-007` Cada item de `global_hashes` DEVE conter exatamente `format`, `sha1`, `sha256` e `sha512`.
- `SIL-007A` Cada item de `urls` DEVE conter exatamente `format` e `url`.
- `SIL-008` Propriedade não enumerada em `SIL-003..007A` NÃO DEVE constar desta norma nem de documento conforme a ela.
- `SIL-009` Todas as propriedades enumeradas são estruturalmente obrigatórias. Somente `book.edition` e `book.tags` admitem os valores vazios definidos nesta norma.
- `SIL-010` Informação declarada ou extraída DEVE ser tratada como candidata até validação por evidência reprodutível. Dado incerto, conflitante ou inventado NÃO DEVE preencher propriedade.
- `SIL-011` Documento conforme a esta norma constitui perfil parcial e formativo de sugestão. Ele NÃO DEVE ser interpretado como metadado canônico integral nem substituir o contrato completo regido pelo RCF.

## 2. Agnosticismo entre JSON e YAML

| Semântica | JSON | YAML | Regra |
| --- | --- | --- | --- |
| objeto | object | mapping | chaves textuais únicas e sensíveis a caixa |
| lista ordenada | array | sequence | ordem preservada |
| texto | string | string scalar | Unicode válido |
| objeto vazio | `{}` | `{}` | permitido somente em `book.edition` |
| lista vazia | `[]` | `[]` | permitida somente em `book.tags` |

- `SIL-FMT-001` A representação DEVE possuir um único documento e um único objeto raiz.
- `SIL-FMT-002` Chaves, hierarquia, tipos, valores, Unicode e ordem das listas DEVEM permanecer iguais após conversão JSON ↔ YAML.
- `SIL-FMT-003` JSON DEVE ser UTF-8 válido, sem BOM, comentário, vírgula final, chave duplicada ou valor numérico não finito.
- `SIL-FMT-004` YAML DEVE usar o subconjunto seguro de YAML 1.2 composto por mapping, sequence e string. Âncora, alias, merge key, tag explícita, construtor, diretiva e múltiplos documentos DEVEM ser rejeitados.
- `SIL-FMT-005` Em YAML, toda string DEVERIA usar aspas para impedir resolução implícita e preservar caixa, pontuação e zeros.
- `SIL-FMT-006` `null`, chave omitida, string vazia e lista ou objeto vazio fora dos dois casos autorizados DEVEM ser rejeitados.
- `SIL-FMT-007` A ordem recomendada das chaves DEVE seguir os exemplos; consumidor NÃO DEVE depender da ordem de chaves.

## 3. Matriz integral de propriedades

### 3.1 Raiz

| Propriedade | Obrigatória | Tipo | Cardinalidade | Valor vazio |
| --- | --- | --- | --- | --- |
| `book` | sim | objeto | exatamente 6 propriedades | proibido |
| `urls` | sim | lista | 1 ou mais itens | proibido |
| `global_hashes` | sim | lista | 1 ou 2 itens | proibido |

### 3.2 `book`

| Propriedade | Obrigatória | Tipo | Domínio | Valor vazio |
| --- | --- | --- | --- | --- |
| `book.title` | sim | string | título editorial Unicode não vazio | proibido |
| `book.contributors` | sim | lista | 1 ou mais contribuidores | proibido |
| `book.edition` | sim | objeto | exclusivamente `{}` | `{}` obrigatório |
| `book.language` | sim | string | etiqueta BCP 47 válida em minúsculas | proibido |
| `book.primary_category` | sim | string | slug `[a-z0-9]+(?:-[a-z0-9]+)*` | proibido |
| `book.tags` | sim | lista | zero ou mais slugs únicos | `[]` permitido |

### 3.3 `book.contributors[]`

| Propriedade | Obrigatória | Tipo | Domínio | Valor vazio |
| --- | --- | --- | --- | --- |
| `book.contributors[].name` | sim | string | nome editorial Unicode não vazio | proibido |
| `book.contributors[].role` | sim | string | token `[a-z][a-z0-9-]*` | proibido |

### 3.4 `global_hashes[]`

| Propriedade | Obrigatória | Tipo | Domínio | Valor vazio |
| --- | --- | --- | --- | --- |
| `global_hashes[].format` | sim | string | exclusivamente `pdf` ou `epub` | proibido |
| `global_hashes[].sha1` | sim | string | 40 caracteres `[0-9a-f]` | proibido |
| `global_hashes[].sha256` | sim | string | 64 caracteres `[0-9a-f]` | proibido |
| `global_hashes[].sha512` | sim | string | 128 caracteres `[0-9a-f]` | proibido |

### 3.5 `urls[]`

| Propriedade | Obrigatória | Tipo | Domínio | Valor vazio |
| --- | --- | --- | --- | --- |
| `urls[].format` | sim | string | exclusivamente `pdf` ou `epub` | proibido |
| `urls[].url` | sim | string | URI HTTP(S) absoluta e normalizada | proibido |

## 4. Regras de obtenção de `book`

### 4.1 Sequência comum de evidência

1. Preservar o arquivo original sem conversão, reparo, reempacotamento ou normalização.
2. Identificar o formato pela assinatura e pela estrutura interna, não somente por extensão ou tipo declarado.
3. Extrair metadado estruturado por analisador próprio do formato.
4. Extrair página de rosto, verso da página de rosto, colofão e primeiras unidades textuais na ordem editorial.
5. Normalizar somente uma cópia de comparação: Unicode, espaços e caixa. O valor editorial original permanece preservado.
6. Comparar ao menos duas evidências independentes para título, autoria e idioma quando ambas estiverem disponíveis.
7. Interromper diante de conflito material, ausência de autoria, baixa confiança ou arquivo ilegível.
8. Definir categoria e tags somente por vocabulário controlado e evidência editorial.
9. Montar `book` somente após validar todas as suas propriedades.

### 4.2 `book.title`

- `SIL-TITLE-001` `book.title` DEVE representar o título editorial principal da obra na edição analisada.
- `SIL-TITLE-002` A precedência DEVE ser: página de rosto ou colofão visível; título estruturado do EPUB coerente; metadado estruturado do PDF coerente; cabeçalho editorial recorrente.
- `SIL-TITLE-003` Nome de arquivo, nome de diretório, endereço de aquisição, texto de capa isolado, primeira linha extraída ou resultado de OCR isolado NÃO DEVE constituir prova suficiente.
- `SIL-TITLE-004` Capitalização, diacríticos, pontuação e grafia editorial DEVEM ser preservados.
- `SIL-TITLE-005` Espaço inicial ou final, controle Unicode e repetição acidental de espaços DEVEM ser removidos sem alterar o conteúdo lexical.
- `SIL-TITLE-006` Dois títulos materialmente distintos DEVEM produzir diagnóstico e revisão humana, nunca escolha automática do primeiro.

### 4.3 `book.contributors`

- `SIL-CONTRIB-001` `book.contributors` DEVE conter ao menos um item com `role: "author"`.
- `SIL-CONTRIB-002` O primeiro item com `role: "author"` DEVE representar o autor principal.
- `SIL-CONTRIB-003` A ordem dos itens DEVE seguir a ordem de crédito da edição.
- `SIL-CONTRIB-004` Duplicata exata de `name + role` DEVE ser removida; homônimos NÃO DEVEM ser fundidos sem evidência.
- `SIL-CONTRIB-005` Papéis recomendados, quando comprovados, são `author`, `editor`, `translator`, `compiler` e `illustrator`.
- `SIL-CONTRIB-006` Outro valor de `role` somente DEVE ser aceito quando atender ao padrão e possuir significado editorial comprovado; ele NÃO adquire semântica inferida.
- `SIL-CONTRIB-007` Ausência, abreviação não comprovada, tradução de nome, conflito ou autoria inferida exclusivamente do nome do arquivo DEVE bloquear o documento.

#### 4.3.1 `book.contributors[].name`

- `SIL-NAME-001` `name` DEVE preservar a forma creditada na edição.
- `SIL-NAME-002` Prefixo, sufixo, inicial, diacrítico e ordem nominal NÃO DEVEM ser alterados sem autoridade editorial.
- `SIL-NAME-003` Comparação para duplicidade PODE normalizar Unicode, espaços e caixa em cópia derivada; o valor emitido DEVE conservar a forma editorial.

#### 4.3.2 `book.contributors[].role`

- `SIL-ROLE-001` `role` DEVE descrever a função editorial efetivamente creditada.
- `SIL-ROLE-002` A função NÃO DEVE ser inferida da posição do nome quando a fonte apresentar papel explícito.
- `SIL-ROLE-003` Pessoa citada, prefaciador, personagem, organização mantenedora ou proprietário do arquivo NÃO DEVE ser classificado como autor sem crédito editorial.

### 4.4 `book.edition`

- `SIL-EDITION-001` `book.edition` DEVE existir e ser exatamente `{}`.
- `SIL-EDITION-002` Nenhuma propriedade descendente DEVE ser acrescentada neste perfil.
- `SIL-EDITION-003` O objeto vazio NÃO DEVE significar que todas as edições são equivalentes; significa somente que este perfil restrito não representa detalhe de edição.
- `SIL-EDITION-004` Quando ano, número, revisão, volume, adaptação, condensação ou outro qualificador for necessário para distinguir a publicação, o documento NÃO DEVE ser emitido como conforme a este perfil até decisão normativa específica. A informação NÃO DEVE ser descartada nem projetada em outra propriedade.

### 4.5 `book.language`

- `SIL-LANG-001` `book.language` DEVE representar o idioma predominante da edição, não o idioma da interface, do site ou do operador.
- `SIL-LANG-002` O valor DEVE ser etiqueta BCP 47 válida e serializada em minúsculas, como `pt-br`, `en-us` ou `es`.
- `SIL-LANG-003` A precedência DEVE ser: idioma estruturado do EPUB coerente; declaração editorial visível; análise do conteúdo textual predominante; revisão humana.
- `SIL-LANG-004` Detector automático de idioma DEVE ser somente evidência auxiliar e operar sobre amostra distribuída, não sobre título ou primeira página isolados.
- `SIL-LANG-005` Nome de arquivo, domínio, país do fornecedor ou idioma de metadado técnico isolado NÃO DEVE definir o valor.
- `SIL-LANG-006` Edição materialmente multilíngue sem idioma predominante inequívoco DEVE ser encaminhada para decisão humana.

### 4.6 `book.primary_category`

- `SIL-CATEGORY-001` `book.primary_category` DEVE conter exatamente uma classificação principal do vocabulário controlado.
- `SIL-CATEGORY-002` O valor DEVE usar minúsculas ASCII, hífen como separador e nenhum diacrítico.
- `SIL-CATEGORY-003` Para o exemplo desta norma, o valor comprovado é `livros`.
- `SIL-CATEGORY-004` Categoria NÃO DEVE ser inferida do nome de arquivo.
- `SIL-CATEGORY-005` Quando duas categorias forem igualmente plausíveis, decisão editorial DEVE selecionar uma única categoria principal.

### 4.7 `book.tags`

- `SIL-TAGS-001` `book.tags` DEVE existir.
- `SIL-TAGS-002` Sem classificação adicional comprovada, o valor DEVE ser `[]`.
- `SIL-TAGS-003` Cada item DEVE seguir `[a-z0-9]+(?:-[a-z0-9]+)*`, ser semanticamente relevante e não repetir `book.primary_category`.
- `SIL-TAGS-004` Itens DEVEM ser únicos e ordenados por comparação lexical determinística.
- `SIL-TAGS-005` Termo inferido somente de nome de arquivo, fornecedor, formato, idioma ou detalhe técnico NÃO DEVE integrar a lista.

## 5. Regras de obtenção de `global_hashes`

### 5.1 Conceito e cardinalidade

- `SIL-GLOBAL-001` `global_hashes` DEVE conter exatamente um item para cada formato editorial original aceito.
- `SIL-GLOBAL-002` A lista DEVE possuir um item quando houver somente PDF ou somente EPUB e dois itens quando ambos existirem.
- `SIL-GLOBAL-003` `format` NÃO DEVE repetir-se na lista.
- `SIL-GLOBAL-004` Quando ambos existirem, a ordem canônica DEVE ser `pdf`, depois `epub`.
- `SIL-GLOBAL-005` PDF e EPUB da mesma edição DEVEM possuir matrizes próprias; equivalência textual NÃO implica igualdade de bytes.

### 5.2 Bytes normativos

- `SIL-BYTES-001` Cada matriz DEVE ser calculada exclusivamente sobre os bytes integrais do PDF ou EPUB original.
- `SIL-BYTES-002` Cálculo DEVE ocorrer antes de extração, conversão, correção, OCR, renderização, compactação ou qualquer alteração.
- `SIL-BYTES-003` Leitura DEVE ser binária, sequencial e completa, sem conversão de texto ou normalização de fim de linha.
- `SIL-BYTES-004` Arquivo reparado ou regravado constitui sequência de bytes diferente e NÃO DEVE herdar a matriz do original.
- `SIL-BYTES-005` Para EPUB, a matriz DEVE incidir sobre o contêiner EPUB integral, não sobre arquivos internos isolados.
- `SIL-BYTES-006` Para PDF, a matriz DEVE incidir sobre o arquivo PDF integral, incluindo todos os objetos, streams e atualizações incrementais presentes.

### 5.3 Algoritmos

- `SIL-HASH-001` `sha1`, `sha256` e `sha512` DEVEM ser calculados na mesma passagem sobre os mesmos chunks.
- `SIL-HASH-002` A saída DEVE ser hexadecimal minúscula, sem prefixo, espaço, hífen ou separador.
- `SIL-HASH-003` `sha1` DEVE possuir 40 caracteres, `sha256` 64 e `sha512` 128.
- `SIL-HASH-004` SHA-1 existe somente para interoperabilidade e NÃO DEVE, isoladamente, comprovar integridade.
- `SIL-HASH-005` Divergência em qualquer um dos três valores DEVE rejeitar a alegação de igualdade byte a byte.
- `SIL-HASH-006` Matriz parcial, algoritmo ausente, valor truncado, maiúsculo ou calculado sobre representação textual DEVE ser rejeitado.

### 5.4 Métodos recomendados

#### 5.4.1 Node.js

- Usar fluxo binário de `node:fs` e três instâncias de `node:crypto.createHash`, com algoritmos `sha1`, `sha256` e `sha512`.
- Alimentar as três instâncias com cada chunk recebido, sem converter o chunk para string.
- Finalizar cada instância com `digest("hex")`.
- Confirmar que a leitura terminou normalmente e que nenhum erro de stream foi ignorado.
- Para EPUB, usar leitor ZIP com limites para validar estrutura e extrair evidência de `book`, mas nunca para calcular `global_hashes`.
- Para PDF, usar PDF.js ou analisador equivalente para metadado e texto; análise NÃO DEVE modificar o arquivo usado nos hashes.

#### 5.4.2 Python

- Abrir o arquivo em modo `rb`.
- Usar simultaneamente `hashlib.sha1()`, `hashlib.sha256()` e `hashlib.sha512()`.
- Ler blocos de tamanho fixo, alimentar os três objetos com cada bloco e finalizar com `hexdigest()`.
- Confirmar leitura completa e propagar qualquer erro de entrada/saída.
- Para EPUB, usar `zipfile` somente após validar limites e caminhos; `extractall()` sem guarda NÃO DEVE ser usado.
- Para PDF, usar `pypdf`, PyMuPDF ou analisador equivalente para metadado, texto e renderização; OCR deve permanecer separado do original.

#### 5.4.3 Neutralidade

- Biblioteca citada é método recomendado, não dependência normativa.
- Implementação alternativa somente é conforme quando produz os mesmos valores a partir dos mesmos bytes e preserva as regras de segurança e evidência.
- Comando de shell cuja saída textual seja analisada NÃO DEVERIA substituir APIs criptográficas nativas quando estas estiverem disponíveis.

## 6. Regras de obtenção de `urls`

### 6.1 Conceito, estrutura e finalidade

- `SIL-URL-001` `urls` DEVE ser uma lista não vazia de endereços candidatos à aquisição das variantes editoriais que se pretende incorporar.
- `SIL-URL-002` Cada item DEVE vincular explicitamente uma única `url` ao respectivo `format`; formato NÃO DEVE ser inferido somente da extensão do endereço.
- `SIL-URL-003` `urls[].format` DEVE ser exatamente `pdf` ou `epub`, em minúsculas, e identificar o formato editorial esperado após obtenção ou extração segura.
- `SIL-URL-004` `urls[].url` DEVE ser URI HTTP(S) absoluta, sem credenciais, sem fragmento e com host explícito. Caminho e consulta DEVEM ser preservados integralmente.
- `SIL-URL-005` `urls` é dado formativo de entrada da Issue. A propriedade NÃO DEVE ser copiada para a raiz do `metadata.json` schema 5 nem interpretada como endereço local de asset.
- `SIL-URL-006` Após aquisição e validação, um processo editorial autorizado PODE usar cada item para formar a proveniência e a fonte canônica exigidas pelo RCF e para gerar o asset vinculativo correspondente. A sugestão ou a URL, isoladamente, NÃO autoriza download, incorporação nem publicação.

### 6.2 Cardinalidade e correlação

- `SIL-URL-LINK-001` Para cada formato presente em `global_hashes`, `urls` DEVE conter ao menos um item com o mesmo `format`.
- `SIL-URL-LINK-002` Todo formato presente em `urls` DEVE possuir exatamente um item correspondente em `global_hashes`.
- `SIL-URL-LINK-003` Mais de uma URL do mesmo formato PODE existir quando representar fonte alternativa candidata para os mesmos bytes editoriais.
- `SIL-URL-LINK-004` URLs duplicadas, após normalização segura para comparação, DEVEM ser rejeitadas; a ordem relativa das URLs distintas do mesmo formato DEVE seguir a preferência editorial declarada ou, sem preferência comprovada, a ordem de submissão.
- `SIL-URL-LINK-005` A ordem canônica DEVE agrupar primeiro `pdf` e depois `epub`, acompanhando `global_hashes`; dentro de cada formato, a fonte preferencial DEVE anteceder as alternativas.
- `SIL-URL-LINK-006` URL cujo conteúdo direto ou extraído não corresponda integralmente ao Hash Global do formato declarado NÃO DEVE ser usada para gerar asset, ainda que título, extensão ou tamanho pareçam corretos.

### 6.3 Como localizar e obter a URL

1. Preferir o link oficial de download da publicação fornecido pelo editor, autor, biblioteca, repositório institucional ou provedor confiável.
2. Quando houver página de publicação, localizar nela o link específico da variante PDF ou EPUB; a URL da página NÃO DEVE substituir o endereço do arquivo neste perfil estrito.
3. Consultar, em seguida, manifesto oficial, catálogo estruturado, feed ou API pública do mesmo provedor.
4. Usar URL declarada nos metadados do EPUB ou PDF apenas como pista e confirmá-la no provedor; endereço incorporado no arquivo NÃO DEVE ser aceito sem verificação.
5. Resolver URL relativa somente contra a página ou manifesto que a declarou e registrar o resultado absoluto.
6. Preservar a URL de aquisição submetida. Redirecionamento observado PODE ser registrado no relatório de validação, mas NÃO DEVE substituir silenciosamente o valor sugerido.
7. Não inventar endereço por padrão de nome, trocar extensão, alterar código de idioma nem construir URL a partir do nome do arquivo sem confirmação por resposta válida do provedor.

- `SIL-URL-SOURCE-001` Resultado de mecanismo de busca, cache, espelho não atribuído ou URL copiada de terceiro DEVE ser tratado somente como candidato até confirmação da origem e do conteúdo.
- `SIL-URL-SOURCE-002` URL temporária, assinada, com token secreto, credencial, sessão ou validade curta NÃO DEVE constar do documento.
- `SIL-URL-SOURCE-003` Parâmetro de consulta indispensável à obtenção pública DEVE ser preservado; parâmetro comprovadamente apenas analítico ou de rastreamento DEVERIA ser removido sem alterar o recurso entregue.
- `SIL-URL-SOURCE-004` Se não existir URL pública direta e estável para uma variante, o documento NÃO DEVE inventá-la nem usar caminho local; a sugestão permanece não conforme a este perfil até que a URL seja fornecida.

### 6.4 Verificação segura da aquisição

1. Analisar a URL com parser de URI, validar esquema e host e aplicar a política de rede antes de qualquer requisição.
2. Fazer `HEAD` apenas como sondagem opcional; disponibilidade, tipo e integridade DEVEM ser confirmados por `GET`.
3. Seguir quantidade limitada de redirecionamentos e revalidar esquema, host, DNS e endereço IP em cada salto.
4. Rejeitar loop, redirecionamento para protocolo não HTTP(S), host local, endereço privado, link-local, multicast, reservado ou destino bloqueado pela política.
5. Aplicar timeout, limite de bytes, limite de taxa, cancelamento e leitura em fluxo; corpo parcial ou truncado DEVE falhar.
6. Identificar o conteúdo por assinatura e estrutura. Extensão e `Content-Type` são evidências auxiliares, nunca prova suficiente.
7. Calcular os três hashes durante a leitura. Para PDF ou EPUB direto, os bytes recebidos DEVEM coincidir com a matriz de `global_hashes` do formato.
8. Se a URL entregar invólucro admitido pelo processo editorial, extraí-lo em ambiente isolado e limitado; exatamente um artefato do formato declarado DEVE corresponder aos três Hashes Globais.
9. Registrar diagnóstico, URL submetida, cadeia de redirecionamento, tamanho, tipo detectado e resultado dos hashes fora deste documento formativo.

- `SIL-URL-NET-001` Êxito de `HEAD`, código HTTP, nome do arquivo ou `Content-Type` compatível NÃO DEVE bastar para aceitar uma URL.
- `SIL-URL-NET-002` Resolução DNS DEVE ser reavaliada no momento da conexão para reduzir risco de DNS rebinding; validação apenas textual do hostname NÃO É suficiente.
- `SIL-URL-NET-003` Falha de rede, bloqueio por política, resposta autenticada, conteúdo HTML, desafio interativo ou indisponibilidade DEVE produzir diagnóstico e impedir incorporação automática.
- `SIL-URL-NET-004` O processo NÃO DEVE executar script, macro, mídia ativa nem conteúdo incorporado obtido pela URL.

### 6.5 Métodos recomendados

#### 6.5.1 Node.js

- Analisar com `URL` e aceitar somente `http:` ou `https:`.
- Usar cliente HTTP com redirecionamento manual e limitado, resolução DNS validada, `AbortSignal` para timeout e limite incremental de bytes.
- Ler `Response.body` como fluxo binário e alimentar simultaneamente `node:crypto.createHash("sha1")`, `createHash("sha256")` e `createHash("sha512")`.
- Validar assinatura `%PDF-` e estrutura PDF com analisador próprio; para EPUB, validar contêiner ZIP OCF e o arquivo `mimetype`.
- Não usar `arrayBuffer()` ou equivalente sem limite prévio quando a resposta puder ser grande.

#### 6.5.2 Python

- Analisar com `urllib.parse.urlsplit`, exigir esquema `http` ou `https`, `hostname` não vazio e `username`, `password` e `fragment` ausentes.
- Usar cliente HTTP que permita controlar redirecionamentos, timeout, resolução de destino e leitura incremental; `requests` ou `httpx` PODE ser usado sob essas guardas.
- Ler blocos binários e alimentar simultaneamente `hashlib.sha1()`, `hashlib.sha256()` e `hashlib.sha512()`.
- Validar PDF com analisador próprio; validar EPUB com `zipfile` sob limites de entradas, tamanhos, razão de expansão e caminhos.
- Não usar `response.content` ou equivalente sem limite prévio quando a resposta puder ser grande.

#### 6.5.3 Neutralidade

- Biblioteca ou cliente citado é recomendação operacional, não dependência normativa.
- Implementação alternativa somente é conforme quando aplica as mesmas restrições de URI, rede, limites, detecção de formato e comparação dos três hashes.
- Navegador PODE auxiliar a localizar a URL, mas inspeção manual, abertura bem-sucedida ou download visual NÃO substitui a validação binária reproduzível.

## 7. Extração específica por formato

### 7.1 EPUB

- `SIL-EPUB-001` EPUB DEVE ser tratado como contêiner ZIP OCF não confiável.
- `SIL-EPUB-002` Antes de ler conteúdo, o processo DEVE limitar quantidade de entradas, tamanho comprimido, tamanho expandido, razão de expansão, profundidade e comprimento de caminho.
- `SIL-EPUB-003` Path absoluto, traversal, symlink, colisão após normalização e entidade XML externa DEVEM ser rejeitados.
- `SIL-EPUB-004` O Package Document DEVE ser localizado pelo arquivo de contêiner e analisado com namespaces.
- `SIL-EPUB-005` Título, idioma e colaboradores estruturados DEVEM ser confrontados com página de rosto e colofão na ordem de leitura definida pelo spine.
- `SIL-EPUB-006` A ordem física das entradas compactadas NÃO DEVE ser tratada como ordem editorial.
- `SIL-EPUB-007` Impressão textual usada apenas para comparar PDF e EPUB DEVE seguir o spine, excluir script, estilo e navegação repetitiva e normalizar Unicode e espaços em cópia derivada.

### 7.2 PDF

- `SIL-PDF-001` PDF DEVE ser analisado por biblioteca que interprete objetos, xref, streams, fontes, páginas e metadados.
- `SIL-PDF-002` Regex sobre bytes crus NÃO DEVE ser usada para extrair `book`.
- `SIL-PDF-003` Página de rosto e colofão visíveis DEVEM prevalecer sobre metadado técnico conflitante.
- `SIL-PDF-004` Extração de texto DEVE preservar número e ordem das páginas e registrar falha, página vazia e baixa densidade textual.
- `SIL-PDF-005` OCR somente DEVE ser usado quando a camada textual for ausente ou insuficiente. Resultado de OCR é evidência derivada e NÃO DEVE substituir o original.
- `SIL-PDF-006` PDF cifrado sem autorização de leitura, corrompido ou acima dos limites operacionais DEVE falhar com diagnóstico.

### 7.3 Associação entre PDF e EPUB

- `SIL-MATCH-001` PDF e EPUB somente DEVEM integrar o mesmo documento quando título, autoria, idioma e identidade editorial forem compatíveis.
- `SIL-MATCH-002` Comparação DEVERIA usar impressão textual derivada de amostras distribuídas na ordem editorial, nunca igualdade de hashes entre formatos.
- `SIL-MATCH-003` Diferença de paginação, layout ou codificação NÃO implica obra distinta.
- `SIL-MATCH-004` Diferença material de conteúdo, idioma, autoria ou edição DEVE impedir associação automática.
- `SIL-MATCH-005` Confiança insuficiente DEVE encaminhar para revisão humana.

## 8. Validação integral

1. Analisar JSON ou YAML em modo seguro.
2. Confirmar que a raiz contém somente `book`, `urls` e `global_hashes`.
3. Confirmar as seis chaves exatas de `book`.
4. Confirmar `edition: {}` e a presença de `tags`, ainda que `[]`.
5. Confirmar ao menos um contribuidor e ao menos um `author`.
6. Confirmar duas chaves exatas em cada contribuidor.
7. Validar título, nomes, papéis, idioma, categoria e tags.
8. Confirmar `urls` não vazio e duas chaves exatas em cada item.
9. Validar formato, sintaxe, segurança e unicidade de cada URL.
10. Confirmar correspondência total entre os formatos de `urls` e `global_hashes`.
11. Confirmar um ou dois itens em `global_hashes`, sem formato duplicado.
12. Confirmar quatro chaves exatas em cada Hash Global.
13. Obter cada variante, identificar seu formato e comparar os três hashes.
14. Confirmar a associação editorial quando PDF e EPUB coexistirem.
15. Serializar no outro formato, analisar novamente e exigir igualdade profunda.

- `SIL-VAL-001` Falha DEVE indicar a propriedade, a regra violada e a evidência necessária, sem inventar valor substituto.
- `SIL-VAL-002` Item inválido NÃO DEVE ser silenciosamente removido para fazer o documento parecer conforme.
- `SIL-VAL-003` Documento somente é conforme quando todas as propriedades obrigatórias existem e nenhuma propriedade adicional existe.

## 9. Exemplos semanticamente equivalentes

### 9.1 JSON

```json
{
  "book": {
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
  "urls": [
    {
      "format": "pdf",
      "url": "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf"
    },
    {
      "format": "epub",
      "url": "https://media2.egwwritings.org/epub/pt_AA(AA).epub"
    }
  ],
  "global_hashes": [
    {
      "format": "pdf",
      "sha1": "ef605032eb4011e6f058c100dc845f414e36e4f4",
      "sha256": "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a",
      "sha512": "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
    },
    {
      "format": "epub",
      "sha1": "6df74abc8e2d57f82ff54a3b373d855c016f9f15",
      "sha256": "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29",
      "sha512": "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
    }
  ]
}
```

### 9.2 YAML

```yaml
book:
  title: "Atos Dos Apóstolos"
  contributors:
    - name: "Ellen G. White"
      role: "author"
  edition: {}
  language: "pt-br"
  primary_category: "livros"
  tags: []
urls:
  - format: "pdf"
    url: "https://media2.egwwritings.org/pdf/pt_AA(AA).pdf"
  - format: "epub"
    url: "https://media2.egwwritings.org/epub/pt_AA(AA).epub"
global_hashes:
  - format: "pdf"
    sha1: "ef605032eb4011e6f058c100dc845f414e36e4f4"
    sha256: "91e2d4ea3e74a3ec55ecd61fb659f57927ef90ae413ea699cd8b4e92c7d9051a"
    sha512: "75b0c5ffda1ae8314cae7612afc947393817581b9ac219db497d526ee90417841e16b0e5f3ab0f2421eb8201358502ba6f9628e62195b4c37437d0967748cb42"
  - format: "epub"
    sha1: "6df74abc8e2d57f82ff54a3b373d855c016f9f15"
    sha256: "46d2ed2d02977d96d625c6c0d2ad65de4f769cece56b2e45f64f65555f5eba29"
    sha512: "cc055518caab4bcf2399dde632359ab808b5dfeea2259e886b9f9af161eca7fea611d7658d11d42f1a68b4d3f54e57a25ff50e2a68d010c83bb8337d1e41ff80"
```

- `SIL-EX-001` Os exemplos JSON e YAML DEVEM produzir estruturas profundamente iguais após parse seguro.
- `SIL-EX-002` Os exemplos contêm todas e somente as propriedades autorizadas.

## 10. Referências técnicas

- RCF local: [`../RCF.md`](../RCF.md), especialmente `RCF-IF-DATA-009..025` e `RCF-IF-HASH-001..006`.
- JSON: [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259).
- YAML: [YAML 1.2.2](https://yaml.org/spec/1.2.2/).
- URI: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986).
- Idiomas: [BCP 47 / RFC 5646](https://www.rfc-editor.org/rfc/rfc5646).
- EPUB: [EPUB 3.3](https://www.w3.org/TR/epub-33/).
- Hash em Node.js: [`node:crypto`](https://nodejs.org/api/crypto.html).
- URL em Node.js: [`URL`](https://nodejs.org/api/url.html#the-whatwg-url-api).
- PDF em Node.js: [PDF.js API](https://mozilla.github.io/pdf.js/api/).
- Hash em Python: [`hashlib`](https://docs.python.org/3/library/hashlib.html).
- URL em Python: [`urllib.parse`](https://docs.python.org/3/library/urllib.parse.html).
- EPUB em Python: [`zipfile`](https://docs.python.org/3/library/zipfile.html).
- PDF em Python: [pypdf](https://pypdf.readthedocs.io/en/latest/user/extract-text.html) e [PyMuPDF](https://pymupdf.readthedocs.io/en/latest/).

Não existe vínculo com editoras; o projeto não responde pelo conteúdo de terceiros; atribuição, restrições e integridade permanecem obrigatórias.
