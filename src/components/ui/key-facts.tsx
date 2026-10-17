import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";
import { IconBadge } from "./icon-badge";

type Fact = { icon: LucideIcon; value: string; label: string };

type KeyFactsProps = {
  facts: Fact[];
  /** Pastilles dans la couleur de la catégorie ; à l'encre sinon. */
  category?: Category;
  className?: string;
};

/**
 * Faits clés : pastille, valeur en Space Grotesk 600, légende en Plex Sans,
 * pointillés entre les lignes. La valeur finale est écrite dans le HTML : une
 * animation de compteur ne fera que la rejouer.
 */
export function KeyFacts({ facts, category, className }: KeyFactsProps) {
  return (
    <ul className={cn(categoryClass(category), "flex flex-col", className)}>
      {facts.map((fact, index) => (
        <li
          key={`${fact.value}-${fact.label}`}
          className={cn(
            "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 py-3.5",
            index > 0 && "border-t border-dotted border-ink-soft",
          )}
        >
          <IconBadge icon={fact.icon} tone={category ? "category" : "ink"} />
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-xl leading-tight font-semibold">{fact.value}</span>
            <span className="text-[0.9375rem] leading-snug text-ink-soft">{fact.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
