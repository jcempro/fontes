#!/usr/bin/env node
// JeanCarloEM — https://www.jeancarloem.com — https://github.com/jcempro/egw
// MPL-2.0 — https://www.mozilla.org/MPL/2.0/ — uso sob a Mozilla Public License 2.0.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, parseDocument } from "yaml";

type Diagnostic = { file: string; line: number; message: string };
type WorkflowStep = { uses?: unknown; run?: unknown; with?: Record<string, unknown> };
type WorkflowJob = { if?: unknown; "runs-on"?: unknown; "timeout-minutes"?: unknown; steps?: unknown };
type Workflow = { name?: unknown; on?: unknown; permissions?: unknown; jobs?: unknown };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_ROOT = path.join(ROOT, ".github", "workflows");
const PERMISSIONS = new Set(["read", "write", "none"]);

function lineFor(source: string, key: string): number {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const index = source.search(new RegExp(`^\\s*${escaped}\\s*:`, "m"));
  return index < 0 ? 1 : source.slice(0, index).split("\n").length;
}

function diagnostic(file: string, source: string, key: string, message: string): Diagnostic {
  return { file, line: lineFor(source, key), message };
}

function validateExpressions(file: string, source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    if ((line.match(/\$\{\{/gu) || []).length !== (line.match(/\}\}/gu) || []).length) diagnostics.push({ file, line: index + 1, message: "expressão GitHub Actions não balanceada" });
  }
  return diagnostics;
}

function validateWorkflow(file: string, source: string, value: Workflow): Diagnostic[] {
  const diagnostics = validateExpressions(file, source);
  if (typeof value.name !== "string" || !value.name.trim()) diagnostics.push(diagnostic(file, source, "name", "name deve ser texto não vazio"));
  if (!value.on || typeof value.on !== "object" || Array.isArray(value.on)) diagnostics.push(diagnostic(file, source, "on", "on deve declarar ao menos um evento"));
  if (!value.permissions || typeof value.permissions !== "object" || Array.isArray(value.permissions)) diagnostics.push(diagnostic(file, source, "permissions", "permissions deve ser mapa explícito"));
  else for (const [permission, access] of Object.entries(value.permissions as Record<string, unknown>)) if (typeof access !== "string" || !PERMISSIONS.has(access)) diagnostics.push(diagnostic(file, source, permission, `permissão inválida: ${permission}`));
  if (!value.jobs || typeof value.jobs !== "object" || Array.isArray(value.jobs) || !Object.keys(value.jobs).length) {
    diagnostics.push(diagnostic(file, source, "jobs", "jobs deve ser mapa não vazio"));
    return diagnostics;
  }
  for (const [jobName, rawJob] of Object.entries(value.jobs as Record<string, unknown>)) {
    if (!rawJob || typeof rawJob !== "object" || Array.isArray(rawJob)) { diagnostics.push(diagnostic(file, source, jobName, `job inválido: ${jobName}`)); continue; }
    const job = rawJob as WorkflowJob;
    if (typeof job["runs-on"] !== "string" || !job["runs-on"].trim()) diagnostics.push(diagnostic(file, source, "runs-on", `${jobName}.runs-on deve ser texto`));
    if (job.if !== undefined && typeof job.if !== "string") diagnostics.push(diagnostic(file, source, "if", `${jobName}.if deve ser expressão textual`));
    if (job["timeout-minutes"] !== undefined && (!Number.isInteger(job["timeout-minutes"]) || Number(job["timeout-minutes"]) < 1)) diagnostics.push(diagnostic(file, source, "timeout-minutes", `${jobName}.timeout-minutes deve ser inteiro positivo`));
    if (!Array.isArray(job.steps) || !job.steps.length) { diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps deve ser lista não vazia`)); continue; }
    let setupNodeVersion = 0;
    let invokesNode = false;
    for (const [stepIndex, rawStep] of job.steps.entries()) {
      if (!rawStep || typeof rawStep !== "object" || Array.isArray(rawStep)) { diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps[${stepIndex}] inválido`)); continue; }
      const step = rawStep as WorkflowStep;
      const hasUses = typeof step.uses === "string" && Boolean(step.uses.trim());
      const hasRun = typeof step.run === "string" && Boolean(step.run.trim());
      if (hasUses === hasRun) diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps[${stepIndex}] deve declarar exatamente uses ou run`));
      if (hasUses && !/^[^\s@]+@(?:v\d+|[a-f0-9]{40})$/iu.test(String(step.uses))) diagnostics.push(diagnostic(file, source, "uses", `${jobName}.steps[${stepIndex}].uses deve fixar versão maior ou commit`));
      if (hasUses && String(step.uses).startsWith("actions/setup-node@")) setupNodeVersion = Number.parseInt(String(step.with?.["node-version"] || "0"), 10);
      if (hasRun && /(?:^|\s)(?:node|npm|npx)(?:\s|$)/u.test(String(step.run))) invokesNode = true;
    }
    if (invokesNode && setupNodeVersion < 24) diagnostics.push(diagnostic(file, source, "node-version", `${jobName} executa Node/npm e deve materializar Node.js 24+`));
  }
  return diagnostics;
}

export function inspectWorkflow(file: string, source: string): Diagnostic[] {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, { lineCounter, prettyErrors: false, strict: true, uniqueKeys: true });
  const diagnostics: Diagnostic[] = document.errors.map((error) => ({ file, line: lineCounter.linePos(error.pos[0] ?? 0).line, message: error.message.replace(/\s+/gu, " ").trim() }));
  if (diagnostics.length) return diagnostics;
  const value = document.toJS({ maxAliasCount: 0 }) as Workflow;
  if (!value || typeof value !== "object" || Array.isArray(value)) return [{ file, line: 1, message: "raiz do workflow deve ser mapa" }];
  return validateWorkflow(file, source, value);
}

async function workflowFiles(): Promise<string[]> {
  const entries = await readdir(WORKFLOWS_ROOT, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && /\.ya?ml$/iu.test(entry.name)).map((entry) => path.join(WORKFLOWS_ROOT, entry.name)).sort((left, right) => left.localeCompare(right, "en"));
}

function selfTest(): void {
  const valid = "name: Teste\non:\n  push:\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 24\n      - run: npm test\n";
  const invalid = "name: Teste\non:\n  issues:\njobs:\n  test:\n    if: contains(github.event.labels.*.name, 'fonte: aguardando')\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n";
  if (inspectWorkflow("valid.yml", valid).length) throw new Error("fixture válida rejeitada");
  if (!inspectWorkflow("invalid.yml", invalid).some((entry) => entry.line === 6)) throw new Error("fixture de escalar inválido não apontou linha 6");
}

async function main(): Promise<void> {
  const useSelfTest = process.argv.includes("--self-test");
  if (useSelfTest) selfTest();
  const files = await workflowFiles();
  const diagnostics: Diagnostic[] = [];
  for (const file of files) diagnostics.push(...inspectWorkflow(path.relative(ROOT, file).split(path.sep).join("/"), await readFile(file, "utf8")));
  if (diagnostics.length) {
    for (const entry of diagnostics) process.stderr.write(`${entry.file}:${entry.line}: ${entry.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`WORKFLOW_OK files=${files.length} parser=yaml semantic=github-actions/v1 self_test=${useSelfTest}\n`);
}

main().catch((error) => { process.stderr.write(`WORKFLOW_ERRO: ${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
