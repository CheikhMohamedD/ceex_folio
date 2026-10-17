import * as z from "zod/mini";

/** Réponse d'une Server Action des Coulisses : les formulaires affichent l'erreur, s'il y en a une. */
export type ActionResult = { ok: true } | { ok: false; error: "invalid" | "notFound" };

export const OK: ActionResult = { ok: true };
export const INVALID: ActionResult = { ok: false, error: "invalid" };

/** Identifiant cuid de Prisma. */
export const recordId = z.string().check(z.regex(/^[a-z0-9]{20,40}$/));

/** Texte nettoyé, obligatoire ou non, borné à la taille de sa colonne. */
export const text = (max: number) => z.string().check(z.trim(), z.minLength(1), z.maxLength(max));
export const optionalText = (max: number) =>
  z.pipe(
    z.string().check(z.trim(), z.maxLength(max)),
    z.transform((value) => value || null),
  );

/** Entier venu d'un champ de formulaire. */
export const intBetween = (min: number, max: number) =>
  z.pipe(z.pipe(z.string(), z.transform(Number)), z.int().check(z.minimum(min), z.maximum(max)));

export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const NOT_FOUND: ActionResult = { ok: false, error: "notFound" };

/** Une écriture sur une ligne disparue entre-temps (P2025 de Prisma) n'est pas une panne. */
export async function unlessMissing(write: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await write();
    return OK;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NOT_FOUND;
    }
    throw error;
  }
}
