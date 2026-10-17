import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isPrivatePath } from "./lib/auth/paths";

/** Réécrit les adresses sans préfixe vers le français ; /en sert l'anglais. */
const intl = createMiddleware(routing);

/**
 * Niveau 1 : les Coulisses renvoient vers /connexion (une vraie redirection 307) sans
 * session du propriétaire. Sans cookie, aucune requête en base ; avec un cookie, la
 * session est relue et l'identifiant GitHub comparé. Le module d'authentification ne
 * se charge que pour ces adresses. Chaque page revérifie avec requireOwner().
 */
export default async function proxy(request: NextRequest) {
  if (isPrivatePath(request.nextUrl.pathname)) {
    const signIn = NextResponse.redirect(new URL("/connexion", request.url));
    if (!getSessionCookie(request)) return signIn;
    const { ownerFromHeaders } = await import("./server/auth");
    if (!(await ownerFromHeaders(request.headers, { refresh: false }))) return signIn;
  }
  return intl(request);
}

export const config = {
  // Ni les fichiers (un point dans le nom), ni les routes internes, ni les images de
  // partage (servies à /fr/… par Next) ; les flux RSS, si.
  matcher: [
    "/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)",
    "/blog/rss.xml",
    "/en/blog/rss.xml",
  ],
};
