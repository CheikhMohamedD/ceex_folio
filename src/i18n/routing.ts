import { defineRouting } from "next-intl/routing";

/**
 * Français par défaut, sans préfixe ; anglais sous /en. Pas de détection par le
 * navigateur : une adresse donne toujours la même langue, ce que les moteurs et les
 * liens partagés attendent. Le sélecteur de langue de l'en-tête fait le reste.
 *
 * Sans détection, le cookie de langue ne sert à rien : il n'est pas posé. Les liens
 * hreflang sont dans le <head> de chaque page (lib/seo/alternates.ts) ; l'en-tête HTTP
 * Link qui les répète est coupé, il alourdissait chaque réponse.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
