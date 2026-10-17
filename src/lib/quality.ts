import jsBudgetJson from "../../quality/js-budget.json";
import lighthouseJson from "../../quality/lighthouse.json";

/**
 * Mesures de référence enregistrées dans quality/ : `npm run budget:record` pour le
 * JavaScript de l'accueil, `npm run lighthouse:record` pour Lighthouse. La page
 * /colophon affiche la dernière mesure enregistrée, celle de la construction.
 */

export type JsBudget = {
  route: string;
  /** Date de la mesure (AAAA-MM-JJ), null tant que rien n'est mesuré. */
  measuredAt: string | null;
  /** Nombre de fichiers JavaScript chargés par la page. */
  scripts: number | null;
  rawBytes: number | null;
  gzipBytes: number | null;
  /** Hausse tolérée par pull request : 0,1 = +10 %. */
  tolerance: number;
};

export const LIGHTHOUSE_CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export type LighthouseCategory = (typeof LIGHTHOUSE_CATEGORIES)[number];

export type LighthouseReport = {
  measuredAt: string | null;
  formFactor: string;
  /** Nombre de passages par page ; le score retenu est la médiane. */
  runs: number;
  /** Scores de 0 à 1, par chemin de page. */
  pages: Record<string, Record<LighthouseCategory, number>>;
};

export const JS_BUDGET: JsBudget = jsBudgetJson;
export const LIGHTHOUSE: LighthouseReport = lighthouseJson;
