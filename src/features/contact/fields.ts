/**
 * Champs et règles des deux portes, sans dépendance : les formulaires les lisent dès le
 * premier affichage (longueurs maximales, listes de choix), tandis que le schéma Zod
 * (schema.ts) n'est chargé côté client qu'au premier focus dans un formulaire.
 * Les longueurs suivent les colonnes de la base.
 */
export const LIMITS = {
  name: 80,
  email: 254,
  whatsapp: 30,
  message: 2000,
  goal: 600,
  problem: 600,
  audience: 400,
  context: 400,
  constraints: 400,
  successCriterion: 400,
} as const;

export const MESSAGE_MIN = 10;

/** Nom du champ piège, caché aux visiteurs et aux lecteurs d'écran. */
export const HONEYPOT = "website";
/** Posé par le parcours guidé une fois hydraté : il affiche lui-même la confirmation. */
export const ENHANCED = "enhanced";

export const PROJECT_TYPES = ["site", "mobile", "tool", "identity", "advice"] as const;
/** Fourchettes en FCFA, à confirmer (questions ouvertes de la doc d'architecture). */
export const BUDGET_RANGES = ["lt500k", "500k-2m", "2m-5m", "gt5m", "unknown"] as const;
export const DEADLINES = ["month", "quarter", "half", "unknown"] as const;

export type ContactErrorKey =
  "required" | "tooShort" | "tooLong" | "email" | "whatsapp" | "contactRequired" | "choice";

export const DIRECT_FIELDS = ["name", "email", "whatsapp", "message"] as const;
export type DirectField = (typeof DIRECT_FIELDS)[number];

export const GUIDED_FIELD_NAMES = [
  "projectType",
  "goal",
  "problem",
  "audience",
  "context",
  "constraints",
  "budgetRange",
  "deadline",
  "successCriterion",
  "name",
  "email",
  "whatsapp",
] as const;
export type GuidedField = (typeof GUIDED_FIELD_NAMES)[number];

/** Les 9 étapes du parcours guidé, une question par écran, dans l'ordre de la doc. */
export const GUIDED_STEPS = [
  { id: "type", fields: ["projectType"] },
  { id: "goal", fields: ["goal", "problem"] },
  { id: "audience", fields: ["audience"] },
  { id: "context", fields: ["context"] },
  { id: "constraints", fields: ["constraints"] },
  { id: "budget", fields: ["budgetRange"] },
  { id: "deadline", fields: ["deadline"] },
  { id: "success", fields: ["successCriterion"] },
  { id: "contact", fields: ["name", "email", "whatsapp"] },
] as const satisfies readonly { id: string; fields: readonly GuidedField[] }[];

export type GuidedStepId = (typeof GUIDED_STEPS)[number]["id"];
export const GUIDED_FIELDS = GUIDED_STEPS.flatMap((step) => step.fields);

export type FieldErrors<Field extends string> = Partial<Record<Field, ContactErrorKey>>;

/** Valeurs texte d'un formulaire : une chaîne pour chaque champ, vide s'il manque. */
export function formValues<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<Field, string>;
}
