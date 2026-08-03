#!/usr/bin/env node
// JeanCarloEM — https://www.jeancarloem.com — https://github.com/jcempro/egw
// MPL-2.0 — https://www.mozilla.org/MPL/2.0/ — uso sob a Mozilla Public License 2.0.

import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import * as sass from "sass";
import { materializeBooks, readShortUrlState, seedPackageCache } from "./lib/static-books.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = path.join(ROOT, "src");
const DIST_ROOT = path.join(ROOT, "dist");
const PACKAGE_CACHE_ROOT = path.join(ROOT, ".agents", "cache", "packages");
const QR_CACHE_ROOT = path.join(ROOT, ".agents", "cache", "qr");
const BUILD_CONFIG_PATH = path.join(SOURCE_ROOT, "config", "build.json");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function assertPublicSource() {
  for (const entry of ["404.html", "assets", "data"]) {
    if (!(await exists(path.join(SOURCE_ROOT, entry)))) throw new Error(`Fonte pública ausente: src/${entry}`);
  }
}

async function listFiles(directory) {
  const files = [];
  async function visit(current) {
    for (const entry of (await readdir(current, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.push(target);
    }
  }
  await visit(directory);
  return files;
}

async function main() {
  await assertPublicSource();
  const buildConfig = JSON.parse(await readFile(BUILD_CONFIG_PATH, "utf8"));
  const previousShortUrlState = await readShortUrlState(DIST_ROOT);
  const seededPackages = await seedPackageCache(DIST_ROOT, PACKAGE_CACHE_ROOT);
  if (path.dirname(DIST_ROOT) !== ROOT || path.basename(DIST_ROOT) !== "dist") throw new Error("Destino de build inválido");
  await rm(DIST_ROOT, { force: true, recursive: true });
  await mkdir(DIST_ROOT, { recursive: true });
  await cp(path.join(SOURCE_ROOT, "404.html"), path.join(DIST_ROOT, "404.html"));
  await cp(path.join(SOURCE_ROOT, "404.html"), path.join(DIST_ROOT, "index.html"));
  await cp(path.join(SOURCE_ROOT, "assets"), path.join(DIST_ROOT, "assets"), { recursive: true, filter: (source) => !source.includes(`${path.sep}assets${path.sep}books`) });
  await mkdir(path.join(DIST_ROOT, "assets"), { recursive: true });
  await esbuild({ entryPoints: [path.join(SOURCE_ROOT, "app", "app.tsx")], outfile: path.join(DIST_ROOT, "assets", "app.js"), bundle: true, minify: true, treeShaking: true, target: ["es2020"], jsxFactory: "h", jsxFragment: "Fragment", banner: { js: `/*! ${buildConfig.header} */` }, legalComments: "inline" });
  const compiledStyle = sass.compile(path.join(SOURCE_ROOT, "app", "app.scss"), { style: "compressed" }).css;
  await writeFile(path.join(DIST_ROOT, "assets", "app.css"), `/*! ${buildConfig.header} */\n${compiledStyle}`, "utf8");
  await mkdir(path.join(DIST_ROOT, "d", "_index"), { recursive: true });
  await writeFile(path.join(DIST_ROOT, "d", "_index", "config.json"), `${JSON.stringify({
    schema_version: 1,
    short_url_origin: buildConfig.short_url_origin,
    search: buildConfig.search,
    short_urls: buildConfig.short_urls,
    qr_code: {
      asset_name: buildConfig.qr_code?.asset_name,
      error_correction_level: buildConfig.qr_code?.error_correction_level,
    },
  })}\n`, "utf8");
  const generated = await materializeBooks({ sourceRoot: SOURCE_ROOT, distRoot: DIST_ROOT, cacheRoot: PACKAGE_CACHE_ROOT, qrCacheRoot: QR_CACHE_ROOT, buildConfig, previousShortUrlState });
  await writeFile(path.join(DIST_ROOT, ".nojekyll"), "", "utf8");
  const leaked = (await listFiles(DIST_ROOT)).find((file) => path.relative(DIST_ROOT, file).split(path.sep).includes("src"));
  if (leaked) throw new Error(`Prefixo src/ exposto no artefato: ${path.relative(DIST_ROOT, leaked)}`);
  const files = await listFiles(DIST_ROOT);
  const publicEntries = await Promise.all(files.map(async (file) => ({ file, relative: path.relative(DIST_ROOT, file).split(path.sep).join("/"), size: (await stat(file)).size })));
  const bookPattern = /^d\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/(metadata\.json|cover\.png|source\.(?:pdf|epub)|[a-z0-9]+(?:-[a-z0-9]+)*\.7z)$/;
  const bookEntries = publicEntries.filter((entry) => bookPattern.test(entry.relative));
  const forbidden = publicEntries.find((entry) => /^d\//.test(entry.relative) && /\.partial$/i.test(entry.relative));
  const metadataCount = bookEntries.filter((entry) => entry.relative.endsWith("/metadata.json")).length;
  const coverCount = bookEntries.filter((entry) => entry.relative.endsWith("/cover.png")).length;
  const packageCount = bookEntries.filter((entry) => entry.relative.endsWith(".7z")).length;
  const originalCount = bookEntries.filter((entry) => /\.(pdf|epub)$/i.test(entry.relative)).length;
  if (forbidden) throw new Error(`Artefato público proibido: ${forbidden.relative}`);
  if (metadataCount !== generated.books || coverCount !== generated.books || packageCount !== generated.assets || originalCount !== 0) throw new Error(`Árvore incompleta: metadata=${metadataCount} capas=${coverCount} pacotes=${packageCount} originais=${originalCount}`);
  const oversized = publicEntries.find((entry) => entry.size > 100_000_000);
  if (oversized) throw new Error(`Arquivo público excede 100 MB: ${oversized.relative}`);
  const totalSize = publicEntries.reduce((sum, entry) => sum + entry.size, 0);
  const pageLimit = Number.parseInt(process.env.PAGE_LIMIT_BYTES || String(buildConfig.page_limit_bytes), 10);
  if (!Number.isSafeInteger(pageLimit) || pageLimit <= 0) throw new Error("PAGE_LIMIT_BYTES inválido");
  if (totalSize > pageLimit) throw new Error(`Artefato excede limite configurado: ${totalSize} > ${pageLimit}`);
  process.stdout.write(`BUILD: livros=${generated.books} assets=${generated.assets} busca=${generated.searchItems} cache_semeado=${seededPackages} bytes=${totalSize} arquivos=${files.length} root=dist/\n`);
}

main().catch((error) => {
  process.stderr.write(`ERRO: ${error.message}\n`);
  process.exitCode = 1;
});
