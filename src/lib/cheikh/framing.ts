/**
 * Le générateur de prompt de Cheikh 2.0 : six champs, un score de clarté et le prompt
 * à coller dans Claude. Les mêmes champs nourrissent le parcours guidé du contact.
 */
export const FRAMING_FIELDS = [
  "goal",
  "problem",
  "audience",
  "context",
  "constraints",
  "successCriterion",
] as const;
export type FramingField = (typeof FRAMING_FIELDS)[number];
export type FramingValues = Record<FramingField, string>;

export const EMPTY_FRAMING: FramingValues = {
  goal: "",
  problem: "",
  audience: "",
  context: "",
  constraints: "",
  successCriterion: "",
};

/** Clarté de la demande : le nombre de champs remplis, sur six. */
export function clarity(values: FramingValues): number {
  return FRAMING_FIELDS.filter((field) => values[field].trim() !== "").length;
}

/** Couleur du score, comme dans l'outil d'origine : 6 sur 6, au moins 4, ou moins. */
export function clarityLevel(score: number): "ok" | "mid" | "bad" {
  if (score === FRAMING_FIELDS.length) return "ok";
  return score >= 4 ? "mid" : "bad";
}

export type PromptCopy = {
  /** Étiquette de chaque champ dans le prompt (OBJECTIF, POURQUOI…). */
  labels: Record<FramingField, string>;
  /** Ce qui remplace un champ vide. */
  missing: string;
  /** Les consignes qui terminent le prompt. */
  closing: readonly string[];
};

export function buildPrompt(values: FramingValues, copy: PromptCopy): string {
  const lines = FRAMING_FIELDS.map(
    (field) => `${copy.labels[field]} : ${values[field].trim() || copy.missing}`,
  );
  return [...lines, "", ...copy.closing].join("\n");
}

/** Nom de fichier du dossier : cadrage-2026-10-17-ecran-de-saisie-de-la.pdf. */
export function framingFileName(goal: string, date: Date): string {
  const slug =
    goal
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 5)
      .join("-") || "demande";
  return `cadrage-${date.toISOString().slice(0, 10)}-${slug}.pdf`;
}
