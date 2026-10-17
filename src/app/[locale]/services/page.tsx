import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Masthead } from "@/components/ui/masthead";
import { SERVICES } from "@/content/services";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { CATEGORY_ICON, categoryClass } from "@/lib/design/categories";
import { alternates } from "@/lib/seo/alternates";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "services.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates(locale, "/services"),
  };
}

/** Les trois services, chacun vers sa page. */
export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  await pageLocale(params);
  const t = await getTranslations("services");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:px-20 lg:pt-12 lg:pb-24">
      <Masthead start={t("index.masthead")} />
      <header className="flex flex-col gap-5">
        <h1 className="max-w-[18ch] font-display text-section font-semibold">{t("index.title")}</h1>
        <p className="max-w-[60ch] text-body text-ink-soft">{t("index.lead")}</p>
      </header>
      <ul className="grid gap-5 md:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = CATEGORY_ICON[service.category];
          return (
            <li key={service.slug} className="flex">
              <article
                className={`${categoryClass(service.category)} relative flex flex-1 flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-sheet p-6 shadow-[inset_0_4px_0_var(--cat)] transition-[translate,box-shadow] hover:-translate-y-0.5 motion-reduce:transition-none`}
              >
                <Icon
                  size={24}
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                  aria-hidden
                  className="text-(--cat)"
                />
                <h2 className="font-display text-card font-semibold">
                  <Link href={`/services/${service.slug}`} className="stretched-link">
                    {t(`items.${service.slug}.name`)}
                  </Link>
                </h2>
                <p className="flex-1 text-ink-soft">{t(`items.${service.slug}.short`)}</p>
                <ArrowRight
                  size={20}
                  strokeWidth={1.5}
                  absoluteStrokeWidth
                  aria-hidden
                  className="text-stamp-strong"
                />
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
