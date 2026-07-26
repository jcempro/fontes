# Índice de Fontes Bibliográficas

Índice estático de obras e fontes preservadas. O contrato está em [RCF.md](RCF.md) e o estado técnico em [handoff.md](handoff.md).

`src/` contém os insumos da aplicação e `dist/` é o artefato estático publicado. `npm run egw:import` importa o acervo privado `src/egw/`; `npm run egw:update` regenera metadados, autoria e capas de trabalho. O script especializado [`scripts/maintain-egw.mjs`](scripts/maintain-egw.mjs) completa fontes equivalentes por provedor com validação integral e executa o acervo todo por `npm run egw:maintain`, um livro por `-- --book=<id>` ou `-- --metadata=<arquivo>`, e uma relação específica acrescentando `--source=<id>` e/ou `--provider=<id|domínio>`; localmente só há timeout com `--timeout-ms`, enquanto o workflow diário usa 18 minutos internos sob teto de 20 minutos. `npm run egw:validate` verifica os insumos, `npm run build` materializa `/d/<idioma>/<categoria>/<título>/` com `metadata.json` schema 5, capa PNG, QR Code SVG do short URL e contêineres 7z LZMA2, sem expor PDF/EPUB cru; `npm run check:dist` valida o artefato e `npm run test:ui` valida página inicial, rotas e 404. `npm run dev-live` serve exclusivamente `dist/` com recarga local.

Pacotes 7z validados são armazenados em cache local ignorado, identificado pelos hashes dos originais e pela configuração de compressão. Build local e GitHub Actions reutilizam o pacote enquanto conteúdo e parâmetros forem idênticos; nenhuma reconstrução limpa recomprime um pacote já confirmado.

O acervo de entrada não é versionado. A manutenção só adiciona URL cujo SHA-512 seja idêntico ao asset já aceito. Não há vínculo com editoras e fontes de terceiros podem ficar indisponíveis.

A interface pública mantém rotas canônicas `/d/`, aliases curtos `/` com domínio curto centralizado em `https://f.jcem.pro/<token>` e busca estritamente por título. A submissão abaixo do mínimo configurado exibe aviso sem consultar o índice; resultado único abre diretamente e múltiplos resultados abrem painel amplo, fechável, paginado e ordenado para seleção explícita. Rotas diretas e busca exibem progresso linear não bloqueante, publicam estados parciais e reutilizam índices já carregados na sessão. A página institucional usa fundo claro, com Top Bar e rodapé escuros, superfícies translúcidas, densidade desktop refinada, grid de fontes sem rolagem local, QR Code SVG baixável no cabeçalho do livro, hashes abreviados aos sete caracteres finais com cópia integral e separação entre Fonte, arquivos da publicação, assets rastreáveis e Provedor editorial. Ícones usam adaptador neutro com provider opcional e fallback local.

## Como indicar URLs de publicações

As formas simples de envio por Issue estão documentadas em [Como Indicar URLs de Publicações](docs/indicar-fontes.md), com exemplos em texto livre, Markdown, JSON e YAML. Para sugestões formativas com dados do livro e hashes globais, consulte a [Norma de Dados Formativos para Sugestão de Livro](docs/norma-sugestao-inclusao-livro.md).

O QR Code é gerado no build com a biblioteca MIT `qrcode` (`node-qrcode`), escolhida por suporte oficial a SVG, `errorCorrectionLevel`, compatibilidade Node `>=10.13.0`, uso em servidor/cliente e dependência proporcional.

Autoria: [JeanCarloEM](https://www.jeancarloem.com)<br>
Repositório: [jcempro/egw](https://github.com/jcempro/egw)<br>
Licença: [MPL-2.0](LICENSE)
