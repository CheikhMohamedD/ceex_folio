/**
 * La feuille de route « 30 jours pour passer en 2.0 » : quatre semaines, trois tâches
 * par semaine. Ces douze tâches sont créées en base à la première ouverture ; tu peux
 * ensuite les cocher depuis n'importe quel appareil.
 */
export const ROADMAP_WEEKS = 4;

export const DEFAULT_ROADMAP: ReadonlyArray<{ week: number; label: string }> = [
  { week: 1, label: "Coller les nouvelles instructions dans les réglages de Claude" },
  { week: 1, label: "Faire 5 demandes avec le générateur de prompt" },
  { week: 1, label: "Répondre à chaque question de Claude, sans exception" },
  { week: 2, label: "Passer chaque projet ouvert dans le sas" },
  { week: 2, label: "Garder un seul projet actif, garer tous les autres" },
  { week: 2, label: "Écrire en une phrase : utilisateur, problème, critère de réussite" },
  { week: 3, label: "Couper le périmètre jusqu'à ce qu'il tienne en 7 jours" },
  { week: 3, label: "Mettre la version en ligne ou sur un vrai téléphone" },
  { week: 3, label: "La donner à une vraie personne et l'observer sans aider" },
  { week: 4, label: "Recueillir 3 retours précis d'utilisateurs" },
  { week: 4, label: "Faire la rétro : ce qui a marché, ce qui a bloqué" },
  { week: 4, label: "Décider la v2.1 : continuer, pivoter ou arrêter" },
];

export type RoadmapItem = { id: string; week: number; label: string; done: boolean };

export type RoadmapProgress = {
  done: number;
  total: number;
  weeks: Array<{ week: number; done: number; total: number }>;
};

export function roadmapProgress(tasks: readonly RoadmapItem[]): RoadmapProgress {
  const weeks = Array.from({ length: ROADMAP_WEEKS }, (_, index) => {
    const ofWeek = tasks.filter((task) => task.week === index + 1);
    return {
      week: index + 1,
      done: ofWeek.filter((task) => task.done).length,
      total: ofWeek.length,
    };
  });
  return { done: tasks.filter((task) => task.done).length, total: tasks.length, weeks };
}

/** Les prochaines tâches à cocher, dans l'ordre de la feuille de route. */
export function nextTasks<T extends RoadmapItem>(tasks: readonly T[], count = 3): T[] {
  return tasks.filter((task) => !task.done).slice(0, count);
}
