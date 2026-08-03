#!/usr/bin/env node
// JeanCarloEM — https://www.jeancarloem.com — https://github.com/jcempro/egw
// MPL-2.0 — https://www.mozilla.org/MPL/2.0/ — uso sob a Mozilla Public License 2.0.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { assignTokens, canonicalBookSegments, encodeShortCounter } from "./lib/static-books.mjs";

type Row = [string, string];
type Book = { id: string; language: string; title: string };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, ".ia.rules", "state", "contexts", "FT-019", "benchmark.json");
const HISTORICAL_REF = "f240cc3^";
const CAPACITY_PUBLICATIONS = 10_000;
const CAPACITY_CHECKPOINTS = [1_000, 2_500, 5_000, CAPACITY_PUBLICATIONS];
const STOPWORDS = new Set(["a", "an", "and", "as", "da", "das", "de", "do", "dos", "e", "for", "in", "of", "o", "os", "the", "to"]);
const NETWORK = { label: "slow-400kbps-180ms", bytes_per_second: 50_000, rtt_ms: 180 };

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const jsonBytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const transferBytes = (value: unknown) => gzipSync(JSON.stringify(value), { level: 9 }).byteLength;
const latency = (bytes: number, requests: number) => Math.round(requests * NETWORK.rtt_ms + bytes / NETWORK.bytes_per_second * 1000);
const words = (value: string) => normalize(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 2 && !STOPWORDS.has(word));
const sortRows = (rows: Row[]) => [...rows].sort((left, right) => normalize(left[0]).localeCompare(normalize(right[0]), "pt-BR") || left[1].localeCompare(right[1], "en"));
const search = (rows: Row[], query: string) => sortRows(rows.filter(([title]) => normalize(title).includes(normalize(query))));

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true });
}

async function loadRealCorpus(): Promise<{ books: Book[]; source: string }> {
  const live = path.join(ROOT, "dist", "d", "_index", "search.json");
  try {
    const rows = JSON.parse(await readFile(live, "utf8")) as Row[];
    if (rows.length) return { books: rows.map(([title, token], index) => ({ id: `live-books-${index}-${token}`, language: "und", title })), source: "dist/d/_index/search.json" };
  } catch { /* A distribuição atual pode legitimamente não existir antes da ingestão. */ }
  const matches = git(["grep", "-n", "-m", "1", "-E", '"title"[[:space:]]*:', HISTORICAL_REF, "--", "src/data/books/*/metadata.json"]).split(/\r?\n/).filter(Boolean);
  const books = matches.map((match) => {
    const parsed = /^[^:]+:src\/data\/books\/([^/]+)\/metadata\.json:\d+:(.*)$/u.exec(match);
    if (!parsed) throw new Error(`Linha histórica inválida: ${match}`);
    const id = parsed[1];
    const title = JSON.parse(`{${parsed[2].trim().replace(/,$/u, "")}}`).title;
    return { id, language: id.split("-").slice(0, 2).join("-"), title } as Book;
  });
  if (!books.length) throw new Error("Corpus real indisponível para o benchmark");
  return { books, source: `git:${HISTORICAL_REF}:src/data/books/*/metadata.json` };
}

function partition<T>(entries: Array<[string, T]>, length: number): Record<string, Array<[string, T]>> {
  const result: Record<string, Array<[string, T]>> = {};
  for (const entry of entries) (result[entry[0].slice(0, length) || "_"] ||= []).push(entry);
  return result;
}

function metric(payloads: unknown[], requests: number, records: number) {
  const compressed = payloads.reduce((total, payload) => total + transferBytes(payload), 0);
  const memory = payloads.reduce((total, payload) => total + jsonBytes(payload), 0);
  return {
    cold: { bytes: compressed, requests, first_result_ms: latency(compressed, requests) },
    warm: { bytes: 0, requests: 0, first_result_ms: 0 },
    memory_bytes: memory,
    cpu_records_scanned: records,
  };
}

function percentile<T>(values: T[], ratio: number): T {
  assert.ok(values.length > 0, "percentil sem amostras");
  return values[Math.ceil((values.length - 1) * ratio)];
}

function significantPrefixes(title: string): string[] {
  const prefixes = new Set<string>();
  for (const word of words(title)) for (let length = 1; length <= word.length; length += 1) prefixes.add(word.slice(0, length));
  return [...prefixes];
}

