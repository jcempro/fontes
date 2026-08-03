- [ ] Diagnosticar e corrigir de forma robusta e resiliente o erro `Invalid workflow file: .github/workflows/source-intake.yml#L13 — You have an error in your YAML syntax on line 13`.
  - Inspecionar o arquivo integralmente e identificar a causa real, considerando que a linha indicada pelo GitHub PODE ser apenas o ponto de detecção de erro originado anteriormente.
  - Corrigir exclusivamente o necessário, preservando integralmente a finalidade, os gatilhos, permissões, condições, variáveis, dependências, jobs, steps e contratos vigentes do workflow.
  - Validar sintaxe YAML, estrutura de workflow do GitHub Actions, expressões `${{ ... }}`, indentação, escalares, aspas, caracteres especiais, chaves, listas, blocos multilinha e campos reservados.
  - NÃO considerar concluído apenas porque o YAML é genericamente válido: o arquivo DEVE também ser aceito como workflow válido pelo GitHub Actions.
  - Executar, quando disponíveis ou proporcionalmente incorporáveis, validadores complementares como parser YAML, `actionlint` e mecanismo equivalente ao schema do GitHub Actions, corrigindo também erros correlatos diretamente impeditivos.
  - Implementar prevenção de regressão por validação automatizada local e/ou em hook, script ou workflow adequado, garantindo que alterações futuras em `.github/workflows/**/*.yml` e `.yaml` falhem antes da integração quando houver sintaxe ou estrutura inválida.
  - A validação preventiva DEVE ser determinística, rápida, reutilizável pelo construtor de `AGENTS.md`, produzir diagnóstico conciso com arquivo e linha e não depender exclusivamente da tentativa remota de execução.
  - Confirmar como critérios de aceite: ausência do erro na linha `13` e de erros sintáticos correlatos; parsing integral bem-sucedido; reconhecimento válido pelo GitHub Actions; preservação do comportamento pretendido; e mecanismo preventivo documentado e executável.

- [ ] Retomar e concluir a implementação já iniciada para migrar as `shortURLs` de `/_/<code>` para `/<code>`, juntamente com as demais FTs em andamento diretamente relacionadas.
  - Inspecionar previamente o estado real da implementação, preservando decisões, requisitos, compatibilidade e progresso válido já existentes.
  - Atualizar geração, indexação, resolução, redirecionamento, validação, testes, documentação e referências afetadas pelo novo formato.
  - Eliminar dependências funcionais de `/_/`, mantendo compatibilidade legada apenas quando ainda necessária ou normativamente exigida.
  - Garantir que `/<code>` não colida com rotas, arquivos, diretórios, idiomas, páginas reservadas ou outros identificadores; conflitos DEVEM ser detectados e resolvidos deterministicamente conforme as normas vigentes.

  - [ ] Após, ajustar o script de indexação e refatorar exclusivamente o necessário para reinicializar e reatribuir integralmente as `shortURLs`, processando primeiro `pt-BR` e somente depois os demais idiomas, de modo que o português brasileiro detenha prioridade na reserva de identificadores disputados.
    - A ordem DEVE ser determinística: `pt-BR` primeiro; demais idiomas depois, conforme o critério estável já existente ou, se inexistente, pela tag canônica de idioma em ordem lexical.
    - Todos os índices e registros de `shortURLs` existentes DEVEM ser resetados e reconstruídos segundo esta norma; valores anteriores NÃO DEVEM ser preservados quando impedirem a correção, uniformização ou aplicação integral da nova precedência.
    - Em colisão multilingue, a forma-base sem qualificador DEVE ser reservada ao conteúdo `pt-BR`; os demais idiomas DEVEM receber desambiguação mínima, determinística e progressiva.
    - A tag de idioma PODE ser usada como desambiguador, mas NÃO DEVE ser acrescentada integralmente, como `.en-us`, quando forma menor já identificar o idioma de modo inequívoco. O script DEVE testar candidatos crescentes e selecionar o menor suficiente, por exemplo: `.e`, `.en` e, somente quando necessário, extensões progressivas derivadas da tag canônica até eliminar a colisão.
    - A redução da tag NÃO PODE produzir ambiguidade, instabilidade ou associação incorreta. Havendo conflito entre abreviações, o qualificador DEVE crescer apenas o necessário, incorporando gradualmente caracteres ou subtags canônicas adicionais.
    - O separador padrão entre a `shortURL` e o desambiguador DEVE ser `.`, por ser estreito, legível e compatível com o objetivo de concisão. `-` e `_` NÃO SÃO proibidos, mas NÃO DEVEM ser usados quando `.` atender ao mesmo propósito sem conflito técnico.
    - O mecanismo vigente de desambiguação PODE ser preservado apenas no que for compatível com esta precedência, com a minimização dos qualificadores e com a unicidade global.
    - A alteração NÃO DEVE alcançar regras, formatos ou partes do script sem relação direta com a ordem de indexação, a reconstrução dos índices ou a geração e desambiguação das `shortURLs`.
    - Validar que todas as `shortURLs` tenham sido recalculadas, sejam únicas e determinísticas; que `pt-BR` sempre retenha a forma preferencial em colisões; e que cada qualificador linguístico seja o menor capaz de desambiguar seu destino.
  - Após a migração, localizar e corrigir todos os assets que contenham, codifiquem, representem ou apontem para `shortURLs` antigas, incluindo QR Codes, imagens, metadados, manifests, índices, arquivos gerados, documentos e recursos equivalentes.
  - Assets derivados DEVEM ser regenerados a partir da `shortURL` canônica atual, e não alterados apenas visualmente ou por substituição textual quando isso puder produzir conteúdo inválido.
  - Normatizar e implementar coerência contínua e verificável entre `code`, `shortURL` e respectivos assets: qualquer criação, alteração, reatribuição ou remoção de um desses elementos DEVE atualizar ou invalidar atomicamente os demais.
  - A validação DEVE detectar `code` divergente, URL obsoleta, asset ausente, QR Code inválido, destino incorreto, referência ao formato legado ou qualquer descasamento entre fonte canônica e artefato derivado.
  - Sempre que possível, centralizar a geração em uma única fonte canônica e automatizar atualização e validação por scripts, hooks ou workflows já previstos, impedindo recorrência do descasamento e reduzindo processamento manual ou pela IA.
  - Não ampliar o escopo além da migração, da correção integral dos assets, da coerência normativa associada e das FTs em andamento necessárias à conclusão segura.

