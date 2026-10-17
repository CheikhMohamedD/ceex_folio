import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";
import { IconBadge } from "./icon-badge";

type MastheadProps = {
  /** À gauche : le site et la rubrique. */
  start: ReactNode;
  /** À droite : dossier, numéro, catégorie, année. */
  end?: ReactNode;
  className?: string;
};

/** Bandeau éditorial : une ligne mono en tête de feuille, soulignée d'un trait d'encre. */
export function Masthead({ start, end, className }: MastheadProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[1.5px] border-ink pb-2.5 meta",
        className,
      )}
    >
      <span>{start}</span>
      {end ? <span className="text-ink-soft">{end}</span> : null}
    </div>
  );
}

type SignatureProps = {
  icon: LucideIcon;
  title: ReactNode;
  detail?: ReactNode;
  category?: Category | "ink";
  className?: string;
};

/** Signature de pied de feuille : pastille, intitulé mono et une ligne en couleur. */
export function Signature({ icon, title, detail, category, className }: SignatureProps) {
  return (
    <div
      className={cn(
        categoryClass(category),
        "flex items-center gap-3.5 border-t border-dotted border-ink-soft pt-4",
        className,
      )}
    >
      <IconBadge icon={icon} tone="category" />
      <div className="flex flex-col gap-0.5">
        <span className="meta">{title}</span>
        {detail ? <span className="text-sm text-(--cat)">{detail}</span> : null}
      </div>
    </div>
  );
}