function analyzeShortEntries(entries: Array<[string, string]>) {
  const current = metric([entries], 1, entries.length);
  const models = [1, 2].map((length) => {
    const segments = partition(entries, length);
    const manifest = { schema_version: 1, prefix_length: length, segments: Object.keys(segments).sort() };
    const manifestBytes = transferBytes(manifest);
    const aggregate = manifestBytes + Object.values(segments).reduce((total, segment) => total + transferBytes(segment), 0);
    const segmentMetrics = new Map(Object.entries(segments).map(([key, segment]) => {
      for (const [token] of segment) assert.equal(token.slice(0, length), key, `partição curta não resolveu ${token}`);
      return [key, metric([segment], 1, segment.length)];
    }));
    const lookups = entries.map(([token]) => segmentMetrics.get(token.slice(0, length))!).sort((left, right) => left.cold.bytes - right.cold.bytes || left.cpu_records_scanned - right.cpu_records_scanned);
    const lookupDistribution = {
      minimum: lookups[0],
      median: percentile(lookups, 0.50),
      p95: percentile(lookups, 0.95),
      worst_case: lookups.at(-1)!,
    };
    const gates = {
      transfer: lookupDistribution.p95.cold.bytes <= current.cold.bytes * 0.75,
      first_result: lookupDistribution.p95.cold.first_result_ms <= current.cold.first_result_ms * 0.8,
      requests: lookupDistribution.p95.cold.requests <= current.cold.requests,
      aggregate: aggregate <= current.cold.bytes * 1.25,
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
      approved: Object.values(gates).every(Boolean),
    };
  });
  const approvedModels = models.filter((model) => model.approved);
  const recommended = [...approvedModels].sort((left, right) => left.lookup_distribution.p95.cold.first_result_ms - right.lookup_distribution.p95.cold.first_result_ms || left.aggregate_bytes - right.aggregate_bytes)[0] || null;
  return { current, models, recommended };
}

const { books, source } = await loadRealCorpus();
const allocated = assignTokens(books.map((book) => ({ book })));
const rows = sortRows(books.map((book) => [book.title, allocated.assignments.get(book.id)!] as Row));
const shortEntries = books.map((book) => [allocated.assignments.get(book.id)!, `d/${canonicalBookSegments(book).join("/")}/`] as [string, string]);
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

const titleSegments = partition(rows.map((row) => [normalize(row[0])[0] || "_", row] as [string, Row]), 1);
const termMap: Record<string, string[]> = {};
for (const [segment, values] of Object.entries(titleSegments)) for (const [, row] of values) for (const prefix of significantPrefixes(row[0])) {
  const targets = termMap[prefix] ||= [];
  if (!targets.includes(segment)) targets.push(segment);
}
for (const targets of Object.values(termMap)) targets.sort();
const termFrequency = new Map<string, number>();
for (const [title] of rows) for (const word of new Set(words(title).filter((item) => item.length >= 5))) termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
const common = [...termFrequency].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"))[0][0];
const scenarioQueries = { common, incomplete: common.slice(0, 5), worst_case: Object.entries(termMap).filter(([key]) => key.length >= 5).sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0], "en"))[0][0] };
const titleScenarios: Record<string, unknown> = {};
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
assert.equal(equivalent, true, "a segmentação candidata alterou resultados ou ordenação");

const currentAggregate = transferBytes(rows);
const titleAggregate = transferBytes(termMap) + Object.values(titleSegments).reduce((total, segment) => total + transferBytes(segment), 0);
const titleMaterial = Object.values(titleScenarios).every((value: any) => value.segmented.cold.bytes <= value.current.cold.bytes * 0.75 && value.segmented.cold.first_result_ms <= value.current.cold.first_result_ms * 0.8 && value.segmented.cold.requests <= value.current.cold.requests + 1);
const shortCurrent = shortObserved.current;
const shortEvaluations = shortObserved.models;
const recommendedShort = shortObserved.recommended;
const recommendedCapacityShort = shortCapacity.recommended;
const titleApproved = equivalent && titleMaterial && titleAggregate <= currentAggregate * 1.25;
const approved = titleApproved || Boolean(recommendedShort) || Boolean(recommendedCapacityShort);
const action = titleApproved && (recommendedShort || recommendedCapacityShort)
  ? "materializar_segmentacoes_aprovadas"
  : recommendedShort || recommendedCapacityShort
    ? "materializar_particao_url_curta"
    : titleApproved
      ? "materializar_segmentacao_titulos"
      : "preservar_modelo_vigente";

const report = {
  schema_version: 2,
  corpus: { source, books: rows.length, note: "Aferição observada; nenhuma pseudopublicação foi restaurada." },
  capacity_projection: {
    range: { observed: books.length, maximum: CAPACITY_PUBLICATIONS, checkpoints: CAPACITY_CHECKPOINTS },
    method: "tokens sequenciais canônicos adicionais e destinos derivados ciclicamente do corpus real, identificados por sufixo único; projeção, não observação",
    scenarios: Object.fromEntries(Object.entries(shortCapacityScenarios).map(([publications, analysis]) => [publications, { current_short_url: analysis.current, short_url_partitions: analysis.models }])),
  },
  network: NETWORK,
  thresholds: { transfer_reduction: 0.25, first_result_reduction: 0.20, max_extra_requests: 1, max_aggregate_growth: 0.25 },
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
      reasons: recommendedShort || recommendedCapacityShort
        ? [recommendedShort ? "ganho material comprovado no corpus observado com roteamento direto em uma requisição" : "ganho material comprovado na capacidade projetada com roteamento direto em uma requisição"]
        : ["nenhuma granularidade venceu simultaneamente os gates por consulta e agregado"],
    },
    title: {
      approved: titleApproved,
      reasons: titleApproved ? ["ganho material comprovado"] : [!titleMaterial && "consultas não venceram o gate material", titleAggregate > currentAggregate * 1.25 && "crescimento agregado excessivo"].filter(Boolean),
    },
  },
};

if (process.argv.includes("--write")) {
  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
process.stdout.write(`INDEX_BENCHMARK_OK books=${rows.length} source=real equivalent=${equivalent} decision=${report.decision.action}\n`);
