import { clsx } from "clsx";

export type ButtonVariant = "primary" | "secondary";

// Classes .btn et .btn-* : globals.css, couche components (les utilitaires passés en
// className gardent la priorité, d'où clsx et non cn : rien à fusionner, et pas de
// tailwind-merge dans le JavaScript client). Module à part, sans lien localisé
// (composant serveur), pour que les formulaires client l'importent aussi.
export function buttonClasses(variant: ButtonVariant = "primary", className?: string): string {
  return clsx("btn", `btn-${variant}`, className);
}
