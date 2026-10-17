import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import { routing } from "./routing";

type Tree = { [key: string]: string | Tree };

/** L'anglais reprend le français pour toute clé qu'il ne traduit pas (le colophon). */
function withFallback(base: Tree, override: Tree): Tree {
  const result: Tree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] =
      typeof value === "object" && typeof current === "object"
        ? withFallback(current, value)
        : value;
  }
  return result;
}

const MESSAGES = {
  fr,
  en: withFallback(fr as Tree, en as Tree) as typeof fr,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: MESSAGES[locale], timeZone: "Africa/Dakar" };
});
