import type { MDXContent } from "mdx/types";
import type { Locale } from "@/i18n/routing";
import { PROJECTS, type ProjectEntry, type ProjectSlug } from "./registry";
import { caseStudyMetadata, type CaseStudyMetadata } from "./schema";

type CaseStudyModule = { default: MDXContent; metadata: unknown };

/** Un import par fichier : la liste reste vérifiée par TypeScript, sans lire le disque. */
const SOURCES: Record<ProjectSlug, Record<Locale, () => Promise<CaseStudyModule>>> = {
  seetalma: { fr: () => import("./seetalma/fr.mdx"), en: () => import("./seetalma/en.mdx") },
  "ttc-erp": { fr: () => import("./ttc-erp/fr.mdx"), en: () => import("./ttc-erp/en.mdx") },
  "ferme-jambar": {
    fr: () => import("./ferme-jambar/fr.mdx"),
    en: () => import("./ferme-jambar/en.mdx"),
  },
  "safar-2026": {
    fr: () => import("./safar-2026/fr.mdx"),
    en: () => import("./safar-2026/en.mdx"),
  },
  "application-fintech": {
    fr: () => import("./application-fintech/fr.mdx"),
    en: () => import("./application-fintech/en.mdx"),
  },
  atelier: { fr: () => import("./atelier/fr.mdx"), en: () => import("./atelier/en.mdx") },
};

export type CaseStudy = ProjectEntry & {
  meta: CaseStudyMetadata;
  Content: MDXContent;
};

export async function getCaseStudy(slug: ProjectSlug, locale: Locale): Promise<CaseStudy> {
  const entry = PROJECTS.find((project) => project.slug === slug);
  if (!entry) throw new Error(`Projet inconnu : ${slug}`);
  const loaded = await SOURCES[slug][locale]();
  const parsed = caseStudyMetadata.safeParse(loaded.metadata);
  if (!parsed.success) {
    throw new Error(`En-tête invalide pour ${slug} (${locale}) : ${parsed.error.message}`);
  }
  return { ...entry, stack: [...entry.stack], meta: parsed.data, Content: loaded.default };
}

/** Tous les projets, dans l'ordre des fiches. */
export async function getCaseStudies(locale: Locale): Promise<CaseStudy[]> {
  return Promise.all(PROJECTS.map((project) => getCaseStudy(project.slug, locale)));
}
