import type { Category } from "@/lib/design/categories";

/** Données des projets qui ne dépendent pas de la langue ; les textes sont dans les MDX. */
export type ProjectEntry = {
  slug: string;
  /** Numéro de fiche : « 01 », « 02 »… */
  number: string;
  category: Category;
  /** Stack affichée sur la fiche à la une et sur l'étude de cas. */
  stack: string[];
  featured?: boolean;
  /** Projet encore en conception : fiche en tirets, pas d'étude de cas complète. */
  inProgress?: boolean;
};

export const PROJECTS = [
  {
    slug: "seetalma",
    number: "01",
    category: "web",
    stack: ["Next.js", "Prisma", "PostgreSQL"],
    featured: true,
  },
  { slug: "ttc-erp", number: "02", category: "web", stack: [] },
  { slug: "ferme-jambar", number: "03", category: "mobile", stack: ["React Native", "Expo"] },
  { slug: "safar-2026", number: "04", category: "design", stack: [] },
  { slug: "application-fintech", number: "05", category: "mobile", stack: [] },
  { slug: "atelier", number: "06", category: "web", stack: [], inProgress: true },
] as const satisfies readonly ProjectEntry[];

export type ProjectSlug = (typeof PROJECTS)[number]["slug"];

export function isProjectSlug(value: string): value is ProjectSlug {
  return PROJECTS.some((project) => project.slug === value);
}
