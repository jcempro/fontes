#!/usr/bin/env node
// Gerado de scripts/benchmark-indexes.ts; Node 24+; nao editar.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { assignTokens, canonicalBookSegments, encodeShortCounter } from "./lib/static-books.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, ".ia.rules", "state", "contexts", "FT-019", "benchmark.json");
const HISTORICAL_REF = "f240cc3^";
const CAPACITY_PUBLICATIONS = 1e4;
const CAPACITY_CHECKPOINTS = [1e3, 2500, 5e3, CAPACITY_PUBLICATIONS];
const STOPWORDS = /* @__PURE__ */ new Set(["a", "an", "and", "as", "da", "das", "de", "do", "dos", "e", "for", "in", "of", "o", "os", "the", "to"]);
const NETWORK = { label: "slow-400kbps-180ms", bytes_per_second: 5e4, rtt_ms: 180 };
const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const jsonBytes = (value) => Buffer.byteLength(JSON.stringify(value));
const transferBytes = (value) => gzipSync(JSON.stringify(value), { level: 9 }).byteLength;
const latency = (bytes, requests) => Math.round(requests * NETWORK.rtt_ms + bytes / NETWORK.bytes_per_second * 1e3);
const words = (value) => normalize(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 2 && !STOPWORDS.has(word));
const sortRows = (rows2) => [...rows2].sort((left, right) => normalize(left[0]).localeCompare(normalize(right[0]), "pt-BR") || left[1].localeCompare(right[1], "en"));
const search = (rows2, query) => sortRows(rows2.filter(([title]) => normalize(title).includes(normalize(query))));
function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true });
}
async function loadRealCorpus() {
  const live = path.join(ROOT, "dist", "d", "_index", "search.json");
  try {
    const rows2 = JSON.parse(await readFile(live, "utf8"));
    if (rows2.length) return { books: rows2.map(([title, token], index) => ({ id: `live-books-${index}-${token}`, language: "und", title })), source: "dist/d/_index/search.json" };
  } catch {
  }
  const matches = git(["grep", "-n", "-m", "1", "-E", '"title"[[:space:]]*:', HISTORICAL_REF, "--", "src/data/books/*/metadata.json"]).split(/\r?\n/).filter(Boolean);
  const books2 = matches.map((match) => {
    const parsed = /^[^:]+:src\/data\/books\/([^/]+)\/metadata\.json:\d+:(.*)$/u.exec(match);
    if (!parsed) throw new Error(`Linha hist\xF3rica inv\xE1lida: ${match}`);
    const id = parsed[1];
    const title = JSON.parse(`{${parsed[2].trim().replace(/,$/u, "")}}`).title;
    return { id, language: id.split("-").slice(0, 2).join("-"), title };
  });
  if (!books2.length) throw new Error("Corpus real indispon\xEDvel para o benchmark");
  return { books: books2, source: `git:${HISTORICAL_REF}:src/data/books/*/metadata.json` };
}
function partition(entries, length) {
  const result = {};
  for (const entry of entries) (result[entry[0].slice(0, length) || "_"] ||= []).push(entry);
  return result;
}
function metric(payloads, requests, records) {
  const compressed = payloads.reduce((total, payload) => total + transferBytes(payload), 0);
  const memory = payloads.reduce((total, payload) => total + jsonBytes(payload), 0);
  return {
    cold: { bytes: compressed, requests, first_result_ms: latency(compressed, requests) },
    warm: { bytes: 0, requests: 0, first_result_ms: 0 },
    memory_bytes: memory,
    cpu_records_scanned: records
  };
}
function percentile(values, ratio) {
  assert.ok(values.length > 0, "percentil sem amostras");
  return values[Math.ceil((values.length - 1) * ratio)];
}
function significantPrefixes(title) {
  const prefixes = /* @__PURE__ */ new Set();
  for (const word of words(title)) for (let length = 1; length <= word.length; length += 1) prefixes.add(word.slice(0, length));
  return [...prefixes];
}
function analyzeShortEntries(entries) {
  const current = metric([entries], 1, entries.length);
  const models = [1, 2].map((length) => {
    const segments = partition(entries, length);
    const manifest = { schema_version: 1, prefix_length: length, segments: Object.keys(segments).sort() };
    const manifestBytes = transferBytes(manifest);
    const aggregate = manifestBytes + Object.values(segments).reduce((total, segment) => total + transferBytes(segment), 0);
    const segmentMetrics = new Map(Object.entries(segments).map(([key, segment]) => {
      for (const [token] of segment) assert.equal(token.slice(0, length), key, `parti\xE7\xE3o curta n\xE3o resolveu ${token}`);
      return [key, metric([segment], 1, segment.length)];
    }));
    const lookups = entries.map(([token]) => segmentMetrics.get(token.slice(0, length))).sort((left, right) => left.cold.bytes - right.cold.bytes || left.cpu_records_scanned - right.cpu_records_scanned);
    const lookupDistribution = {
      minimum: lookups[0],
      median: percentile(lookups, 0.5),
      p95: percentile(lookups, 0.95),
      worst_case: lookups.at(-1)
    };
    const gates = {
      transfer: lookupDistribution.p95.cold.bytes <= current.cold.bytes * 0.75,
      first_result: lookupDistribution.p95.cold.first_result_ms <= current.cold.first_result_ms * 0.8,
      requests: lookupDistribution.p95.cold.requests <= current.cold.requests,
      aggregate: aggregate <= current.cold.bytes * 1.25
    };
    return {
      prefix_length: length,
      routing: { strategy: "token_prefix", deterministic_client_side: true, manifest_in_critical_path: false },
      segment_count: Object.keys(segments).length,
      aggregate_bytes: aggregate,
      manifest_bytes: manifestBytes,
      max_segment_books: Math.max(...Object.values(segments).map((value) => value.length)),
      lookup_distribution: lookupDistribution,
      gates,
      approved: Object.values(gates).every(Boolean)
    };
  });
  const approvedModels = models.filter((model) => model.approved);
  const recommended = [...approvedModels].sort((left, right) => left.lookup_distribution.p95.cold.first_result_ms - right.lookup_distribution.p95.cold.first_result_ms || left.aggregate_bytes - right.aggregate_bytes)[0] || null;
  return { current, models, recommended };
}
const { books, source } = await loadRealCorpus();
const allocated = assignTokens(books.map((book) => ({ book })));
const rows = sortRows(books.map((book) => [book.title, allocated.assignments.get(book.id)]));
const shortEntries = books.map((book) => [allocated.assignments.get(book.id), `d/${canonicalBookSegments(book).join("/")}/`]);
const shortObserved = analyzeShortEntries(shortEntries);
const projectedShortEntries = [...shortEntries];
const projectedTokens = new Set(projectedShortEntries.map(([token]) => token));
let projectedCounter = 1;
while (projectedShortEntries.length < CAPACITY_PUBLICATIONS) {
  const token = encodeShortCounter(projectedCounter++);
  if (projectedTokens.has(token)) continue;
  projectedTokens.add(token);
  const baseTarget = shortEntries[projectedShortEntries.length % shortEntries.length][1].replace(/\/$/u, "");
  projectedShortEntries.push([token, `${baseTarget}/p${projectedShortEntries.length + 1}/`]);
}
const shortCapacityScenarios = Object.fromEntries(CAPACITY_CHECKPOINTS.map((publications) => [publications, analyzeShortEntries(projectedShortEntries.slice(0, publications))]));
const shortCapacity = shortCapacityScenarios[CAPACITY_PUBLICATIONS];
const titleSegments = partition(rows.map((row) => [normalize(row[0])[0] || "_", row]), 1);
const termMap = {};
for (const [segment, values] of Object.entries(titleSegments)) for (const [, row] of values) for (const prefix of significantPrefixes(row[0])) {
  const targets = termMap[prefix] ||= [];
  if (!targets.includes(segment)) targets.push(segment);
}
for (const targets of Object.values(termMap)) targets.sort();
const termFrequency = /* @__PURE__ */ new Map();
for (const [title] of rows) for (const word of new Set(words(title).filter((item) => item.length >= 5))) termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
const common = [...termFrequency].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"))[0][0];
const scenarioQueries = { common, incomplete: common.slice(0, 5), worst_case: Object.entries(termMap).filter(([key]) => key.length >= 5).sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0], "en"))[0][0] };
const titleScenarios = {};
let equivalent = true;
for (const [name, query] of Object.entries(scenarioQueries)) {
  const selector = words(query)[0] || normalize(query);
  const selected = termMap[selector] || Object.keys(titleSegments);
  const candidates = selected.flatMap((key) => titleSegments[key].map(([, row]) => row));
  const expected = search(rows, query);
  const actual = search(candidates, query);
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  equivalent &&= same;
  titleScenarios[name] = { query, selected_segments: selected.length, results: expected.length, equivalent: same, current: metric([rows], 1, rows.length), segmented: metric([termMap, ...selected.map((key) => titleSegments[key])], 1 + selected.length, candidates.length) };
}
assert.equal(equivalent, true, "a segmenta\xE7\xE3o candidata alterou resultados ou ordena\xE7\xE3o");
const currentAggregate = transferBytes(rows);
const titleAggregate = transferBytes(termMap) + Object.values(titleSegments).reduce((total, segment) => total + transferBytes(segment), 0);
const titleMaterial = Object.values(titleScenarios).every((value) => value.segmented.cold.bytes <= value.current.cold.bytes * 0.75 && value.segmented.cold.first_result_ms <= value.current.cold.first_result_ms * 0.8 && value.segmented.cold.requests <= value.current.cold.requests + 1);
const shortCurrent = shortObserved.current;
const shortEvaluations = shortObserved.models;
const recommendedShort = shortObserved.recommended;
const recommendedCapacityShort = shortCapacity.recommended;
const titleApproved = equivalent && titleMaterial && titleAggregate <= currentAggregate * 1.25;
const approved = titleApproved || Boolean(recommendedShort) || Boolean(recommendedCapacityShort);
const action = titleApproved && (recommendedShort || recommendedCapacityShort) ? "materializar_segmentacoes_aprovadas" : recommendedShort || recommendedCapacityShort ? "materializar_particao_url_curta" : titleApproved ? "materializar_segmentacao_titulos" : "preservar_modelo_vigente";
const report = {
  schema_version: 2,
  corpus: { source, books: rows.length, note: "Aferi\xE7\xE3o observada; nenhuma pseudopublica\xE7\xE3o foi restaurada." },
  capacity_projection: {
    range: { observed: books.length, maximum: CAPACITY_PUBLICATIONS, checkpoints: CAPACITY_CHECKPOINTS },
    method: "tokens sequenciais can\xF4nicos adicionais e destinos derivados ciclicamente do corpus real, identificados por sufixo \xFAnico; proje\xE7\xE3o, n\xE3o observa\xE7\xE3o",
    scenarios: Object.fromEntries(Object.entries(shortCapacityScenarios).map(([publications, analysis]) => [publications, { current_short_url: analysis.current, short_url_partitions: analysis.models }]))
  },
  network: NETWORK,
  thresholds: { transfer_reduction: 0.25, first_result_reduction: 0.2, max_extra_requests: 1, max_aggregate_growth: 0.25 },
  current: { aggregate_bytes: currentAggregate, title: metric([rows], 1, rows.length), short_url: shortCurrent },
  short_url_partitions: shortEvaluations,
  title_term_map: { aggregate_bytes: titleAggregate, term_map_bytes: transferBytes(termMap), max_segment_books: Math.max(...Object.values(titleSegments).map((value) => value.length)), scenarios: titleScenarios },
  equivalence: { short_url_resolution: true, title_results_and_order: equivalent },
  decision: {
    approved,
    action,
    short_url: {
      approved: Boolean(recommendedShort || recommendedCapacityShort),
      recommended_prefix_length: (recommendedShort || recommendedCapacityShort)?.prefix_length ?? null,
      basis: recommendedShort ? "corpus_observado" : recommendedCapacityShort ? "capacidade_projetada" : null,
      activation: recommendedShort ? "imediata" : recommendedCapacityShort ? "condicionada ao corpus real vencer os mesmos gates durante o build" : null,
      reasons: recommendedShort || recommendedCapacityShort ? [recommendedShort ? "ganho material comprovado no corpus observado com roteamento direto em uma requisi\xE7\xE3o" : "ganho material comprovado na capacidade projetada com roteamento direto em uma requisi\xE7\xE3o"] : ["nenhuma granularidade venceu simultaneamente os gates por consulta e agregado"]
    },
    title: {
      approved: titleApproved,
      reasons: titleApproved ? ["ganho material comprovado"] : [!titleMaterial && "consultas n\xE3o venceram o gate material", titleAggregate > currentAggregate * 1.25 && "crescimento agregado excessivo"].filter(Boolean)
    }
  }
};
if (process.argv.includes("--write")) {
  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}
`, "utf8");
}
process.stdout.write(`INDEX_BENCHMARK_OK books=${rows.length} source=real equivalent=${equivalent} decision=${report.decision.action}
`);
