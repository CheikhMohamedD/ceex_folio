/**
 * Nombre en tête d'un chiffre clé (« 1 000 poules », « 7 modules ») : chiffres et
 * espaces des milliers, quelle qu'en soit l'espace. null quand il n'y a rien à compter.
 */
export function leadingNumber(text: string): { value: number; rest: string } | null {
  const match = /^(\d{1,3}(?:[\s\u00a0\u202f]\d{3})*|\d+)(.*)$/su.exec(text);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/\D/g, ""));
  return Number.isFinite(value) && value > 1 ? { value, rest: match[2] ?? "" } : null;
}

