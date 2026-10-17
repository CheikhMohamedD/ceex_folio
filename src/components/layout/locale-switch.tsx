"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/routing";

type LocaleSwitchProps = {
  /** Langue proposée par le lien. */
  target: Locale;
  /** Texte visible (« EN ») ; le nom accessible commence par lui (WCAG 2.5.3). */
  short: string;
  label: string;
};

/**
 * Chemin sans préfixe de langue : « /en/projets/x » et « /projets/x » donnent le même.
 * Au rendu serveur, le chemin est celui de la réécriture du proxy (« /fr/projets/x ») :
 * les deux préfixes sont donc retirés.
 */
export function basePath(pathname: string): string {
  const stripped = pathname.replace(/^\/(?:fr|en)(?=\/|$)/, "");
  if (stripped.startsWith("/colophon")) return "/"; // Le colophon n'existe qu'en français.
  if (stripped.startsWith("/blog/")) return "/blog"; // Un article peut manquer dans l'autre langue.
  return stripped || "/";
}

/**
 * Même page, dans l'autre langue ; le français n'a pas de préfixe. Un simple lien : changer
 * de langue recharge la page, sans embarquer le routeur client pour ce seul bouton.
 */
export function LocaleSwitch({ target, short, label }: LocaleSwitchProps) {
  const base = basePath(usePathname());
  const href = target === "en" ? `/en${base === "/" ? "" : base}` : base;
  return (
    <a
      href={href}
      hrefLang={target}
      aria-label={label}
      className="inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-ink font-mono text-xs font-medium"
    >
      {short}
    </a>
  );
}
