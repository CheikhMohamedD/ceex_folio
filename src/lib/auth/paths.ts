/** Les Coulisses, en français seulement (la réécriture interne passe par /fr). */
const PRIVATE = /^\/+(?:fr\/+)?coulisses(?:\/|$)/i;

/**
 * Vrai pour toute adresse qui mène aux Coulisses, lue comme le routeur la lira :
 * « /%63oulisses » y mène aussi et passe donc par le même contrôle. Un encodage
 * invalide est traité comme privé.
 */
export function isPrivatePath(pathname: string): boolean {
  try {
    return PRIVATE.test(decodeURIComponent(pathname));
  } catch {
    return true;
  }
}
