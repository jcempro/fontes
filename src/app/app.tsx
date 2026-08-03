// JeanCarloEM — https://www.jeancarloem.com — https://github.com/jcempro/egw
// MPL-2.0 — https://www.mozilla.org/MPL/2.0/ — uso sob a Mozilla Public License 2.0.

import { faCopy, faDownload, faFileZipper, faQrcode, faXmark } from "@fortawesome/free-solid-svg-icons";
import { renderIcon, type IconSource } from "./icon-provider";

type Child = Node | string | number | null | undefined | false;
type Hashes = { sha1: string; sha256: string; sha512: string };
type Asset = { id: string; format: string; url: string; size: number; source_hashes: Hashes; origin_url: string | null };
type Source = { id: string; title: string; url: string; type: string; format: string; provider: string; asset_id: string | null; hashes: Hashes | null };
type Metadata = { schema_version: 5; book: { id: string; title: string; contributors: Array<{ name: string; role: string }>; edition: Record<string, unknown>; language: string; primary_category: string; tags: string[] }; short_token: string; global_hashes: Array<{ artifact_id: string; format: string } & Hashes>; assets: Asset[]; sources: Source[] };
type ProcessingState = "initial" | "loading" | "partial" | "content-partial" | "completed" | "error" | "updating";
type RuntimeConfig = { schema_version: 1; short_url_origin: string; search: { min_query_chars: number; results_per_page: number }; short_urls: { schema_version: 1; reserved_tokens: string[] }; qr_code: { asset_name: string; error_correction_level: string } };

export {};
declare global { namespace JSX { interface IntrinsicElements { [element: string]: Record<string, unknown>; } } }

const Fragment = Symbol("Fragment");
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["svg", "path", "circle", "line", "polyline", "polygon", "rect", "g", "use"]);
function h(tag: string | symbol, props: Record<string, unknown> | null, ...children: Child[]): Node {
  if (tag === Fragment) { const fragment = document.createDocumentFragment(); children.flat().forEach((child) => append(fragment, child)); return fragment; }
  const name = tag as string; const node = SVG_TAGS.has(name) ? document.createElementNS(SVG_NS, name) : document.createElement(name);
  for (const [key, value] of Object.entries(props || {})) {
    if (key === "className") node.setAttribute("class", String(value));
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  children.flat().forEach((child) => append(node, child));
  return node;
}
function append(parent: Node, child: Child): void { if (child !== null && child !== undefined && child !== false) parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child))); }
function required(id: string): HTMLElement { const node = document.getElementById(id); if (!node) throw new Error(`Elemento obrigatório ausente: ${id}`); return node; }

const landing = required("landing-view");
const bookView = required("book-view");
const notFound = required("not-found-view");
const live = required("live-region");
const processing = required("processing-indicator");
const processingLabel = required("processing-label");
const form = required("lookup-form") as HTMLFormElement;
const input = required("book-id") as HTMLInputElement;
let searchAbort: AbortController | null = null;
let searchIndex: Array<[string, string]> | null = null;
let searchIndexPromise: Promise<Array<[string, string]>> | null = null;
let runtimeConfig: RuntimeConfig | null = null;
let runtimeConfigPromise: Promise<RuntimeConfig> | null = null;
let processingSequence = 0;
const jsonRequests = new Map<string, Promise<unknown>>();
const searchNotice = document.createElement("div");
searchNotice.id = "search-notice";
searchNotice.className = "search-notice";
searchNotice.setAttribute("aria-live", "polite");
form.after(searchNotice);
const searchResults = document.createElement("section");
searchResults.id = "search-results";
searchResults.className = "search-results";
searchResults.setAttribute("role", "dialog");
searchResults.setAttribute("aria-modal", "false");
searchResults.setAttribute("aria-labelledby", "search-results-title");
searchResults.hidden = true;
document.body.append(searchResults);

