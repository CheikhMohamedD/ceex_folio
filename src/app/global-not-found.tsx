import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { Stamp } from "@/components/ui/stamp";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: `${fr.notFound.title} · ${fr.meta.title}`,
};

/**
 * Adresse inconnue, dans n'importe quelle langue. Rendue hors des mises en page (la
 * racine dépend de la langue), donc en français avec sa traduction anglaise.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <header className="border-b-[1.5px] border-ink">
          <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:h-[4.5rem] sm:px-6 lg:px-20">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-display text-xl font-bold tracking-[0.02em]"
            >
              {fr.nav.brand}
            </Link>
          </div>
        </header>
        <main
          id="contenu"
          className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12"
        >
          <Masthead start={fr.notFound.masthead} end="404" />
          <div className="flex flex-col items-start gap-6">
            <Stamp tone="error">{fr.notFound.stamp}</Stamp>
            <h1 className="max-w-[20ch] font-display text-section font-semibold">
              {fr.notFound.heading}
            </h1>
            <p className="max-w-[60ch] text-body text-ink-soft">{fr.notFound.text}</p>
            <p lang="en" className="max-w-[60ch] text-body text-ink-soft">
              {en.notFound.heading} {en.notFound.text}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              {/* Hors des mises en page, donc sans le Link localisé, qui lit la langue. */}
              <Link href="/" className={buttonClasses()}>
                <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                {fr.notFound.back}
              </Link>
              <Link href="/en" lang="en" className="inline-flex min-h-11 items-center ink-link">
                {en.notFound.back}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
