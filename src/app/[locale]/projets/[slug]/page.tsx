import { ArrowLeft, ArrowRight, CalendarDays, Hash, Layers, UserRound, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { FolderTabs } from "@/components/ui/folder-tabs";
import { KeyFacts } from "@/components/ui/key-facts";
import { Masthead } from "@/components/ui/masthead";
import { OpenFolder } from "@/components/ui/open-folder";
import { Stamp } from "@/components/ui/stamp";
import { getCaseStudy } from "@/content/projects/load";
import { isProjectSlug, PROJECTS } from "@/content/projects/registry";
import { CASE_STUDY_SECTIONS, CaseStudyPanel } from "@/features/project/case-study-sections";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { CATEGORY_ICON } from "@/lib/design/categories";
import { projectTransition } from "@/lib/motion/transitions";
import { alternates } from "@/lib/seo/alternates";
import { caseStudySchema, JsonLd } from "@/lib/seo/json-ld";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

async function load(params: PageProps<"/[locale]/projets/[slug]">["params"]) {
  const locale = await pageLocale(params);
  const { slug } = await params;
  if (!isProjectSlug(slug)) notFound();
  return { locale, study: await getCaseStudy(slug, locale) };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projets/[slug]">): Promise<Metadata> {
  const { locale, study } = await load(params);
  return {
    title: study.meta.title,
    description: study.meta.description,
    alternates: alternates(locale, `/projets/${study.slug}`),
    openGraph: { type: "article", title: study.meta.title, description: study.meta.description },
  };
}

/** Étude de cas : dossier ouvert à la couleur de sa catégorie, en trois onglets. */
export default async function ProjectPage({ params }: PageProps<"/[locale]/projets/[slug]">) {
  const { locale, study } = await load(params);
  const t = await getTranslations("project");
  const tc = await getTranslations("categories");
  const schema = await caseStudySchema(study, locale);

  const index = PROJECTS.findIndex((project) => project.slug === study.slug);
  const previous = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const [previousStudy, nextStudy] = await Promise.all([
    previous ? getCaseStudy(previous.slug, locale) : null,
    next ? getCaseStudy(next.slug, locale) : null,
  ]);
  const tools = [...study.stack, ...study.meta.tools];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:px-20 lg:pt-12 lg:pb-24">
      <JsonLd data={schema} />
      <Masthead
        start={
          <Link href="/#pro-life" className="inline-flex min-h-11 items-center gap-2 ink-link">
            <ArrowLeft size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("back")}
          </Link>
        }
        end={`${t("masthead", { number: study.number })} · ${tc(study.category)}`}
      />

      {/* Le panneau du projet sort par la droite, ou monte du bas sur mobile (globals.css). */}
      <ViewTransition enter="panel" default="none">
        <OpenFolder
          as="article"
          label={tc(study.category)}
          icon={CATEGORY_ICON[study.category]}
          category={study.category}
          aria-labelledby="projet-titre"
        >
          <div className="flex flex-col gap-10">
            <header className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
              <div className="flex flex-col items-start gap-5">
                {study.inProgress ? <Stamp tone="category">{t("inProgress")}</Stamp> : null}
                <p className="meta text-ink-soft">
                  N° {study.number} · {study.meta.type}
                </p>
                <h1
                  id="projet-titre"
                  className="font-display text-[clamp(2.5rem,1.9rem+2.6vw,4.25rem)] leading-none font-bold"
                >
                  {study.meta.title}
                </h1>
                <p className="max-w-[60ch] text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-relaxed text-ink-soft">
                  {study.meta.summary}
                </p>
              </div>
              <section aria-label={t("facts.label")}>
                <KeyFacts
                  category={study.category}
                  facts={[
                    { icon: Layers, value: study.meta.type, label: t("facts.type") },
                    { icon: UserRound, value: study.meta.role, label: t("facts.role") },
                    { icon: CalendarDays, value: study.meta.year, label: t("facts.year") },
                    ...(tools.length > 0
                      ? [{ icon: Wrench, value: tools.join(" · "), label: t("facts.stack") }]
                      : []),
                    ...(study.meta.figure
                      ? [{ icon: Hash, value: study.meta.figure, label: t("facts.figure") }]
                      : []),
                  ]}
                />
              </section>
            </header>

            {/* La vignette de la fiche s'agrandit jusqu'ici (View Transitions, n° 13). */}
            <ViewTransition name={projectTransition(study.slug)} share="morph" default="none">
              <div
                aria-hidden
                className="aspect-[21/8] rounded-sheet border-[1.5px] border-ink hatch"
              />
            </ViewTransition>

            <FolderTabs
              label={t("tabs.label")}
              tabs={CASE_STUDY_SECTIONS.map((section) => ({
                id: section,
                label: t(`tabs.${section}`),
                category: study.category,
              }))}
              panels={Object.fromEntries(
                CASE_STUDY_SECTIONS.map((section) => [
                  section,
                  <CaseStudyPanel key={section} Content={study.Content} section={section} />,
                ]),
              )}
            />
          </div>
        </OpenFolder>
      </ViewTransition>

      <nav aria-label={t("nav.label")} className="grid gap-4 sm:grid-cols-2">
        {previousStudy ? (
          <Link
            href={`/projets/${previousStudy.slug}`}
            className="flex min-h-11 flex-col gap-1 rounded-sheet border-[1.5px] border-ink p-4 hover:bg-sheet"
          >
            <span className="meta text-ink-soft">← {t("nav.previous")}</span>
            <span className="font-display text-card font-semibold">{previousStudy.meta.title}</span>
          </Link>
        ) : null}
        {nextStudy ? (
          <Link
            href={`/projets/${nextStudy.slug}`}
            className="flex min-h-11 flex-col items-end gap-1 rounded-sheet border-[1.5px] border-ink p-4 text-right hover:bg-sheet"
          >
            <span className="meta text-ink-soft">{t("nav.next")} →</span>
            <span className="font-display text-card font-semibold">{nextStudy.meta.title}</span>
          </Link>
        ) : null}
      </nav>

      <section
        aria-labelledby="projet-cta"
        className="flex flex-col items-start gap-4 border-t-[1.5px] border-ink pt-10"
      >
        <h2 id="projet-cta" className="font-display text-card font-semibold">
          {t("cta.title")}
        </h2>
        <p className="text-ink-soft">{t("cta.text", { hours: SITE.responseHours })}</p>
        <ButtonLink href="/#reach-out">
          {t("cta.action")}
          <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        </ButtonLink>
      </section>
    </div>
  );
}
