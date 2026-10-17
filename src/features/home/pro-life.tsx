import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FolderTabs, type FolderTab } from "@/components/ui/folder-tabs";
import { ProjectCard } from "@/components/ui/project-card";
import { Stamp } from "@/components/ui/stamp";
import type { CaseStudy } from "@/content/projects/load";
import { Link } from "@/i18n/link";
import { categoryClass, type Category } from "@/lib/design/categories";
import { NumberedSection } from "./numbered-section";

const FILTERS = ["web", "mobile", "design"] as const satisfies readonly Category[];

/**
 * Pro life : un projet à la une, les fiches, puis le projet en conception. Les onglets
 * de dossier filtrent par catégorie (mode filtre : la liste n'est écrite qu'une fois) ;
 * chaque fiche dit en une phrase de quoi il s'agit.
 */
export async function ProLife({ projects }: { projects: CaseStudy[] }) {
  const t = await getTranslations("home.proLife");
  const tc = await getTranslations("categories");

  const featured = projects.find((project) => project.featured);
  const regular = projects.filter((project) => !project.featured && !project.inProgress);
  const upcoming = projects.filter((project) => project.inProgress);

  // Chaque fiche n'est écrite qu'une fois : l'onglet actif masque les autres catégories.
  const list = (
    <div className="flex flex-col gap-5">
      {featured ? (
        <div data-category={featured.category}>
          <ProjectCard
            featured
            number={featured.number}
            category={featured.category}
            categoryLabel={tc(featured.category)}
            type={featured.meta.type}
            stack={featured.stack}
            title={featured.meta.title}
            summary={featured.meta.summary}
            figure={featured.meta.figure}
            href={`/projets/${featured.slug}`}
            ctaLabel={t("readCase")}
            badge={
              <Stamp onImage tilt={-4}>
                {t("featured")}
              </Stamp>
            }
          />
        </div>
      ) : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {regular.map((project) => (
          <li key={project.slug} data-category={project.category} className="flex">
            <ProjectCard
              className="flex-1"
              number={project.number}
              category={project.category}
              categoryLabel={tc(project.category)}
              type={project.meta.type}
              title={project.meta.title}
              summary={project.meta.summary}
              figure={project.meta.figure}
              href={`/projets/${project.slug}`}
              ctaLabel={t("read")}
            />
          </li>
        ))}
      </ul>
      {upcoming.map((project) => (
        <article
          key={project.slug}
          data-category={project.category}
          className={`${categoryClass(project.category)} relative flex flex-wrap items-center gap-x-5 gap-y-2 rounded-sheet border-[1.5px] border-dashed border-ink p-4 sm:px-5`}
        >
          <p className="flex items-center gap-2 meta text-ink-soft">
            <span aria-hidden className="size-2 rounded-full bg-(--cat)" />
            <span className="sr-only">{`${tc(project.category)} · `}</span>
            {`N° ${project.number} · ${t("inProgress")}`}
          </p>
          <h3 className="font-display text-[1.25rem] font-semibold">
            <Link href={`/projets/${project.slug}`} className="stretched-link">
              {project.meta.title}
            </Link>
          </h3>
          <p className="min-w-0 flex-[1_1_16rem] text-[0.9375rem] leading-normal text-ink-soft">
            {project.meta.summary}
          </p>
          <span aria-hidden className="fiche-cta">
            {`${t("follow")} →`}
          </span>
        </article>
      ))}
    </div>
  );

  const tabs: FolderTab[] = [
    { id: "tous", label: t("all"), count: projects.length },
    ...FILTERS.map((category) => ({
      id: category,
      label: tc(category),
      count: projects.filter((project) => project.category === category).length,
      category,
    })),
  ];
  return (
    <NumberedSection
      id="pro-life"
      number="02"
      title={t("title")}
      aside={t("count", { count: projects.length })}
    >
      <FolderTabs label={t("filters")} tabs={tabs}>
        {list}
      </FolderTabs>
      <Link
        href="/services"
        className="inline-flex min-h-11 items-center gap-2 self-start ink-link font-display font-semibold text-stamp-strong"
      >
        {t("services")}
        <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
      </Link>
    </NumberedSection>
  );
}
