#!/usr/bin/env node
// Gerado de scripts/validate-workflows.ts; Node 24+; nao editar.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, parseDocument } from "yaml";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_ROOT = path.join(ROOT, ".github", "workflows");
const PERMISSIONS = /* @__PURE__ */ new Set(["read", "write", "none"]);
function lineFor(source, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const index = source.search(new RegExp(`^\\s*${escaped}\\s*:`, "m"));
  return index < 0 ? 1 : source.slice(0, index).split("\n").length;
}
function diagnostic(file, source, key, message) {
  return { file, line: lineFor(source, key), message };
}
function validateExpressions(file, source) {
  const diagnostics = [];
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    if ((line.match(/\$\{\{/gu) || []).length !== (line.match(/\}\}/gu) || []).length) diagnostics.push({ file, line: index + 1, message: "express\xE3o GitHub Actions n\xE3o balanceada" });
  }
  return diagnostics;
}
function validateWorkflow(file, source, value) {
  const diagnostics = validateExpressions(file, source);
  if (typeof value.name !== "string" || !value.name.trim()) diagnostics.push(diagnostic(file, source, "name", "name deve ser texto n\xE3o vazio"));
  if (!value.on || typeof value.on !== "object" || Array.isArray(value.on)) diagnostics.push(diagnostic(file, source, "on", "on deve declarar ao menos um evento"));
  if (!value.permissions || typeof value.permissions !== "object" || Array.isArray(value.permissions)) diagnostics.push(diagnostic(file, source, "permissions", "permissions deve ser mapa expl\xEDcito"));
  else for (const [permission, access] of Object.entries(value.permissions)) if (typeof access !== "string" || !PERMISSIONS.has(access)) diagnostics.push(diagnostic(file, source, permission, `permiss\xE3o inv\xE1lida: ${permission}`));
  if (!value.jobs || typeof value.jobs !== "object" || Array.isArray(value.jobs) || !Object.keys(value.jobs).length) {
    diagnostics.push(diagnostic(file, source, "jobs", "jobs deve ser mapa n\xE3o vazio"));
    return diagnostics;
  }
  for (const [jobName, rawJob] of Object.entries(value.jobs)) {
    if (!rawJob || typeof rawJob !== "object" || Array.isArray(rawJob)) {
      diagnostics.push(diagnostic(file, source, jobName, `job inv\xE1lido: ${jobName}`));
      continue;
    }
    const job = rawJob;
    if (typeof job["runs-on"] !== "string" || !job["runs-on"].trim()) diagnostics.push(diagnostic(file, source, "runs-on", `${jobName}.runs-on deve ser texto`));
    if (job.if !== void 0 && typeof job.if !== "string") diagnostics.push(diagnostic(file, source, "if", `${jobName}.if deve ser express\xE3o textual`));
    if (job["timeout-minutes"] !== void 0 && (!Number.isInteger(job["timeout-minutes"]) || Number(job["timeout-minutes"]) < 1)) diagnostics.push(diagnostic(file, source, "timeout-minutes", `${jobName}.timeout-minutes deve ser inteiro positivo`));
    if (!Array.isArray(job.steps) || !job.steps.length) {
      diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps deve ser lista n\xE3o vazia`));
      continue;
    }
    let setupNodeVersion = 0;
    let invokesNode = false;
    for (const [stepIndex, rawStep] of job.steps.entries()) {
      if (!rawStep || typeof rawStep !== "object" || Array.isArray(rawStep)) {
        diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps[${stepIndex}] inv\xE1lido`));
        continue;
      }
      const step = rawStep;
      const hasUses = typeof step.uses === "string" && Boolean(step.uses.trim());
      const hasRun = typeof step.run === "string" && Boolean(step.run.trim());
      if (hasUses === hasRun) diagnostics.push(diagnostic(file, source, "steps", `${jobName}.steps[${stepIndex}] deve declarar exatamente uses ou run`));
      if (hasUses && !/^[^\s@]+@(?:v\d+|[a-f0-9]{40})$/iu.test(String(step.uses))) diagnostics.push(diagnostic(file, source, "uses", `${jobName}.steps[${stepIndex}].uses deve fixar vers\xE3o maior ou commit`));
      if (hasUses && String(step.uses).startsWith("actions/setup-node@")) setupNodeVersion = Number.parseInt(String(step.with?.["node-version"] || "0"), 10);
      if (hasRun && /(?:^|\s)(?:node|npm|npx)(?:\s|$)/u.test(String(step.run))) invokesNode = true;
    }
    if (invokesNode && setupNodeVersion < 24) diagnostics.push(diagnostic(file, source, "node-version", `${jobName} executa Node/npm e deve materializar Node.js 24+`));
  }
  return diagnostics;
}
function inspectWorkflow(file, source) {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, { lineCounter, prettyErrors: false, strict: true, uniqueKeys: true });
  const diagnostics = document.errors.map((error) => ({ file, line: lineCounter.linePos(error.pos[0] ?? 0).line, message: error.message.replace(/\s+/gu, " ").trim() }));
  if (diagnostics.length) return diagnostics;
  const value = document.toJS({ maxAliasCount: 0 });
  if (!value || typeof value !== "object" || Array.isArray(value)) return [{ file, line: 1, message: "raiz do workflow deve ser mapa" }];
  return validateWorkflow(file, source, value);
}
async function workflowFiles() {
  const entries = await readdir(WORKFLOWS_ROOT, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && /\.ya?ml$/iu.test(entry.name)).map((entry) => path.join(WORKFLOWS_ROOT, entry.name)).sort((left, right) => left.localeCompare(right, "en"));
}
function selfTest() {
  const valid = "name: Teste\non:\n  push:\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 24\n      - run: npm test\n";
  const invalid = "name: Teste\non:\n  issues:\njobs:\n  test:\n    if: contains(github.event.labels.*.name, 'fonte: aguardando')\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n";
  if (inspectWorkflow("valid.yml", valid).length) throw new Error("fixture v\xE1lida rejeitada");
  if (!inspectWorkflow("invalid.yml", invalid).some((entry) => entry.line === 6)) throw new Error("fixture de escalar inv\xE1lido n\xE3o apontou linha 6");
}
async function main() {
  const useSelfTest = process.argv.includes("--self-test");
  if (useSelfTest) selfTest();
  const files = await workflowFiles();
  const diagnostics = [];
  for (const file of files) diagnostics.push(...inspectWorkflow(path.relative(ROOT, file).split(path.sep).join("/"), await readFile(file, "utf8")));
  if (diagnostics.length) {
    for (const entry of diagnostics) process.stderr.write(`${entry.file}:${entry.line}: ${entry.message}
`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`WORKFLOW_OK files=${files.length} parser=yaml semantic=github-actions/v1 self_test=${useSelfTest}
`);
}
main().catch((error) => {
  process.stderr.write(`WORKFLOW_ERRO: ${error instanceof Error ? error.message : String(error)}
`);
  process.exitCode = 1;
});
export {
  inspectWorkflow
};
