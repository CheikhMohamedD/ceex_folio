import type { ReactNode } from "react";

type ColophonSectionProps = {
  id: string;
  number: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

/**
 * Section numérotée du colophon : même grille que les sections de l'accueil.
 * Pas de `content-visibility: auto` ici : avec des hauteurs estimées, les liens du
 * sommaire tombaient à côté de leur section sur mobile.
 */
export function ColophonSection({ id, number, title, intro, children }: ColophonSectionProps) {
  const titleId = `${id}-titre`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="border-t-[1.5px] border-ink py-16 lg:py-32"
    >
      <div className="grid gap-x-6 gap-y-4 lg:grid-cols-[8.75rem_minmax(0,1fr)]">
        <span
          aria-hidden
          className="font-display text-[clamp(3rem,2.5rem+2vw,4.5rem)] leading-none font-bold text-stamp"
        >
          {number}
        </span>
        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h2 id={titleId} className="font-display text-section font-semibold">
              {title}
            </h2>
            {intro ? <div className="max-w-[68ch] text-ink-soft">{intro}</div> : null}
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Sous-titre d'un bloc à l'intérieur d'une section. */
export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-card font-semibold">{children}</h3>;
}
