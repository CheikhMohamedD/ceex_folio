"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import { categoryClass, type Category } from "@/lib/design/categories";

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
  panels: Record<string, ReactNode>;
  defaultTab?: string;
  className?: string;
};

/**
 * Onglets de dossier : motif « tabs » de l'APG WAI-ARIA. Flèches gauche et droite,
 * Début et Fin pour se déplacer ; l'onglet actif passe en papier blanc et recouvre
 * le trait du dossier. Sur mobile, la rangée défile.
 */
export function FolderTabs({ label, tabs, panels, defaultTab, className }: FolderTabsProps) {
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
              aria-controls={`${baseId}-panneau-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={clsx(
                categoryClass(tab.category),
                "relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-tab border-[1.5px] border-b-0 border-ink px-4 font-display text-[0.9375rem] font-semibold text-ink focus-visible:outline-offset-[-5px]",
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
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panneau-${tab.id}`}
          aria-labelledby={`${baseId}-onglet-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="rounded-sheet border-[1.5px] border-ink bg-sheet p-4 shadow-sheet sm:p-6"
        >
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
