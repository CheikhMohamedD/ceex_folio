import { Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { nextThemeChoice, THEME_ORDER, type ThemeChoice } from "@/lib/theme";
import { ThemeToggle } from "./theme-toggle";

const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/** En-tête : logo, sections de l'accueil dès 640 px, bouton de thème. */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tt = useTranslations("ui.theme");
  const themeLabels = Object.fromEntries(
    THEME_ORDER.map((choice) => [
      choice,
      tt("toggle", { current: tt(choice), next: tt(nextThemeChoice(choice)) }),
    ]),
  ) as Record<ThemeChoice, string>;
  const themeIcons = Object.fromEntries(
    THEME_ORDER.map((choice) => {
      const Icon = THEME_ICON[choice];
      return [
        choice,
        <Icon key={choice} size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />,
      ];
    }),
  ) as Record<ThemeChoice, ReactNode>;
  const sections = [
    { href: "/#prez", number: "01", label: t("prez") },
    { href: "/#pro-life", number: "02", label: t("proLife") },
    { href: "/#hobbies", number: "03", label: t("hobbies") },
  ];

  return (
    <header className="border-b-[1.5px] border-ink">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-20">
        <Link
          href="/"
          aria-label={t("home")}
          className="inline-flex min-h-11 items-center font-display text-xl font-bold tracking-[0.02em]"
        >
          {t("brand")}
        </Link>
        <div className="flex items-center gap-4 lg:gap-8">
          <nav
            aria-label={t("label")}
            className="hidden items-center gap-4 font-display font-medium sm:flex lg:gap-8"
          >
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="inline-flex min-h-11 items-center gap-1"
              >
                <span className="font-mono text-xs text-stamp-strong">{section.number}</span>
                {section.label}
              </Link>
            ))}
            <Link
              href="/#reach-out"
              className="inline-flex min-h-11 items-center rounded-full bg-stamp-strong px-5 font-semibold text-on-fill"
            >
              {t("reachOut")}
            </Link>
          </nav>
          <ThemeToggle labels={themeLabels} icons={themeIcons} />
        </div>
      </div>
    </header>
  );
}
