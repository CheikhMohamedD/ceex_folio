import NextLink from "next/link";
import { getLocale } from "next-intl/server";
import type { ComponentProps } from "react";
import { localizedPath } from "./paths";
import type { Locale } from "./routing";

export type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string;
  /** Langue de la cible ; la langue de la page par défaut. */
  locale?: Locale;
};

/**
 * Lien localisé rendu côté serveur : l'adresse est calculée ici (« /en/… » en anglais,
 * sans préfixe en français), donc le navigateur ne charge rien de next-intl.
 */
export async function Link({ href, locale, ...props }: LinkProps) {
  const external = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
  const target = external ? href : localizedPath(href, locale ?? (await getLocale()));
  return <NextLink href={target} {...props} />;
}
