import type { MDXComponents, MDXContent } from "mdx/types";
import type { ReactNode } from "react";

export const CASE_STUDY_SECTIONS = ["overview", "process", "result"] as const;
export type CaseStudySection = (typeof CASE_STUDY_SECTIONS)[number];

/**
 * Une étude de cas est un seul MDX découpé en <Section id="…">. Chaque onglet rend
 * le fichier en ne gardant que sa section : un seul fichier à écrire, trois panneaux.
 */
export function sectionOnly(section: CaseStudySection): MDXComponents {
  function Section({ id, children }: { id: string; children?: ReactNode }) {
    return id === section ? <div className="flex flex-col">{children}</div> : null;
  }
  return { Section };
}

export function CaseStudyPanel({
  Content,
  section,
}: {
  Content: MDXContent;
  section: CaseStudySection;
}) {
  return <Content components={sectionOnly(section)} />;
}