* [ ] Avaliar e, somente se houver ganho líquido comprovável, segmentar os índices para carregamento sob demanda
  - Preservar integralmente a arquitetura, aderência, determinismo e otimizações atuais de banco de dados, pesquisa e indexação, inclusive para _short URLs_ e demais modalidades. A segmentação NÃO DEVE substituir o método vigente, apenas complementá-lo quando tecnicamente vantajosa.

  - Inspecionar o fluxo real de geração, publicação, seleção, download, cache, invalidação e consulta dos índices; medir tamanho, latência, número de requisições, repetição de downloads, custo de processamento, desempenho em conexões lentas e impacto sobre cliente, servidor, build e manutenção.

  - Avaliar índices menores, selecionados deterministicamente pela consulta, incluindo:
    - _short URLs_: particionamento por primeira letra (`26` bases) ou pelas duas primeiras (`676` bases), considerando distribuição real, tamanho, granularidade, quantidade de publicações e custo HTTP;
    - títulos: índice ou mapa compacto de termos significativos, normalizados e sem palavras de ligação/_stopwords_, apontando apenas para os segmentos necessários;
    - demais pesquisas: estratégias análogas compatíveis com sua semântica, sem presumir que o mesmo particionamento seja adequado.

  - A solução DEVE considerar:
    - manifesto mínimo para localizar e versionar segmentos;
    - carregamento dinâmico somente das bases necessárias;
    - cache e deduplicação de requisições;
    - invalidação e atualização determinísticas;
    - distribuição equilibrada ou tratamento de segmentos desproporcionais;
    - normalização de caracteres, siglas, números, acentos e consultas incompletas;
    - fallback compatível com o índice atual;
    - ausência de perda funcional, resultados divergentes ou aumento relevante de complexidade.

  - Comparar objetivamente o modelo atual e as alternativas por benchmarks representativos, incluindo conexão lenta, cache frio/quente, consultas comuns e pior caso. Considerar bytes transferidos, tempo até o primeiro resultado, latência total, requisições, memória, CPU, tamanho agregado, build e manutenção.

  - Implementar somente quando o ganho potencial líquido for material e superar os custos de fragmentação, manifesto, múltiplas requisições, cache, atualização e complexidade operacional. Caso contrário, preservar o método atual e registrar sucintamente a conclusão.

  - Se aprovada, centralizar geração, roteamento, carregamento e validação dos segmentos; atualizar todos os consumidores aplicáveis; manter retrocompatibilidade durante a migração; adicionar testes de equivalência, integridade, cache, ausência de segmento, atualização, conexão lenta e regressão.

  - Concluir somente quando os resultados permanecerem equivalentes aos atuais e os benchmarks comprovarem redução material de atraso ou tráfego sem regressão líquida.

