import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date au format AAAA-MM-JJ");

/** En-tête de chaque article (export `metadata` du MDX), vérifié au chargement. */
export const postMetadata = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  date: isoDate,
  updated: isoDate.optional(),
  /** Brouillon : visible en développement seulement, jamais dans le sitemap ni le flux. */
  draft: z.boolean().default(false),
});

export type PostMetadata = z.infer<typeof postMetadata>;
