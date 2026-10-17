import type { ReactNode } from "react";

type CoulissesSectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
};

/** Section d'une page des Coulisses : surtitre mono, titre, chapeau. Rien d'animé ici. */
export function CoulissesSection({ id, eyebrow, title, lead, children }: CoulissesSectionProps) {
  const titleId = `${id}-titre`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-6 border-t-[1.5px] border-ink pt-8"
    >
      <header className="flex flex-col gap-2">
        {eyebrow ? <p className="meta text-stamp-strong">{eyebrow}</p> : null}
        <h2 id={titleId} className="font-display text-card font-semibold">
          {title}
        </h2>
        {lead ? <p className="max-w-[64ch] text-ink-soft">{lead}</p> : null}
      </header>
      {children}
    </section>
  );
}
