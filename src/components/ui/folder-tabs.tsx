"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import { categoryClass, type Category } from "@/lib/design/categories";

const PANEL = "rounded-sheet border-[1.5px] border-ink bg-sheet p-4 shadow-sheet sm:p-6";

export type FolderTab = {
  id: string;
  label: string;
  count?: number;
  /** Liseré de 4 px de la couleur de catégorie sur l'onglet au repos. */
  category?: Category;
};

type FolderTabsProps = {
  /** Nom accessible de la liste d'onglets. */
  label: string;
  tabs: FolderTab[];
  defaultTab?: string;
  className?: string;
} & (
  | { panels: Record<string, ReactNode>; children?: never }
  /**
   * Mode filtre : un seul panneau, rendu une fois. L'onglet actif est posé dans
   * data-filter, et la CSS (.folder-filter) masque les éléments [data-category] d'une
   * autre catégorie. Le contenu n'est pas répété d'un onglet à l'autre.
   */
  | { children: ReactNode; panels?: never }
);

/**
 * Onglets de dossier : motif « tabs » de l'APG WAI-ARIA. Flèches gauche et droite,
 * Début et Fin pour se déplacer ; l'onglet actif passe en papier blanc et recouvre
 * le trait du dossier. Sur mobile, la rangée défile.
 */
export function FolderTabs({
  label,
  tabs,
  panels,
  children,
  defaultTab,
  className,
}: FolderTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    setActive(tab.id);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pt-1 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-onglet-${tab.id}`}
              aria-selected={selected}
              aria-controls={panels ? `${baseId}-panneau-${tab.id}` : `${baseId}-panneau`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={clsx(
                categoryClass(tab.category),
                "folder-tab",
                selected ? "top-[1.5px] z-10 bg-sheet" : "bg-kraft grain",
                !selected && tab.category && "shadow-[inset_0_4px_0_var(--cat)]",
              )}
            >
              {tab.label}
              {tab.count === undefined ? null : (
                <span
                  className={clsx("font-mono text-xs font-medium", selected && "text-stamp-strong")}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {panels ? (
        tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panneau-${tab.id}`}
            aria-labelledby={`${baseId}-onglet-${tab.id}`}
            hidden={tab.id !== active}
            tabIndex={0}
            className={PANEL}
          >
            {panels[tab.id]}
          </div>
        ))
      ) : (
        <div
          role="tabpanel"
          id={`${baseId}-panneau`}
          aria-labelledby={`${baseId}-onglet-${active}`}
          data-filter={active}
          tabIndex={0}
          className={clsx(PANEL, "folder-filter")}
        >
          {children}
        </div>
      )}
    </div>
  );
}
