import { z } from "zod";

/** En-tête de chaque étude de cas (export `metadata` du MDX), vérifié au chargement. */
export const caseStudyMetadata = z.object({
  title: z.string().min(1),
  /** Type de projet, dans la référence de la fiche : « Plateforme web »… */
  type: z.string().min(1),
  /** Une ou deux phrases pour la fiche de l'accueil. */
  summary: z.string().min(1).max(220),
  /** Description pour les moteurs et les partages, 160 caractères au plus. */
  description: z.string().min(1).max(160),
  /** Chiffre clé, en pastille ; vrai ou absent. */
  figure: z.string().min(1).optional(),
  role: z.string().min(1),
  year: z.string().min(1),
  /** Outils, en plus de la stack du registre. */
  tools: z.array(z.string().min(1)).default([]),
});

export type CaseStudyMetadata = z.infer<typeof caseStudyMetadata>;
