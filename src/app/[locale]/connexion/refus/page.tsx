import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "connexion.refused.meta" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Refus, et toute erreur de connexion : une page neutre, qui ne dit ni pourquoi ni à
 * qui l'espace est réservé. Le code d'erreur de l'adresse n'est pas lu.
 */
export default async function SignInRefusedPage({
  params,
}: PageProps<"/[locale]/connexion/refus">) {
  if ((await pageLocale(params)) !== "fr") notFound();
  const t = await getTranslations("connexion");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12">
      <Masthead start={t("masthead")} />
      <div className="flex max-w-[40rem] flex-col items-start gap-6">
        <h1 className="font-display text-section font-semibold">{t("refused.title")}</h1>
        <p className="text-body text-ink-soft">{t("refused.text")}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href="/">
            <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("refused.home")}
          </ButtonLink>
          <Link href="/connexion" className="inline-flex min-h-11 items-center ink-link">
            {t("refused.retry")}
          </Link>
        </div>
      </div>
    </div>
  );
}
