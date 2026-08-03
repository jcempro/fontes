# Contexto-mestre — Equalização das TO-DOs do produto

- FT normativa: `FT-016`.
- FTs técnicas subordinadas: `FT-017`, `FT-018`, `FT-019`, `FT-020`, `FT-021`.
- fonte canônica: `../../TODO.ia.md`.
- hash SHA-256 normalizado da fonte na triagem: `301206ef9f27fe53ab2933a0bbe6f8edf1b2698fbc31199a0b5f93f3f8b91334`.
- origem: demanda local versionada do desenvolvedor, iniciada por solicitação humana em `2026-08-02T22:21:15-03:00`.
- objetivo global: tornar ingestão, armazenamento, roteamento, indexação, assets derivados e publicação um fluxo único, determinístico, remoto por referência, seguro e validável, sem regressão das capacidades vigentes.

## Frentes equalizadas

1. Corrigir e prevenir invalidade estrutural dos workflows, começando por `source-intake.yml`.
2. Concluir a migração de URL curta para `/<token>`, reconstruir reservas com prioridade de `pt-BR` e manter coerência atômica de token, rota e QR Code.
3. Medir segmentação sob demanda e adotá-la somente mediante ganho líquido material, preservando fallback e equivalência.
4. Unificar ingestão de múltiplas publicações por conteúdo direto, anexo ou URL remota, com manifesto estrutural declarativo e limites de segurança.
5. Somente após as frentes anteriores, limpar a base e ingerir definitivamente o índice remoto indicado, mantendo localmente apenas metadados e capas.

## Decisões de equalização

- A correção do workflow precede os canais automatizados, mas não autoriza ingestão nem publicação.
- O contrato remoto posterior prevalece, no ponto incompatível, sobre regras anteriores que exigiam preservar PDF, EPUB ou contêiner local; compatibilidade histórica permanece apenas fora do fluxo ativo.
- Identificadores externos são evidência candidata. ID, token, rota, tags e relações canônicas são sempre reatribuídos pelo produto.
- A segmentação é uma decisão condicionada a benchmark; a norma deve definir o gate e o fallback, sem presumir adoção.
- A ingestão definitiva é destrutiva para estado anterior e terminal: depende de autorização técnica expressa futura, execução limpa, validação integral e ausência de artefatos editoriais locais proibidos.
- A TO-DO `equalizer` permanece pendente e perene; as subordinadas só poderão ser concluídas após norma e implementação correspondentes.

## Lacuna operacional observada

- `npm run agent:git-add -- --help` reproduziu `COMMAND_DEGRADED` sem staging; `npm run agents:update -- --check` confirmou `release:v0.1.0` sem alteração normativa. Para os commits desta FT, o fallback é o comando Git correspondente, limitado ao mesmo efeito, sem adaptação ou edição do núcleo gerenciado.

## Ordem e integração

`FT-016` → `FT-017` → (`FT-018` e `FT-019`, após contratos comuns) → `FT-020` → `FT-021`.

`FT-018` e a etapa avaliativa de `FT-019` podem ser executadas independentemente depois dos contratos comuns; toda materialização converge antes de `FT-020`. `FT-021` não admite paralelismo.

## Aceite global

- origem integral rastreada no RCF e nas FTs;
- workflow local e remoto estruturalmente válido;
- URLs curtas únicas, determinísticas e coerentes com QR Codes e rotas;
- decisão de segmentação comprovada por benchmark e equivalência;
- ingestão multicanal segura, tolerante sem inferência ambígua e transacional;
- base final sem PDF, EPUB, ZIP, 7z ou pseudopublicação local;
- índices, mapas, pesquisa e consumidores regenerados e validados sobre a base definitiva.
