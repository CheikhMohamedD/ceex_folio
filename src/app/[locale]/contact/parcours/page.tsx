import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Masthead } from "@/components/ui/masthead";
import { guidedCopy } from "@/features/contact/copy";
import { GuidedPath } from "@/features/contact/guided-path";
import { pageLocale } from "@/i18n/locale";
import { alternates } from "@/lib/seo/alternates";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact/parcours">): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "contact.guided.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/contact/parcours"),
  };
}

/** Porte 2 : le parcours guidé, version client du générateur de Cheikh 2.0. */
export default async function GuidedPathPage({ params }: PageProps<"/[locale]/contact/parcours">) {
  const locale = await pageLocale(params);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:pt-12 lg:pb-24">
      <Masthead start={t("guided.masthead")} />
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-section font-semibold">{t("guided.title")}</h1>
        <p className="max-w-[60ch] text-body text-ink-soft">{t("guided.intro")}</p>
      </header>
      <GuidedPath locale={locale} copy={await guidedCopy()} />
      <p className="max-w-[68ch] text-sm text-ink-soft">{t("privacy", { email: SITE.email })}</p>
    </div>
  );
}
