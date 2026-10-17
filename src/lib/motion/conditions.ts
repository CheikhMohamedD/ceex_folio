/**
 * Quand animer, et quand ajouter la 3D : la doc d'architecture fixe ces seuils.
 * Si une condition manque, le visiteur reste à la couche précédente, sans rien
 * perdre du contenu.
 */
export type Environment = {
  /** Largeur de la fenêtre, en px CSS. */
  width: number;
  reducedMotion: boolean;
  /** Économiseur de données du navigateur (navigator.connection.saveData). */
  saveData: boolean;
  /** navigator.hardwareConcurrency ; 0 quand le navigateur ne le dit pas. */
  cores: number;
  webgl2: boolean;
};

/** Desktop : la scène Three.js du hero, et l'amplitude pleine du parallaxe. */
export const DESKTOP_WIDTH = 1024;
export const MIN_CORES = 4;
/** Densité de pixels maximale du rendu 3D. */
export const MAX_PIXEL_RATIO = 1.5;

/** GSAP : tout sauf « réduire les animations ». */
export function canAnimate(environment: Pick<Environment, "reducedMotion">): boolean {
  return !environment.reducedMotion;
}

/** Three.js : 1 024 px et plus, WebGL2, 4 cœurs ou plus, sans économiseur, animations permises. */
export function canRunHeroScene(environment: Environment): boolean {
  return (
    canAnimate(environment) &&
    environment.width >= DESKTOP_WIDTH &&
    environment.webgl2 &&
    environment.cores >= MIN_CORES &&
    !environment.saveData
  );
}

/** Lu dans le navigateur : à n'appeler qu'après l'hydratation. */
export function readEnvironment(): Environment {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let webgl2 = false;
  try {
    webgl2 = Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    webgl2 = false;
  }
  return {
    width: window.innerWidth,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
    cores: navigator.hardwareConcurrency || 0,
    webgl2,
  };
}

/**
 * Page au repos : après le chargement, puis au premier moment libre du navigateur.
 * Rien d'animé ne passe avant l'affichage ni ne concurrence le premier rendu.
 */
export function whenIdle(callback: () => void, timeout = 2000): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => !cancelled && callback(), { timeout });
    } else {
      timer = setTimeout(() => !cancelled && callback(), 200);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timer !== undefined) clearTimeout(timer);
  };
}
