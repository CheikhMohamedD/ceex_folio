/**
 * Score de qualification d'une demande du parcours guidé : un point par critère
 * rempli, de 0 à 4. Il dit dans les Coulisses quelles demandes méritent ton temps
 * en premier ; il ne juge pas le projet.
 */
export const QUALIFICATION_CRITERIA = ["goal", "budget", "deadline", "success"] as const;
export type QualificationCriterion = (typeof QUALIFICATION_CRITERIA)[number];

export type QualificationInput = {
  goal?: string;
  budgetRange?: string;
  deadline?: string;
  successCriterion?: string;
};

/** Un objectif clair tient en une phrase complète au moins. */
export const CLEAR_GOAL_LENGTH = 40;
/** Un critère de réussite dit au moins ce qu'on regardera. */
export const SUCCESS_CRITERION_LENGTH = 15;
/** Réponse « Je ne sais pas encore » au budget et au délai. */
export const UNKNOWN = "unknown";

const filled = (value: string | undefined, length: number) => (value?.trim().length ?? 0) >= length;
const chosen = (value: string | undefined) => Boolean(value) && value !== UNKNOWN;

export function qualify(input: QualificationInput): {
  score: number;
  met: Record<QualificationCriterion, boolean>;
} {
  const met: Record<QualificationCriterion, boolean> = {
    goal: filled(input.goal, CLEAR_GOAL_LENGTH),
    budget: chosen(input.budgetRange),
    deadline: chosen(input.deadline),
    success: filled(input.successCriterion, SUCCESS_CRITERION_LENGTH),
  };
  return { score: Object.values(met).filter(Boolean).length, met };
}
