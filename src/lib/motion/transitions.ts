/** Nom de View Transition partagé par la fiche d'un projet et l'en-tête de son étude. */
export function projectTransition(slug: string): string {
  return `projet-${slug}`;
}
