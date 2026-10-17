/** Préférence de thème : celle du système, ou un choix forcé gardé dans le navigateur. */
export type ThemeChoice = "system" | "light" | "dark";

/** Ordre du bouton de thème : système, clair, sombre, puis retour au système. */
export const THEME_ORDER: readonly ThemeChoice[] = ["system", "light", "dark"];

export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return THEME_ORDER[(THEME_ORDER.indexOf(choice) + 1) % THEME_ORDER.length] ?? "system";
}

export const THEME_STORAGE_KEY = "ceex-theme";
export const THEME_EVENT = "ceex-theme-change";

export function readThemeChoice(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyThemeChoice(choice: ThemeChoice): void {
  const root = document.documentElement;
  try {
    if (choice === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  window.dispatchEvent(new Event(THEME_EVENT));
}

/**
 * Script inline exécuté avant le premier affichage : applique le thème forcé sans
 * flash. Il est constant ; la CSP autorise les scripts inline (voir security/headers).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;
