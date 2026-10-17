import { routing, type Locale } from "./routing";

/**
 * Adresse d'une page dans une langue : sans préfixe en français, « /en/… » en anglais.
 * Volontairement sans next-intl/navigation, qui ferait charger son Link client au
 * navigateur sur chaque page.
 */
export function localizedPath(href: string, locale: Locale): string {
  if (locale === routing.defaultLocale) return href;
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#")) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}
