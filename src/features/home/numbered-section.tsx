import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type NumberedSectionProps = {
  id: string;
  number: string;
  title: string;
  /** Texte à droite du titre (compteur de projets…). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Section de l'accueil : grand numéro rouge à gauche dès 1 024 px, au-dessus du titre
 * en dessous. Même grille que les sections du colophon.
 */
export function NumberedSection({
  id,
  number,
  title,
  aside,
  children,
  className,
}: NumberedSectionProps) {
  const titleId = `${id}-titre`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("border-t-[1.5px] border-ink py-16 lg:py-28", className)}
    >
      <div className="numbered">
        <span aria-hidden className="numbered-mark">
          {number}
        </span>
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id={titleId} className="font-display text-section font-semibold">
              {title}
            </h2>
            {aside ? <p className="meta text-ink-soft">{aside}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
