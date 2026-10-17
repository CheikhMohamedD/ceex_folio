import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ownerFromHeaders, SIGN_IN_PATH, type Owner } from "@/server/auth";

export type { Owner };

/**
 * Niveau 3 : chaque page et chaque Server Action des Coulisses commence par cet appel,
 * même si le proxy a déjà vérifié la session : un contournement du proxy (comme la
 * faille de Next.js en 2025) ne suffit pas à entrer. Sinon, retour à /connexion.
 */
export async function requireOwner(): Promise<Owner> {
  // La requête d'abord : la page reste rendue à chaque visite, jamais figée à la
  // construction (où les secrets manquent et où tout redirigerait vers /connexion).
  const owner = await ownerFromHeaders(await headers());
  if (!owner) redirect(SIGN_IN_PATH);
  return owner;
}
