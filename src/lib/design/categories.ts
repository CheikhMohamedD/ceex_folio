import { Clapperboard, Globe, PenTool, Smartphone, type LucideIcon } from "lucide-react";

/** Les quatre catégories de dossier. Le libellé vient des messages (categories.*). */
export const CATEGORIES = ["web", "mobile", "design", "motion"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  web: Globe,
  mobile: Smartphone,
  design: PenTool,
  motion: Clapperboard,
};

/** Classe qui place la couleur de la catégorie dans --cat et son lavis dans --cat-wash. */
export function categoryClass(category?: Category | "ink"): string | undefined {
  return category ? `cat-${category}` : undefined;
}
