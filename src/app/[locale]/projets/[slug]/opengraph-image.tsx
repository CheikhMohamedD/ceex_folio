import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { getCaseStudy } from "@/content/projects/load";
import { isProjectSlug, PROJECTS } from "@/content/projects/registry";
import { routing } from "@/i18n/routing";
import { shareImage, SHARE_SIZE } from "@/lib/seo/share-image";
import { SITE } from "@/lib/site";

export const size = SHARE_SIZE;
export const contentType = "image/png";
export const alt = SITE.name;

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

/** Image de partage d'une étude de cas, à la couleur de sa catégorie. */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: requested, slug } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const resolved = isProjectSlug(slug) ? slug : PROJECTS[0].slug;
  const study = await getCaseStudy(resolved, locale);
  const t = await getTranslations({ locale, namespace: "project" });
  const tc = await getTranslations({ locale, namespace: "categories" });
  return shareImage({
    masthead: `${SITE.name} · ${t("masthead", { number: study.number })} · ${tc(study.category)}`,
    title: study.meta.title,
    summary: study.meta.summary,
    footer: `${SITE.author} · ${study.meta.type}`,
    category: study.category,
  });
}
