/**
 * La Boussole du Fondateur : les Rêves, et la Boîte à projets où chaque projet a un
 * score de faisabilité, un score d'impact, une étape sur le parcours de création en
 * neuf étapes et les activités de la chaîne de valeur ITIL 4 qu'il touche.
 */
export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

/** Le parcours de création compte neuf étapes ; leurs noms sont dans les messages. */
export const ITIL_STEPS = 9;

/** Les six activités de la chaîne de valeur des services d'ITIL 4. */
export const VALUE_CHAIN = [
  "plan",
  "improve",
  "engage",
  "design-transition",
  "obtain-build",
  "deliver-support",
] as const;
export type ValueChainActivity = (typeof VALUE_CHAIN)[number];

/** Échéance d'un rêve. */
export const HORIZONS = ["1Y", "3Y", "10Y", "LIFE"] as const;
export type Horizon = (typeof HORIZONS)[number];

export type ScoredProject = {
  feasibilityScore: number;
  impactScore: number;
  createdAt: Date;
};

/** Priorité d'un projet : faisabilité × impact, de 1 à 25. */
export function priority(project: Pick<ScoredProject, "feasibilityScore" | "impactScore">) {
  return project.feasibilityScore * project.impactScore;
}

/**
 * Les projets les plus prioritaires d'abord ; à priorité égale, l'impact passe avant
 * la faisabilité, puis le plus ancien avant le plus récent.
 */
export function byPriority<T extends ScoredProject>(projects: readonly T[]): T[] {
  return [...projects].sort(
    (a, b) =>
      priority(b) - priority(a) ||
      b.impactScore - a.impactScore ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/** Garde les seules activités connues, sans doublon, dans l'ordre de la chaîne de valeur. */
export function valueChainFrom(values: readonly unknown[]): ValueChainActivity[] {
  return VALUE_CHAIN.filter((activity) => values.includes(activity));
}