function rootUrl(relative: string): string { return new URL(relative.replace(/^\/+/, ""), `${location.origin}/`).href; }
function shortUrl(config: RuntimeConfig, token: string): string { return `${config.short_url_origin.replace(/\/+$/g, "")}/${encodeURIComponent(token)}`; }
function setView(view: "landing" | "book" | "notFound"): void { landing.hidden = view !== "landing"; bookView.hidden = view !== "book"; notFound.hidden = view !== "notFound"; }
function announce(message: string): void { live.textContent = ""; requestAnimationFrame(() => { live.textContent = message; }); }
function startProcessing(state: ProcessingState, message: string): number { const sequence = ++processingSequence; processing.dataset.state = state; processingLabel.textContent = message; processing.hidden = false; return sequence; }
function updateProcessing(sequence: number, state: ProcessingState, message: string): void { if (sequence !== processingSequence) return; processing.dataset.state = state; processingLabel.textContent = message; }
function finishProcessing(sequence: number, state: "completed" | "error", message: string): void { if (sequence !== processingSequence) return; updateProcessing(sequence, state, message); requestAnimationFrame(() => setTimeout(() => { if (sequence === processingSequence) processing.hidden = true; }, state === "error" ? 2200 : 500)); }
async function cachedJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const cached = jsonRequests.get(url); if (cached) return cached;
  const request = fetch(url, { credentials: "same-origin", ...init }).then(async (response) => { if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error("JSON indisponível"); return response.json() as Promise<unknown>; });
  jsonRequests.set(url, request); request.catch(() => jsonRequests.delete(url)); return request;
}
async function ensureRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeConfig) return runtimeConfig;
  if (runtimeConfigPromise) return runtimeConfigPromise;
  runtimeConfigPromise = cachedJson(rootUrl("d/_index/config.json")).then((data) => {
    const value = data as RuntimeConfig;
    if (value?.schema_version !== 1 || !/^https:\/\/[^/?#]+$/i.test(value.short_url_origin) || !Number.isSafeInteger(value.search?.min_query_chars) || !Number.isSafeInteger(value.search?.results_per_page) || value.short_urls?.schema_version !== 1 || !Array.isArray(value.short_urls.reserved_tokens) || !value.qr_code?.asset_name) throw new Error("Configuração pública inválida");
    runtimeConfig = value;
    return value;
  }).catch((error) => { runtimeConfigPromise = null; throw error; });
  return runtimeConfigPromise;
}
function validHashes(value: unknown): value is Hashes {
  if (!value || typeof value !== "object") return false;
  const hashes = value as Record<string, unknown>;
  return /^[a-f0-9]{40}$/.test(String(hashes.sha1 || "")) && /^[a-f0-9]{64}$/.test(String(hashes.sha256 || "")) && /^[a-f0-9]{128}$/.test(String(hashes.sha512 || ""));
}
function validMetadata(value: unknown): value is Metadata {
  if (!value || typeof value !== "object") return false;
  const data = value as Metadata;
  return Object.keys(data).sort().join(",") === "assets,book,global_hashes,schema_version,short_token,sources" && data.schema_version === 5 && Boolean(data.book?.id && data.book?.title && data.book?.language && data.book?.primary_category) && Array.isArray(data.global_hashes) && data.global_hashes.length > 0 && data.global_hashes.every(validHashes) && Array.isArray(data.assets) && data.assets.length > 0 && data.assets.every((asset) => /^\.\/[a-z0-9][a-z0-9.-]*$/i.test(asset.url) && validHashes(asset.source_hashes)) && Array.isArray(data.sources);
}
function segment(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function metadataPath(data: Metadata): string {
  const words = segment(data.book.title).split("-").filter(Boolean); const remainder = words.length > 2 ? words.slice(2).join("-") : segment(data.book.id);
  return `/d/${segment(data.book.language)}/${segment(data.book.primary_category)}/${words[0] || segment(data.book.id)}/${words[1] || remainder}/${remainder}/metadata.json`;
}
function formatBytes(value: number): string { const divisor = value >= 1_000_000 ? 1_000_000 : 1_000; return `${(value / divisor).toFixed(1)} ${divisor === 1_000_000 ? "MB" : "kB"}`; }
function icon(source: IconSource, fallback: string): Node { return renderIcon(source, fallback); }
async function copyValue(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const field = document.createElement("textarea"); field.value = value; field.className = "sr-only"; document.body.append(field); field.select(); const copied = document.execCommand("copy"); field.remove(); if (!copied) throw new Error("Cópia indisponível");
}
function copyButton(value: string, label: string): HTMLButtonElement {
  const button = <button type="button" className="icon-button" aria-label={label} title={label}>{icon(faCopy, "⧉")}</button> as HTMLButtonElement;
  button.addEventListener("click", async () => { try { await copyValue(value); announce("Valor integral copiado."); } catch { announce("Não foi possível copiar; selecione o valor integral."); } });
  return button;
}
function displayedValue(value: string, kind: "hash" | "url"): string {
  if (kind === "hash") return value.slice(-7);
  try { const parsed = new URL(value); const tail = `${parsed.pathname}${parsed.search}${parsed.hash}`; return `…${tail.slice(-18)}`; } catch { return `…${value.slice(-18)}`; }
}
function compactValue(value: string, kind: "hash" | "url", label: string, linked = false): Node {
  const text = displayedValue(value, kind);
  const visible = linked ? <a className="compact-text" href={value} target="_blank" rel="noopener noreferrer" title={value} aria-label={value}>{text}</a> : <span className="compact-text" title={value} aria-label={value}>{text}</span>;
  return <span className={`compact-value compact-${kind}`}>{visible}{copyButton(value, label)}</span>;
}
function assetFormat(format: string): Node {
  const normalized = format.toLowerCase();
  if (normalized === "7z" || normalized === "zip") return <span className="asset-format" title={`.${normalized}`} aria-label={`Arquivo .${normalized}`}>{icon(faFileZipper, "▣")}<span className="sr-only">.{normalized}</span></span>;
  return <span className="asset-format-fallback">.{normalized}</span>;
}
function titleIdentity(data: Metadata): { title: string; qualifier: string | null } {
  const configured = typeof data.book.edition?.qualifier === "string" ? data.book.edition.qualifier.trim() : ""; const match = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(data.book.title);
  if (configured && match) return { title: match[1].trim(), qualifier: configured }; if (configured) return { title: data.book.title, qualifier: configured };
  return match && /condensad|abridg|adaptad|resum|edi[cç][aã]o|edition|vers[aã]o|version/i.test(match[2]) ? { title: match[1].trim(), qualifier: match[2].trim() } : { title: data.book.title, qualifier: null };
}
function renderBook(data: Metadata, metadataUrl: string, config: RuntimeConfig): void {
  const base = new URL("./", metadataUrl);
  const cover = data.assets.find((asset) => asset.id === "cover");
  const qrAsset = data.assets.find((asset) => asset.id === "short-url-qr" && asset.format === "svg");
  const qrHref = qrAsset ? new URL(qrAsset.url, base).href : "";
  const absoluteShortUrl = shortUrl(config, data.short_token);
  const localAssetIds = new Set(data.assets.map((asset) => asset.id)); const publicationFiles = data.assets.length + 1; const traceableAssets = new Set(data.sources.map((source) => source.asset_id).filter((assetId): assetId is string => Boolean(assetId && localAssetIds.has(assetId)))).size;
  const authors = data.book.contributors.filter((person) => person.role === "author").map((person) => person.name).join(", "); const identity = titleIdentity(data);
  const globalRows = data.global_hashes.map((hash) => <article className="panel hash-panel"><header><span className="format-badge">{hash.format.toUpperCase()}</span><h3>Hash global</h3></header><dl>{(["sha1", "sha256", "sha512"] as const).map((algorithm) => <div className="hash-row"><dt>{algorithm.toUpperCase()}</dt><dd><code className="hash">{compactValue(hash[algorithm], "hash", `Copiar ${algorithm.toUpperCase()} integral`)}</code></dd></div>)}</dl></article>);
  const sourceRows = data.sources.map((source, index) => {
    const asset = data.assets.find((candidate) => candidate.id === source.asset_id);
    const href = asset ? new URL(asset.url, base).href : source.url;
    const assetHash = asset?.source_hashes.sha256 || source.hashes?.sha256 || "";
    const sourceHost = source.title || new URL(href).hostname; const provider = source.provider === sourceHost ? null : source.provider;
    return <article className="source-item" role="listitem" aria-label={`Fonte ${index + 1}`}>
      <div className="source-primary"><span className="source-index">{index + 1}</span><div className="source-field source-host"><span className="field-label">Fonte</span><strong>{sourceHost}</strong></div><div className="source-field source-url"><span className="field-label">URL</span>{compactValue(href, "url", "Copiar URL integral", true)}</div><div className="source-field source-reading"><span className="field-label">Formato</span><span className="format-badge">{source.format.toUpperCase()}</span></div><div className="source-field source-asset"><span className="field-label">Asset</span>{asset ? assetFormat(asset.format) : <span className="asset-format-fallback">.remoto</span>}</div></div>
      <div className="source-secondary"><div className="source-field source-hash"><span className="field-label">Hash do asset</span>{assetHash ? <code className="hash">{compactValue(assetHash, "hash", "Copiar SHA-256 integral do asset")}</code> : <span>Não comparável</span>}</div><div className="source-field source-provider"><span className="field-label">Provedor</span><span>{provider || <span title="Mesmo domínio da Fonte">—</span>}</span></div><div className="source-field source-size"><span className="field-label">Tamanho</span><span>{asset ? formatBytes(asset.size) : "Externa"}</span></div><a className="download-button" href={href} download aria-label={`Baixar ${source.format.toUpperCase()} em ${asset?.format.toUpperCase() || "asset remoto"}`} title="Baixar asset">{icon(faDownload, "↓")}</a></div>
    </article>;
  });
  bookView.replaceChildren(
    <section className="book-hero"><div className="cover">{cover ? <img src={new URL(cover.url, base).href} alt={`Capa de ${data.book.title}`} /> : null}</div><div className="book-identity"><p className="eyebrow">Referência bibliográfica</p><h1 id="book-view-title">{identity.title}</h1>{identity.qualifier ? <p className="book-qualifier">{identity.qualifier}</p> : null}<p className="book-author">{authors}</p><dl className="book-facts"><div><dt>Idioma</dt><dd>{data.book.language}</dd></div><div><dt>Categoria</dt><dd>{data.book.primary_category}</dd></div></dl></div>{qrAsset ? <aside className="qr-download" aria-label={`QR Code para ${absoluteShortUrl}`}><div><span>QR Code</span><strong>{absoluteShortUrl.replace(/^https:\/\//, "")}</strong></div><img src={qrHref} alt={`QR Code para ${absoluteShortUrl}`} /><a href={qrHref} download={`${data.book.id}-short-url.svg`} aria-label={`Baixar QR Code SVG de ${absoluteShortUrl}`} title="Baixar QR Code">{icon(faDownload, "↓")}<span className="sr-only">Baixar SVG</span></a></aside> : null}</section>,
    <section className="section"><div className="metric-grid"><article className="metric"><span>Fontes preservadas</span><strong>{data.sources.length}</strong></article><article className="metric"><span>Arquivos da publicação</span><strong>{publicationFiles}</strong></article><article className="metric"><span>Assets rastreáveis</span><strong>{traceableAssets}</strong></article><article className="metric"><span>URL curta</span><strong><a href={absoluteShortUrl}>{absoluteShortUrl.replace(/^https:\/\//, "")}</a></strong></article></div></section>,
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Integridade</p><h2>Hashes dos artefatos originais</h2></div></div><div className="metric-grid">{globalRows}</div></section>,
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Fontes</p><h2>Assets e proveniência</h2></div><div className="table-actions"><a className="button button-secondary" href={metadataUrl}>metadata.json</a></div></div><div className="source-grid" role="list">{sourceRows}</div></section>
  );
  setView("book"); document.title = `${data.book.title} — Índice de Fontes`;
}
function canonicalMetadataFromPath(): string | null {
  const decoded = decodeURIComponent(location.pathname);
  if (!/^\/d\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(decoded)) return null;
  return rootUrl(`${decoded.replace(/^\/+|\/+$/g, "")}/metadata.json`);
}
async function routeFromMap(mapName: "short" | "legacy", key: string): Promise<string | null> {
  const routes = await cachedJson(rootUrl(`d/_index/${mapName}.json`)) as Record<string, string>; const route = routes[key];
  return typeof route === "string" && /^d\/[a-z0-9/-]+\/$/.test(route) ? rootUrl(`${route}metadata.json`) : null;
}
async function resolveMetadataUrl(config: RuntimeConfig): Promise<string | null> {
  const canonical = canonicalMetadataFromPath(); if (canonical) return canonical;
  const short = /^\/([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\/?$/.exec(location.pathname); if (short && !config.short_urls.reserved_tokens.some((token) => token.toLowerCase() === short[1].toLowerCase())) return routeFromMap("short", short[1]);
  const legacy = location.pathname.replace(/^\/+|\/+$/g, "") + "/";
  if (/^(?:_\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*|data\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+)\/$/.test(legacy)) return routeFromMap("legacy", legacy);
  return null;
}
async function loadRoute(): Promise<void> {
  const isDirectRoute = location.pathname !== "/" && !/\/(?:index|404)\.html$/.test(location.pathname); const activity = isDirectRoute ? startProcessing("loading", "Analisando a referência…") : 0;
  try {
    const config = await ensureRuntimeConfig();
    const metadataUrl = await resolveMetadataUrl(config);
    if (!metadataUrl) { setView(location.pathname === "/" || /\/(?:index|404)\.html$/.test(location.pathname) ? "landing" : "notFound"); if (activity) finishProcessing(activity, "error", "Referência não encontrada."); return; }
    if (activity) updateProcessing(activity, "partial", "Referência localizada; carregando dados…");
    const data = await cachedJson(metadataUrl, { redirect: "error" }); if (!validMetadata(data)) throw new Error("Metadado schema 5 inválido");
    if (new URL(metadataUrl).pathname !== metadataPath(data)) throw new Error("Rota canônica diverge do metadado");
    if (activity) updateProcessing(activity, "content-partial", "Dados validados; montando a página…"); renderBook(data, metadataUrl, config); if (activity) finishProcessing(activity, "completed", "Referência carregada.");
  } catch (error) { /* FIX-BUG: rota inválida termina no 404 real sem sondagem aproximada. */ console.error(error); setView("notFound"); if (activity) finishProcessing(activity, "error", "Não foi possível carregar a referência."); }
}
async function ensureSearchIndex(): Promise<Array<[string, string]>> {
  if (searchIndex) return searchIndex;
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = cachedJson(rootUrl("d/_index/search.json")).then((data) => { if (!Array.isArray(data) || !data.every((item) => Array.isArray(item) && item.length === 2 && item.every((value) => typeof value === "string"))) throw new Error("Índice de busca inválido"); searchIndex = data as Array<[string, string]>; return searchIndex; }).catch((error) => { searchIndexPromise = null; throw error; });
  return searchIndexPromise;
}
function normalizeSearch(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(); }
function searchableLength(value: string): number { return normalizeSearch(value).replace(/[^a-z0-9]/g, "").length; }
function closeSearchResults(): void { searchResults.replaceChildren(); searchResults.hidden = true; }
function clearSearchResults(): void { searchNotice.replaceChildren(); searchNotice.hidden = true; closeSearchResults(); }
async function metadataForToken(token: string): Promise<Metadata | null> {
  const metadataUrl = await routeFromMap("short", token);
  if (!metadataUrl) return null;
  const data = await cachedJson(metadataUrl, { redirect: "error" });
  return validMetadata(data) ? data : null;
}
async function renderDisambiguation(matches: Array<[string, string]>, config: RuntimeConfig, page = 0): Promise<void> {
  const perPage = config.search.results_per_page;
  const pages = Math.max(1, Math.ceil(matches.length / perPage));
  const current = Math.min(Math.max(page, 0), pages - 1);
  const slice = matches.slice(current * perPage, current * perPage + perPage);
  const summaries = await Promise.all(slice.map(async ([title, token]) => ({ title, token, metadata: await metadataForToken(token) })));
  const closeButton = <button type="button" className="icon-button search-close" aria-label="Fechar resultados" title="Fechar resultados">{icon(faXmark, "×")}</button> as HTMLButtonElement;
  closeButton.addEventListener("click", closeSearchResults);
  const list = <div className="search-panel"><div className="section-heading"><div><p className="eyebrow">Resultados</p><h2 id="search-results-title">Selecione a publicação</h2></div><div className="search-panel-actions"><span className="result-count">{matches.length} resultados</span>{closeButton}</div></div><div className="result-list" role="list"></div><div className="pagination"></div></div> as HTMLElement;
  const resultList = list.querySelector(".result-list") as HTMLElement;
  for (const item of summaries) {
    const metadata = item.metadata;
    const authors = metadata?.book.contributors.filter((person) => person.role === "author").map((person) => person.name).join(", ") || "";
    const qualifier = metadata && titleIdentity(metadata).qualifier;
    const href = rootUrl(item.token);
    resultList.append(<a className="result-item" role="listitem" href={href}><strong>{metadata?.book.title || item.title}</strong><span>{[metadata?.book.language, metadata?.book.primary_category, qualifier, authors, metadata?.book.id, shortUrl(config, item.token)].filter(Boolean).join(" · ")}</span></a>);
  }
  const pagination = list.querySelector(".pagination") as HTMLElement;
  if (pages > 1) {
    const previous = <button type="button" className="button button-secondary">Anterior</button> as HTMLButtonElement;
    const next = <button type="button" className="button button-secondary">Próxima</button> as HTMLButtonElement;
    previous.disabled = current === 0; next.disabled = current === pages - 1;
    previous.addEventListener("click", () => { void renderDisambiguation(matches, config, current - 1); });
    next.addEventListener("click", () => { void renderDisambiguation(matches, config, current + 1); });
    pagination.append(previous, <span>Página {current + 1} de {pages}</span>, next);
  }
  searchResults.hidden = false;
  searchResults.replaceChildren(<div className="search-backdrop"></div>, list);
  closeButton.focus();
}
async function searchTitle(): Promise<void> {
  searchAbort?.abort(); searchAbort = new AbortController(); clearSearchResults(); const raw = input.value.trim(); const query = normalizeSearch(raw); if (!query) return;
  const signal = searchAbort.signal; const activity = startProcessing(searchIndex ? "updating" : "loading", searchIndex ? "Atualizando a consulta…" : "Preparando o índice de títulos…");
  try {
    const config = await ensureRuntimeConfig();
    if (searchableLength(raw) < config.search.min_query_chars) {
      input.setCustomValidity(`Informe pelo menos ${config.search.min_query_chars} caracteres pesquisáveis.`);
      input.reportValidity();
      searchNotice.hidden = false;
      searchNotice.replaceChildren(<div className="notice" role="status">{icon(faQrcode, "i")}<p>Informe pelo menos {config.search.min_query_chars} caracteres para buscar.</p></div>);
      finishProcessing(activity, "error", "Busca não executada.");
      return;
    }
    const index = await ensureSearchIndex(); if (signal.aborted) return;
    const matches = index.filter(([title]) => normalizeSearch(title).includes(query)).sort((left, right) => normalizeSearch(left[0]).localeCompare(normalizeSearch(right[0]), "pt-BR") || left[1].localeCompare(right[1], "en"));
    if (!matches.length) { input.setCustomValidity("Livro não encontrado"); input.reportValidity(); finishProcessing(activity, "error", "Livro não encontrado."); return; }
    input.setCustomValidity("");
    if (matches.length === 1) { updateProcessing(activity, "partial", "Livro localizado; abrindo a referência…"); location.assign(rootUrl(encodeURIComponent(matches[0][1]))); return; }
    updateProcessing(activity, "partial", "Resultados encontrados; exibindo opções…");
    await renderDisambiguation(matches, config);
    finishProcessing(activity, "completed", "Escolha a publicação desejada.");
  }
  catch (error) { if ((error as Error).name !== "AbortError") { announce("A busca não pôde ser carregada."); finishProcessing(activity, "error", "Busca indisponível."); } }
}
form.addEventListener("submit", (event) => { event.preventDefault(); void searchTitle(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !searchResults.hidden) closeSearchResults(); });
input.addEventListener("focus", () => { const activity = startProcessing("updating", "Preparando a busca em segundo plano…"); void ensureSearchIndex().then(() => finishProcessing(activity, "completed", "Busca pronta.")).catch(() => finishProcessing(activity, "error", "Busca indisponível.")); }, { once: true });
void loadRoute();
