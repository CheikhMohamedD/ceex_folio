#!/usr/bin/env node
/**
 * Enregistre les scores Lighthouse de la dernière exécution (`npm run lighthouse`)
 * dans quality/lighthouse.json, que la page /colophon affiche.
 * Pour chaque page, on garde le passage représentatif choisi par Lighthouse CI
 * (la médiane des passages).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".lighthouseci/manifest.json");
const outputPath = path.join(root, "quality/lighthouse.json");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  console.error("Aucun résultat dans .lighthouseci : lance d'abord npm run lighthouse.");
  process.exit(1);
}

const pages = {};
const runsPerPage = {};
for (const run of manifest) {
  const pathname = new URL(run.url).pathname;
  runsPerPage[pathname] = (runsPerPage[pathname] ?? 0) + 1;
  if (!run.isRepresentativeRun) continue;
  pages[pathname] = Object.fromEntries(
    CATEGORIES.map((category) => [category, Number(run.summary[category])]),
  );
}

const report = {
  measuredAt: new Date().toISOString().slice(0, 10),
  formFactor: "mobile",
  runs: Math.min(...Object.values(runsPerPage)),
  pages,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

for (const [pathname, scores] of Object.entries(pages)) {
  const line = CATEGORIES.map((category) => `${category} ${Math.round(scores[category] * 100)}`);
  console.log(`${pathname} : ${line.join(" · ")}`);
}
console.log("Scores enregistrés dans quality/lighthouse.json.");
