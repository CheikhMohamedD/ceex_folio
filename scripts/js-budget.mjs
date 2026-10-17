#!/usr/bin/env node
/**
 * Budget JavaScript de l'accueil.
 *
 *   npm run budget          compare la construction actuelle à la mesure de référence
 *   npm run budget:record   enregistre la mesure actuelle comme référence
 *
 * On mesure les fichiers JavaScript que la page d'accueil générée charge (balises
 * <script src>, hors polyfills noModule ignorés par les navigateurs récents), compressés
 * en gzip. Les scripts inline (thème, données de rendu) sont affichés à titre indicatif.
 * À lancer après `npm run build`.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const htmlPath = path.join(root, ".next/server/app/index.html");
const budgetPath = path.join(root, "quality/js-budget.json");
const record = process.argv.includes("--record");

const kilobytes = (bytes) =>
  `${(bytes / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko`;

let html;
try {
  html = await readFile(htmlPath, "utf8");
} catch {
  console.error("Page d'accueil générée introuvable : lance d'abord npm run build.");
  process.exit(1);
}

const sources = [
  ...new Set(
    [...html.matchAll(/<script\b([^>]*)>/gi)]
      .map((match) => match[1] ?? "")
      .filter((attributes) => !/\bnomodule\b/i.test(attributes))
      .map((attributes) => /\bsrc="([^"]+)"/i.exec(attributes)?.[1])
      .filter((src) => src?.startsWith("/_next/static/")),
  ),
];

let rawBytes = 0;
let gzipBytes = 0;
for (const src of sources) {
  const file = path.join(root, ".next", src.replace(/^\/_next\//, "").split("?")[0]);
  const content = await readFile(file);
  rawBytes += content.length;
  gzipBytes += gzipSync(content, { level: 9 }).length;
}

const inlineBytes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => Buffer.byteLength(match[1] ?? ""))
  .reduce((sum, bytes) => sum + bytes, 0);

console.log(
  `Accueil : ${sources.length} fichiers JavaScript, ${kilobytes(rawBytes)} bruts, ` +
    `${kilobytes(gzipBytes)} compressés. Scripts inline : ${kilobytes(inlineBytes)}.`,
);

const budget = JSON.parse(await readFile(budgetPath, "utf8"));

if (record) {
  const measure = {
    ...budget,
    measuredAt: new Date().toISOString().slice(0, 10),
    scripts: sources.length,
    rawBytes,
    gzipBytes,
  };
  await writeFile(budgetPath, `${JSON.stringify(measure, null, 2)}\n`);
  console.log("Mesure de référence enregistrée dans quality/js-budget.json.");
  process.exit(0);
}

if (budget.gzipBytes == null) {
  console.warn("Aucune mesure de référence : lance npm run budget:record.");
  process.exit(0);
}

const limit = Math.round(budget.gzipBytes * (1 + budget.tolerance));
if (gzipBytes > limit) {
  console.error(
    `Budget dépassé : ${kilobytes(gzipBytes)} pour ${kilobytes(limit)} permis ` +
      `(référence de ${kilobytes(budget.gzipBytes)} du ${budget.measuredAt}, +${budget.tolerance * 100} %).`,
  );
  process.exit(1);
}

console.log(`Dans le budget : ${kilobytes(gzipBytes)} sur ${kilobytes(limit)} permis.`);
