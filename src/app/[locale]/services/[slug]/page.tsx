import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { OpenFolder } from "@/components/ui/open-folder";
import { ProjectCard } from "@/components/ui/project-card";
import { getCaseStudies } from "@/content/projects/load";
import { isServiceSlug, SERVICE_ITEMS, SERVICES } from "@/content/services";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { CATEGORY_ICON } from "@/lib/design/categories";
import { alternates } from "@/lib/seo/alternates";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

async function load(params: PageProps<"/[locale]/services/[slug]">["params"]) {
  const locale = await pageLocale(params);
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const service = SERVICES.find((item) => item.slug === slug);
  if (!service) notFound();
  return { locale, service };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale, service } = await load(params);
  const t = await getTranslations({ locale, namespace: "services.items" });
  return {
    title: t(`${service.slug}.name`),
    description: t(`${service.slug}.description`),
    alternates: alternates(locale, `/services/${service.slug}`),
  };
}

/** Page service : pour qui, ce que tu reçois, comment on avance, et des projets du genre. */
export default async function ServicePage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { locale, service } = await load(params);
  const t = await getTranslations("services");
  const tp = await getTranslations("home.proLife");
  const tc = await getTranslations("categories");
  const key = `items.${service.slug}` as const;
  const related = (await getCaseStudies(locale)).filter(
    (project) => project.category === service.category && !project.inProgress,
  );
  const others = SERVICES.filter((item) => item.slug !== service.slug);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:px-20 lg:pt-12 lg:pb-24">
      <Masthead
        start={
          <Link href="/services" className="inline-flex min-h-11 items-center gap-2 ink-link">
            <ArrowLeft size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("index.masthead")}
          </Link>
        }
        end={t("masthead")}
      />

      <OpenFolder
        as="article"
        label={t(`${key}.name`)}
        icon={CATEGORY_ICON[service.category]}
        category={service.category}
        aria-labelledby="service-titre"
      >
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-5">
            <h1
              id="service-titre"
              className="max-w-[20ch] font-display text-[clamp(2.25rem,1.75rem+2.2vw,3.75rem)] leading-[1.05] font-bold"
            >
              {t(`${key}.name`)}
            </h1>
            <p className="max-w-[62ch] text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-relaxed">
              {t(`${key}.intro`)}
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-3">
            <section aria-labelledby="pour-qui" className="flex flex-col gap-3">
              <h2 id="pour-qui" className="meta text-ink-soft">
                {t("forWhom")}
              </h2>
              <p>{t(`${key}.forWhom`)}</p>
            </section>
            <section aria-labelledby="livrables" className="flex flex-col gap-3">
              <h2 id="livrables" className="meta text-ink-soft">
                {t("deliverables")}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {SERVICE_ITEMS.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check
                      size={20}
                      strokeWidth={1.5}
                      absoluteStrokeWidth
                      aria-hidden
                      className="mt-0.5 shrink-0 text-(--cat)"
                    />
                    {t(`${key}.deliverables.${item}`)}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="etapes" className="flex flex-col gap-3">
              <h2 id="etapes" className="meta text-ink-soft">
                {t("process")}
              </h2>
              <ol className="flex flex-col gap-2.5">
                {SERVICE_ITEMS.map((item) => (
                  <li key={item} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-1">
                    <span className="font-mono text-sm text-stamp-strong">0{item}</span>
                    {t(`${key}.steps.${item}`)}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </OpenFolder>

      {related.length > 0 ? (
        <section aria-labelledby="projets-lies" className="flex flex-col gap-5">
          <h2 id="projets-lies" className="font-display text-card font-semibold">
            {t("related")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {related.map((project) => (
              <ProjectCard
                key={project.slug}
                number={project.number}
                category={project.category}
                categoryLabel={tc(project.category)}
                type={project.meta.type}
                title={project.meta.title}
                summary={project.meta.summary}
                figure={project.meta.figure}
                href={`/projets/${project.slug}`}
                ctaLabel={tp("read")}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="service-cta"
        className="flex flex-col items-start gap-4 border-t-[1.5px] border-ink pt-10"
      >
        <h2 id="service-cta" className="font-display text-card font-semibold">
          {t("cta.title")}
        </h2>
        <p className="text-ink-soft">{t("cta.text", { hours: SITE.responseHours })}</p>
        <ButtonLink href="/#reach-out">
          {t("cta.action")}
          <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        </ButtonLink>
      </section>

      <nav aria-labelledby="autres-services" className="flex flex-col gap-3">
        <h2 id="autres-services" className="meta text-ink-soft">
          {t("other")}
        </h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/services/${other.slug}`}
                className="inline-flex min-h-11 items-center gap-2 ink-link font-display font-semibold"
              >
                {t(`items.${other.slug}.name`)}
                <ArrowRight size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
