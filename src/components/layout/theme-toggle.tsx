"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  applyThemeChoice,
  nextThemeChoice,
  readThemeChoice,
  THEME_EVENT,
  type ThemeChoice,
} from "@/lib/theme";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

const serverSnapshot = (): ThemeChoice => "system";

type ThemeToggleProps = {
  /** Nom accessible pour chaque choix en cours, préparé par le serveur. */
  labels: Record<ThemeChoice, string>;
  /** Icône de chaque choix, rendue par le serveur. */
  icons: Record<ThemeChoice, ReactNode>;
};

/**
 * Bouton de thème : système, clair, puis sombre. L'icône montre le choix en cours.
 * Textes et icônes arrivent tout prêts du serveur : ce composant client n'embarque
 * ni traductions, ni bibliothèque d'icônes.
 */
export function ThemeToggle({ labels, icons }: ThemeToggleProps) {
  const choice = useSyncExternalStore(subscribe, readThemeChoice, serverSnapshot);
  const label = labels[choice];

  return (
    <button
      type="button"
      onClick={() => applyThemeChoice(nextThemeChoice(choice))}
      aria-label={label}
      title={label}
      className="inline-grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-ink transition-colors hover:bg-sheet"
    >
      {icons[choice]}
    </button>
  );
}
