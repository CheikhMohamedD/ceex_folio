import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Réécrit les adresses sans préfixe vers le français ; /en sert l'anglais. */
export default createMiddleware(routing);

export const config = {
  // Ni les fichiers (un point dans le nom), ni les routes internes, ni les images de
  // partage (servies à /fr/… par Next) ; les flux RSS, si.
  matcher: [
    "/((?!api|_next|_vercel|.*opengraph-image|.*\\..*).*)",
    "/blog/rss.xml",
    "/en/blog/rss.xml",
  ],
};
