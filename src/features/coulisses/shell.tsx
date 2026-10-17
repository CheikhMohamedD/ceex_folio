import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Masthead } from "@/components/ui/masthead";
import { Link } from "@/i18n/link";
import { cn } from "@/lib/cn";
import type { Owner } from "@/server/owner";
import { signOut } from "./auth-actions";

export const COULISSES_PAGES = [
  { key: "dashboard", href: "/coulisses" },
  { key: "requests", href: "/coulisses/demandes" },
  { key: "cheikh", href: "/coulisses/cheikh-2-0" },
  { key: "compass", href: "/coulisses/boussole" },
] as const;
export type CoulissesPage = (typeof COULISSES_PAGES)[number]["key"];

type CoulissesShellProps = {
  current: CoulissesPage;
  owner: Owner;
  title: string;
  lead?: ReactNode;
  /** Au-dessus du titre (numéro de version de Cheikh 2.0, par exemple). */
  kicker?: ReactNode;
  children: ReactNode;
};

/**
 * Enveloppe commune des pages des Coulisses : bandeau, onglets des quatre pages,
 * déconnexion. Même design system que le site public, sans aucune animation.
 */
export async function CoulissesShell({
  current,
  owner,
  title,
  lead,
  kicker,
  children,
}: CoulissesShellProps) {
  const t = await getTranslations("coulisses");
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12">
      <div className="flex flex-col gap-4">
        <Masthead start={t("masthead", { name: owner.name })} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label={t("nav.label")}>
            <ul className="flex flex-wrap gap-2">
              {COULISSES_PAGES.map((page) => (
                <li key={page.key}>
                  <Link
                    href={page.href}
                    aria-current={page.key === current ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-sheet border-[1.5px] border-ink px-4 font-display text-[0.9375rem] font-semibold",
                      page.key === current ? "bg-ink text-on-fill" : "bg-sheet hover:bg-paper",
                    )}
                  >
                    {t(`nav.${page.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 px-1 font-display text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
            >
              <LogOut size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      </div>
      <header className="flex flex-col gap-4">
        {kicker}
        <h1 className="font-display text-section font-semibold">{title}</h1>
        {lead ? <p className="max-w-[64ch] text-body text-ink-soft">{lead}</p> : null}
      </header>
      {children}
    </div>
  );
}

/** Les textes communs des formulaires, passés aux composants client. */
export async function formMessages(saved?: string) {
  const t = await getTranslations("coulisses.form");
  return {
    saving: t("saving"),
    saved,
    errors: { invalid: t("errors.invalid"), notFound: t("errors.notFound") },
  };
}
