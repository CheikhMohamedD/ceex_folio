import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { Stamp } from "@/components/ui/stamp";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact/merci">): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "contact.thanks.meta" });
  // Page d'arrivée après l'envoi : rien à indexer.
  return { title: t("title"), robots: { index: false, follow: true } };
}

/** Après une demande envoyée, par l'une ou l'autre porte. */
export default async function ThanksPage({ params }: PageProps<"/[locale]/contact/merci">) {
  await pageLocale(params);
  const t = await getTranslations("contact.thanks");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12">
      <Masthead start={t("masthead")} />
      <div className="flex flex-col items-start gap-6">
        {/* N° 17 : le tampon « Reçu » s'applique (globals.css, « Moments »). */}
        <Stamp tone="success" className="motion-stamp">
          {t("stamp")}
        </Stamp>
        <h1 className="max-w-[20ch] font-display text-section font-semibold">{t("title")}</h1>
        <p className="max-w-[60ch] text-body text-ink-soft">
          {t("text", { hours: SITE.responseHours })}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href="/">
            <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("home")}
          </ButtonLink>
          <Link href="/#pro-life" className="inline-flex min-h-11 items-center ink-link">
            {t("projects")}
          </Link>
        </div>
      </div>
    </div>
  );
}
