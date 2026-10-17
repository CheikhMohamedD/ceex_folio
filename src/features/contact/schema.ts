import * as z from "zod/mini";
import {
  BUDGET_RANGES,
  DEADLINES,
  LIMITS,
  MESSAGE_MIN,
  PROJECT_TYPES,
  type ContactErrorKey,
  type DirectField,
  type FieldErrors,
  type GuidedField,
} from "./fields";

/**
 * Schémas des deux portes, partagés par les formulaires (validation à l'envoi) et par
 * les Server Actions (validation qui fait foi). Les messages d'erreur sont des clés de
 * traduction : contact.errors.<clé>.
 *
 * Zod Mini, et chargé à la demande côté client : le formulaire direct vit sur
 * l'accueil, dont le JavaScript initial reste ainsi dans son budget.
 */
const text = (max: number) => z.string().check(z.trim(), z.maxLength(max, "tooLong"));
const required = (max: number) => text(max).check(z.minLength(1, "required"));
/** Champ facultatif : une chaîne vide devient undefined. */
const optional = (max: number) =>
  z.pipe(
    text(max),
    z.transform((value) => value || undefined),
  );
const choice = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: "choice" });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const whatsappPattern = /^\+?[\d\s().-]+$/;
const digitCount = (value: string) => value.replace(/\D/g, "").length;

const contactFields = {
  name: required(LIMITS.name),
  email: optional(LIMITS.email).check(
    z.refine((value) => !value || emailPattern.test(value), "email"),
  ),
  whatsapp: optional(LIMITS.whatsapp).check(
    z.refine(
      (value) =>
        !value ||
        (whatsappPattern.test(value) && digitCount(value) >= 8 && digitCount(value) <= 15),
      "whatsapp",
    ),
  ),
};

/**
 * Un moyen de répondre au moins : l'email ou le numéro WhatsApp. Vérifié même quand
 * d'autres champs sont en erreur, pour tout signaler d'un coup.
 */
function requireContact<T extends { email?: string; whatsapp?: string }>() {
  return z.refine<T>((value) => Boolean(value.email || value.whatsapp), {
    message: "contactRequired",
    path: ["email"],
    when: (payload) => typeof payload.value === "object" && payload.value !== null,
  });
}

export const directRequestSchema = z
  .object({
    ...contactFields,
    message: required(LIMITS.message).check(z.minLength(MESSAGE_MIN, "tooShort")),
  })
  .check(requireContact());

export const guidedRequestSchema = z
  .object({
    projectType: choice(PROJECT_TYPES),
    goal: required(LIMITS.goal),
    problem: optional(LIMITS.problem),
    audience: required(LIMITS.audience),
    context: optional(LIMITS.context),
    constraints: optional(LIMITS.constraints),
    budgetRange: choice(BUDGET_RANGES),
    deadline: choice(DEADLINES),
    successCriterion: optional(LIMITS.successCriterion),
    ...contactFields,
  })
  .check(requireContact());

export type DirectRequest = z.output<typeof directRequestSchema>;
export type GuidedRequest = z.output<typeof guidedRequestSchema>;

// Vérifié à la compilation : chaque schéma couvre exactement les champs de fields.ts.
type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
export type DirectFieldsMatch = Assert<
  Exactly<keyof z.input<typeof directRequestSchema>, DirectField>
>;
export type GuidedFieldsMatch = Assert<
  Exactly<keyof z.input<typeof guidedRequestSchema>, GuidedField>
>;

/** Première erreur de chaque champ, telle que les formulaires l'affichent. */
export function fieldErrors<Field extends string>(error: z.core.$ZodError): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as Field] = issue.message as ContactErrorKey;
    }
  }
  return errors;
}
