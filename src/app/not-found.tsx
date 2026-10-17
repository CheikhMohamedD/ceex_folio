import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { Stamp } from "@/components/ui/stamp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return { title: t("title") };
}

/** Page introuvable : même feuille que le reste du site, un seul chemin de retour. */
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12">
      <Masthead start={t("masthead")} end="404" />
      <div className="flex flex-col items-start gap-6">
        <Stamp tone="error">{t("stamp")}</Stamp>
        <h1 className="max-w-[20ch] font-display text-section font-semibold">{t("heading")}</h1>
        <p className="max-w-[60ch] text-body text-ink-soft">{t("text")}</p>
        <ButtonLink href="/">
          <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          {t("back")}
        </ButtonLink>
      </div>
    </div>
  );
}
