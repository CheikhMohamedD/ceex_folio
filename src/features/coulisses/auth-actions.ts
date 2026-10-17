"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfigured, getAuth, HOME_PATH, REFUSED_PATH, SIGN_IN_PATH } from "@/server/auth";

/**
 * « Continuer avec GitHub » : Better Auth prépare l'adresse d'autorisation (et le cookie
 * d'état), puis on y part. Fonctionne aussi sans JavaScript. Sans configuration, la
 * même page neutre qu'un refus.
 */
export async function signInWithGitHub(): Promise<void> {
  if (!authConfigured()) redirect(REFUSED_PATH);
  const { url } = await getAuth().api.signInSocial({
    body: {
      provider: "github",
      callbackURL: HOME_PATH,
      errorCallbackURL: REFUSED_PATH,
      disableRedirect: true,
    },
    headers: await headers(),
  });
  redirect(url ?? REFUSED_PATH);
}

export async function signOut(): Promise<void> {
  if (authConfigured()) await getAuth().api.signOut({ headers: await headers() });
  redirect(SIGN_IN_PATH);
}
