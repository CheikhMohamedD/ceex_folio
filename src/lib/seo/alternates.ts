import type { Metadata } from "next";
import { localizedPath } from "@/i18n/paths";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Adresse canonique et versions linguistiques d'une page. Chaque version déclare
 * toutes les autres et elle-même, plus x-default vers le français (Google Search Central).
 */
export function alternates(locale: Locale, href: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const other of routing.locales) {
    languages[other] = localizedPath(href, other);
  }
  languages["x-default"] = localizedPath(href, routing.defaultLocale);
  return { canonical: localizedPath(href, locale), languages };
}
