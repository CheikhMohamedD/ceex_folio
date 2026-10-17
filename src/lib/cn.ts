import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge doit connaître les tokens « Dossier » pour ne pas confondre
// une couleur (text-ink) et une taille (text-meta).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "paper",
        "sheet",
        "kraft",
        "ink",
        "ink-soft",
        "rule",
        "stamp",
        "stamp-strong",
        "success",
        "error",
        "cat-web",
        "cat-mobile",
        "cat-design",
        "cat-motion",
        "wash",
        "on-fill",
        "focus",
      ],
      text: ["hero", "section", "card", "body", "meta", "annotation", "quote", "quote-mark"],
      font: ["display", "sans", "mono", "hand", "quote"],
      radius: ["sheet", "tab"],
      shadow: ["sheet", "press", "press-hover", "press-active"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
