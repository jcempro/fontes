#!/usr/bin/env node
// JeanCarloEM — https://www.jeancarloem.com — https://github.com/jcempro/egw
// MPL-2.0 — https://www.mozilla.org/MPL/2.0/ — uso sob a Mozilla Public License 2.0.

import assert from "node:assert/strict";
import jsQR from "jsqr";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  assignTokens,
  decodeShortCounter,
  encodeShortCounter,
  SHORT_TOKEN_PATTERN,
} from "./lib/static-books.mjs";

type Book = { id: string; language: string; title: string };
const input = (book: Book) => ({ book });
const entries = (result: ReturnType<typeof assignTokens>) => Object.fromEntries(result.assignments);

const books = [
  input({ id: "es-es-libros-cristo-camina", language: "es-ES", title: "Cristo Camina" }),
  input({ id: "en-us-books-christ-calls", language: "en-US", title: "Christ Calls" }),
  input({ id: "pt-br-livros-caminho-cristo", language: "pt-BR", title: "Caminho a Cristo" }),
];
const first = assignTokens(books, { reservedTokens: ["assets", "d", "index"] });
const second = assignTokens([...books].reverse(), { reservedTokens: ["assets", "d", "index"] });
assert.deepEqual(entries(first), entries(second), "a ordem dos arquivos não pode mudar tokens");
assert.equal(first.assignments.get("pt-br-livros-caminho-cristo"), "cc");
assert.equal(first.assignments.get("en-us-books-christ-calls"), "cc.en");
assert.equal(first.assignments.get("es-es-libros-cristo-camina"), "cc.es");

const sameLanguage = assignTokens([
  input({ id: "pt-br-livros-casa-campo-1", language: "pt-BR", title: "Casa de Campo" }),
  input({ id: "pt-br-livros-casa-campo-2", language: "pt-BR", title: "Casa do Campo" }),
]);
assert.equal(sameLanguage.assignments.get("pt-br-livros-casa-campo-1"), "cc");
assert.equal(sameLanguage.assignments.get("pt-br-livros-casa-campo-2"), "B");

const reserved = assignTokens([
  input({ id: "pt-br-outros-dados", language: "pt-BR", title: "Dados" }),
], { reservedTokens: ["D"], tombstones: ["B"], previousOwners: { C: "livro-removido" } });
assert.equal(reserved.assignments.get("pt-br-outros-dados"), "E");
for (let counter = 1; counter < 4096; counter += 1) assert.equal(decodeShortCounter(encodeShortCounter(counter)), counter);
for (const token of [...first.assignments.values(), ...sameLanguage.assignments.values(), ...reserved.assignments.values()]) assert.match(token, SHORT_TOKEN_PATTERN);

const target = "https://f.jcem.pro/cc.en";
const svg = await QRCode.toString(target, { type: "svg", errorCorrectionLevel: "H", margin: 4, width: 1024 });
const { data, info } = await sharp(Buffer.from(svg)).resize(512, 512, { fit: "fill", kernel: "nearest" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height)?.data, target);

process.stdout.write(`SHORT_URL_OK books=${books.length} base=cc qualifiers=en,es counter_roundtrips=4095 qr=decoded\n`);
