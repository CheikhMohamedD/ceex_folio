/**
 * Qui ouvre les Coulisses : un seul identifiant GitHub numérique, lu dans
 * ALLOWED_GITHUB_ID. On compare l'identifiant et non le pseudo, car un pseudo peut
 * changer et être repris par quelqu'un d'autre.
 */
const NUMERIC_ID = /^[1-9]\d{0,19}$/;

/** L'identifiant attendu, ou null s'il manque ou n'est pas un nombre : tout est alors refusé. */
export function allowedGithubId(value: string | undefined): string | null {
  const id = value?.trim() ?? "";
  return NUMERIC_ID.test(id) ? id : null;
}

/**
 * Vrai seulement si `candidate` (le champ id du profil GitHub, un nombre dans la
 * réponse de l'API, ou l'accountId enregistré par Better Auth) est l'identifiant
 * attendu. Sans identifiant attendu valide, personne n'entre.
 */
export function isOwnerGithubId(candidate: unknown, allowed: string | null): boolean {
  if (allowed === null) return false;
  if (typeof candidate === "number") {
    return Number.isSafeInteger(candidate) && String(candidate) === allowed;
  }
  return typeof candidate === "string" && NUMERIC_ID.test(candidate) && candidate === allowed;
}
