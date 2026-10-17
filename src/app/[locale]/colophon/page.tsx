import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageLocale } from "@/i18n/locale";
import { Masthead, Signature } from "@/components/ui/masthead";
import { CategoriesSection } from "@/features/colophon/categories-section";
import { ComponentsSection } from "@/features/colophon/components-section";
import { FoundationsSection } from "@/features/colophon/foundations-section";
import { MeasuresSection } from "@/features/colophon/measures-section";
import { PaletteSection } from "@/features/colophon/palette-section";
import { StackSection } from "@/features/colophon/stack-section";
import { TypographySection } from "@/features/colophon/typography-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "colophon.meta" });
  return {
    title: t("title"),
    description: t("description"),
    // Le colophon n'existe qu'en français : la version anglaise du site y renvoie.
    alternates: { canonical: "/colophon" },
  };
}

const SECTIONS = [
  { id: "palette", key: "palette" },
  { id: "categories", key: "categories" },
  { id: "typographie", key: "typography" },
  { id: "fondations", key: "foundations" },
  { id: "composants", key: "components" },
  { id: "stack", key: "stack" },
  { id: "mesures", key: "measures" },
] as const;

/** Colophon : le design system « Dossier » en vrai, et les mesures qui le prouvent. */
export default async function ColophonPage({ params }: PageProps<"/[locale]/colophon">) {
  // Le colophon reste en français : sa version anglaise n'existe pas.
  if ((await pageLocale(params)) !== "fr") notFound();
  const t = await getTranslations("colophon");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-20">
      <header className="flex flex-col gap-10 pt-8 pb-16 lg:pt-12 lg:pb-24">
        <Masthead start={t("masthead.start")} end={t("masthead.end")} />
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-[clamp(3rem,1.9rem+4.9vw,6.25rem)] leading-[0.95] font-bold">
              {t("title")}
            </h1>
            <p className="max-w-[60ch] text-body">{t("lead")}</p>
          </div>
          <nav aria-label={t("toc")}>
            <ol className="flex flex-col border-t-[1.5px] border-ink">
              {SECTIONS.map((section, index) => (
                <li key={section.id} className="border-b border-dotted border-ink-soft">
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-11 items-center gap-3 font-display font-medium decoration-[1.5px] underline-offset-4 hover:underline"
                  >
                    <span className="font-mono text-xs font-medium text-stamp-strong">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {t(`${section.key}.title`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <PaletteSection />
      <CategoriesSection />
      <TypographySection />
      <FoundationsSection />
      <ComponentsSection />
      <StackSection />
      <MeasuresSection />

      <div className="pb-16 lg:pb-24">
        <Signature
          icon={FolderOpen}
          title={t("signature.title")}
          detail={t("signature.detail")}
          category="ink"
        />
      </div>
    </div>
  );
}
