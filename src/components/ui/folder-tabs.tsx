"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import type * as MotionModule from "@/lib/motion/gsap";
import { categoryClass, type Category } from "@/lib/design/categories";

const PANEL = "rounded-sheet border-[1.5px] border-ink bg-sheet p-4 shadow-sheet sm:p-6";

// Import de type seulement : GSAP n'entre pas dans le JavaScript des onglets.
type Motion = typeof MotionModule;
type FlipState = ReturnType<Motion["Flip"]["getState"]>;

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
  const panel = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion | null>(null);
  const flip = useRef<FlipState | null>(null);

  // Mode filtre : GSAP se charge au premier survol ou focus des onglets (jamais avant),
  // et seulement si le visiteur accepte les animations.
  function prepareMotion() {
    if (motion.current || children === undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("@/lib/motion/gsap").then((module) => {
      motion.current = module;
    });
  }

  function select(id: string) {
    if (id === active) return;
    if (motion.current && panel.current) {
      flip.current = motion.current.Flip.getState(
        panel.current.querySelectorAll("[data-category]"),
      );
    }
    setActive(id);
  }

  // N° 10 : les fiches glissent vers leur nouvelle place, les autres s'effacent.
  useLayoutEffect(() => {
    const state = flip.current;
    flip.current = null;
    if (!state || !motion.current) return;
    const { Flip, gsap } = motion.current;
    Flip.from(state, {
      duration: 0.4,
      ease: "power2.inOut",
      absolute: true,
      onEnter: (elements) =>
        gsap.fromTo(elements, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3 }),
      onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.96, duration: 0.2 }),
    });
  }, [active]);

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
    select(tab.id);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onPointerEnter={prepareMotion}
        onFocus={prepareMotion}
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
              onClick={() => select(tab.id)}
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
          ref={panel}
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
