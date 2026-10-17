import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteTabBar } from "@/components/layout/site-tab-bar";
import { SITE } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: SITE.name,
    authors: [{ name: SITE.author }],
    // Le site n'est pas encore lancé : pas d'indexation avant la phase 2.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee6" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("nav");

  return (
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* Aucun composant client ne traduit : les textes restent côté serveur. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sheet focus:bg-ink focus:px-4 focus:py-3 focus:text-on-fill"
        >
          {t("skip")}
        </a>
        <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:pb-0">
          <SiteHeader />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
        <SiteTabBar />
      </body>
    </html>
  );
}