* [ ] Ampliar a ingestão de múltiplas publicações por conteúdo direto, anexo ou fonte remota
  - Preservar os formatos atuais de solicitação por Issue/TO-DO e aceitar JSON, YAML, TXT ou equivalente por:
    - conteúdo direto;
    - arquivo anexado, implementando o suporte se inexistente;
    - URL remota de arquivo contendo URLs e metadados de uma ou mais publicações.

  - Os formatos DEVEM permanecer aderentes ao RCF vigente. Aprimoramentos PODEM ampliar tolerância e interoperabilidade, mas NÃO DEVEM contradizer contratos existentes nem causar regressão.

  - A obtenção remota DEVE validar protocolo, redirecionamentos, origem quando aplicável, tamanho, timeout, formato e conteúdo, impedindo SSRF, acesso a recursos locais, downloads ilimitados e interpretação incompatível.

  - O parser DEVE:
    - percorrer recursivamente objetos, listas e estruturas aninhadas;
    - extrair múltiplas publicações, inclusive fora do modelo recomendado;
    - tolerar agrupamentos distintos, metadados adicionais e aliases semanticamente inequívocos;
    - não inferir campos ambíguos nem equiparar chaves incompatíveis;
    - registrar itens ignorados e interromper a incorporação quando a correspondência não for segura.

  - O informante PODE fornecer mapa/manifesto estrutural JSON/YAML associando campos externos aos campos de ingestão, inclusive por caminhos aninhados, listas e estruturas repetidas. O mapa DEVE ser validado, determinístico, declarativo e incapaz de executar código ou alterar contratos internos.
    - neste caso, o script deste repositório deve ser capaz de lidar com isso ser resiliente quanto ao rigor, no sentido de ser tolerante a multiplicidade, formas, estilos e expressividades.
    - o RCF deve normatizar o funcionamento.
    - deve haver documentação clara explicando como fazer o mapa/manifesto.
      - MAPA/MANIFESTO: é uma definição estrutural invariável do contrato: quais blocos existem, sua cardinalidade e quais campos compõem cada um — igual para índice vazio, parcial ou completo.

  - Dados externos constituem entrada candidata, NÃO fonte normativa:
    - IDs, códigos, _short URLs_, tags, categorias, estados e relações externas NÃO DEVEM ser assimilados como identificadores internos;
    - o repositório DEVE detectar registros existentes, deduplicar, compatibilizar ou criar publicações e administrar seus próprios IDs, códigos, _short URLs_, tags e relações;
    - título, autor, capa e URLs de PDF/EPUB PODEM ser importados, mas DEVEM ser normalizados, verificados e conciliados com o estado canônico;
    - campos desconhecidos DEVEM ser ignorados ou preservados exclusivamente como metadados externos, jamais convertidos silenciosamente em regras internas.

  - Somente metadados e capas DEVEM ser incorporados fisicamente ao repositório. PDF, EPUB e respectivos arquivos compactados NÃO DEVEM ser copiados ou clonados; apenas suas URLs DEVEM ser registradas.

  - Antes do registro, cada asset remoto DEVE ser efetivamente validado quanto a:
    - disponibilidade e resposta HTTP;
    - formato real por MIME type e conteúdo, não apenas extensão;
    - correspondência com PDF ou EPUB declarado;
    - integridade e compatibilidade dos hashes informados;
    - ausência de confiança automática em metadados fornecidos por terceiros.

  - O recurso existente que permite armazenar PDF, EPUB ou equivalentes ZIP/7z no repositório DEVE ser desabilitado, segregado e totalmente desvinculado do fluxo ativo, sem ser eliminado.

  - Centralizar obtenção, parsing, mapeamento, normalização, validação, deduplicação e incorporação para todos os canais.

  - Normatizar no RCF:
    - canais e formatos aceitos;
    - descoberta recursiva;
    - contrato do mapa estrutural;
    - aliases admitidos;
    - autoridade e precedência dos dados;
    - ambiguidades, duplicidades e campos externos;
    - política de incorporação de metadados, capas e referências remotas;
    - segregação do armazenamento local desativado.

  - Documentar sucintamente conteúdo direto, anexo, URL remota, múltiplas publicações, estruturas aninhadas e mapa estrutural personalizado.

  - Validar estruturas padrão, profundas, heterogêneas, mapeadas, ambíguas, malformadas, remotas, duplicadas e com identificadores externos conflitantes, além de MIME, hashes, links inválidos e indisponibilidade remota.
