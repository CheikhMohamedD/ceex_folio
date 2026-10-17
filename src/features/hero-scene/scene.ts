import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { MAX_PIXEL_RATIO } from "@/lib/motion/conditions";

/**
 * Scène signature du hero (n° 2) : les vignettes du collage deviennent des feuilles de
 * papier qui flottent. Le pointeur incline la pile, le défilement écarte les feuilles,
 * un clic sur une feuille de projet ouvre son étude de cas. Three.js direct, seulement
 * les classes utiles ; ombre nette dessinée sous chaque feuille, sans calcul d'ombre.
 *
 * Économie : rendu seulement quand quelque chose bouge (pointeur, défilement, retour au
 * repos), pause hors écran, densité de pixels limitée à 1,5.
 */
export type SheetSpec = {
  pattern: "hatch" | "hatch-reverse" | "kraft";
  /** « N° 01 · Seetalma » pour les feuilles de projet. */
  label?: string;
  /** Couleur de catégorie du point de l'étiquette (variable CSS). */
  category?: string;
  /** Coin de l'étiquette, comme sur le collage statique. */
  corner?: "top" | "bottom";
  href?: string;
};

type Sheet = {
  spec: SheetSpec;
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  shadow: Mesh<PlaneGeometry, MeshBasicMaterial>;
  home: { x: number; y: number };
  phase: number;
};

const FOV = 30;
const TILT = (4 * Math.PI) / 180;
const SHADOW_OFFSET = 6;
const SPREAD = 0.18;
const SETTLE_MS = 2500;

function cssColor(element: HTMLElement, name: string, fallback: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

/** Feuille dessinée sur un canvas : motif papier, trait d'encre, étiquette éventuelle. */
function paint(
  element: HTMLElement,
  spec: SheetSpec,
  width: number,
  height: number,
  ratio: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  context.scale(ratio, ratio);

  const ink = cssColor(element, "--ink", "#1a1a1a");
  const radius = 4;
  context.beginPath();
  context.roundRect(0.75, 0.75, width - 1.5, height - 1.5, radius);
  context.save();
  context.clip();
  if (spec.pattern === "kraft") {
    context.fillStyle = cssColor(element, "--kraft", "#d9c4a0");
    context.fillRect(0, 0, width, height);
  } else {
    context.fillStyle = cssColor(element, "--hatch-a", "#f2ece0");
    context.fillRect(0, 0, width, height);
    context.strokeStyle = cssColor(element, "--hatch-b", "#ede3d1");
    context.lineWidth = 8 * Math.SQRT2;
    const direction = spec.pattern === "hatch" ? 1 : -1;
    for (let offset = -height; offset < width + height; offset += 16 * Math.SQRT2) {
      context.beginPath();
      context.moveTo(offset, direction > 0 ? height : 0);
      context.lineTo(offset + height, direction > 0 ? 0 : height);
      context.stroke();
    }
  }
  context.restore();
  context.lineWidth = 1.5;
  context.strokeStyle = ink;
  context.beginPath();
  context.roundRect(0.75, 0.75, width - 1.5, height - 1.5, radius);
  context.stroke();

  if (spec.label) {
    const mono = getComputedStyle(element).getPropertyValue("--font-plex-mono") || "monospace";
    context.font = `500 11px ${mono}`;
    context.letterSpacing = "0.88px";
    const text = spec.label.toUpperCase();
    const padding = 8;
    const labelWidth = context.measureText(text).width + padding * 2 + 14;
    const top = spec.corner === "bottom" ? height - 12 - 24 : 12;
    context.fillStyle = cssColor(element, "--sheet", "#fbf9f5");
    context.fillRect(12, top, labelWidth, 24);
    context.lineWidth = 1;
    context.strokeStyle = ink;
    context.strokeRect(12.5, top + 0.5, labelWidth - 1, 23);
    context.fillStyle = spec.category ? cssColor(element, spec.category, ink) : ink;
    context.beginPath();
    context.arc(12 + padding + 4, top + 12, 4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = ink;
    context.textBaseline = "middle";
    context.fillText(text, 12 + padding + 14, top + 12.5);
  }
  return canvas;
}

export type HeroScene = { destroy(): void };

export function mountHeroScene(
  container: HTMLElement,
  specs: SheetSpec[],
  { open }: { open: (href: string) => void },
): HeroScene {
  const hero = container.closest<HTMLElement>('[data-motion="hero"]') ?? container;
  const tiles = [...container.querySelectorAll<HTMLElement>("[data-tile]")];
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(ratio);
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "hero-scene";
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 10000);
  const pile = new Group();
  scene.add(pile);
  const raycaster = new Raycaster();
  const pointer = new Vector2(2, 2);
  let sheets: Sheet[] = [];
  let width = 0;
  let height = 0;

  function build() {
    for (const sheet of sheets) {
      pile.remove(sheet.mesh, sheet.shadow);
      sheet.mesh.geometry.dispose();
      sheet.mesh.material.map?.dispose();
      sheet.mesh.material.dispose();
      sheet.shadow.material.dispose();
    }
    const box = container.getBoundingClientRect();
    width = box.width;
    height = box.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Le plan z = 0 tombe pile sur les pixels CSS : les feuilles recouvrent le collage.
    camera.position.set(0, 0, height / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.updateProjectionMatrix();
    const ink = cssColor(container, "--ink", "#1a1a1a");

    sheets = tiles.flatMap((tile, index) => {
      const spec = specs[index];
      if (!spec) return [];
      const rect = tile.getBoundingClientRect();
      const x = rect.left - box.left + rect.width / 2 - width / 2;
      const y = height / 2 - (rect.top - box.top + rect.height / 2);
      const geometry = new PlaneGeometry(rect.width, rect.height);
      const texture = new CanvasTexture(paint(container, spec, rect.width, rect.height, ratio));
      texture.colorSpace = SRGBColorSpace;
      const mesh = new Mesh(geometry, new MeshBasicMaterial({ map: texture, transparent: true }));
      const shadow = new Mesh(geometry, new MeshBasicMaterial({ color: ink }));
      mesh.position.set(x, y, 0);
      shadow.position.set(x + SHADOW_OFFSET, y - SHADOW_OFFSET, -1);
      mesh.userData = { href: spec.href };
      pile.add(shadow, mesh);
      return [{ spec, mesh, shadow, home: { x, y }, phase: index * 0.9 }];
    });
  }

  // État animé : inclinaison visée, écartement au défilement, flottement au réveil.
  const target = { tiltX: 0, tiltY: 0, spread: 0 };
  let awakeUntil = 0;
  let frame = 0;
  let visible = true;

  function spreadFromScroll() {
    const box = hero.getBoundingClientRect();
    target.spread = Math.min(Math.max(-box.top / Math.max(box.height, 1), 0), 1);
  }

  function tick(time: number) {
    frame = 0;
    const settle = (value: number, goal: number) => value + (goal - value) * 0.08;
    pile.rotation.x = settle(pile.rotation.x, target.tiltX);
    pile.rotation.y = settle(pile.rotation.y, target.tiltY);
    const awake = time < awakeUntil;
    const float = awake ? Math.min((awakeUntil - time) / SETTLE_MS, 1) : 0;
    for (const sheet of sheets) {
      const spread = 1 + target.spread * SPREAD;
      const lift = Math.sin(time / 700 + sheet.phase) * 6 * float;
      sheet.mesh.position.x = settle(sheet.mesh.position.x, sheet.home.x * spread);
      sheet.mesh.position.y = settle(sheet.mesh.position.y, sheet.home.y * spread + lift);
      sheet.mesh.position.z = 10 * float + lift;
      sheet.shadow.position.x = sheet.mesh.position.x + SHADOW_OFFSET;
      sheet.shadow.position.y = sheet.mesh.position.y - SHADOW_OFFSET;
    }
    renderer.render(scene, camera);
    const moving =
      awake ||
      Math.abs(pile.rotation.x - target.tiltX) > 0.0005 ||
      Math.abs(pile.rotation.y - target.tiltY) > 0.0005 ||
      sheets.some(
        (sheet) =>
          Math.abs(sheet.mesh.position.x - sheet.home.x * (1 + target.spread * SPREAD)) > 0.2,
      );
    if (moving && visible) frame = requestAnimationFrame(tick);
  }

  function wake() {
    awakeUntil = performance.now() + SETTLE_MS;
    if (!frame && visible) frame = requestAnimationFrame(tick);
  }

  function hit(event: PointerEvent | MouseEvent): Sheet | undefined {
    const box = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -((event.clientY - box.top) / box.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const [first] = raycaster.intersectObjects(sheets.map((sheet) => sheet.mesh));
    return sheets.find((sheet) => sheet.mesh === first?.object);
  }

  // La fiche centrale et ses liens passent avant la scène.
  const blocked = (event: Event) =>
    event.target instanceof Element && event.target.closest('[data-motion="hero-sheet"] > *');

  const onPointerMove = (event: PointerEvent) => {
    const box = hero.getBoundingClientRect();
    target.tiltY = ((event.clientX - box.left) / box.width - 0.5) * 2 * TILT;
    target.tiltX = ((event.clientY - box.top) / box.height - 0.5) * 2 * TILT;
    hero.style.cursor = !blocked(event) && hit(event)?.spec.href ? "pointer" : "";
    wake();
  };
  const onPointerLeave = () => {
    target.tiltX = 0;
    target.tiltY = 0;
    hero.style.cursor = "";
    wake();
  };
  const onClick = (event: MouseEvent) => {
    if (blocked(event)) return;
    const href = hit(event)?.spec.href;
    if (href) open(href);
  };
  const onScroll = () => {
    spreadFromScroll();
    wake();
  };

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
      wake();
    }, 200);
  };

  // Thème changé (bouton ou système) : les feuilles sont repeintes.
  const themeObserver = new MutationObserver(onResize);
  themeObserver.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", onResize);

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) wake();
  });
  visibility.observe(hero);

  hero.addEventListener("pointermove", onPointerMove);
  hero.addEventListener("pointerleave", onPointerLeave);
  hero.addEventListener("click", onClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  build();
  spreadFromScroll();
  wake();
  // Fondu par-dessus le collage statique, qui s'efface ensuite (globals.css).
  requestAnimationFrame(() => container.setAttribute("data-scene", "on"));

  return {
    destroy() {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      themeObserver.disconnect();
      scheme.removeEventListener("change", onResize);
      visibility.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      hero.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      hero.style.cursor = "";
      container.removeAttribute("data-scene");
      for (const sheet of sheets) {
        sheet.mesh.geometry.dispose();
        sheet.mesh.material.map?.dispose();
        sheet.mesh.material.dispose();
        sheet.shadow.material.dispose();
      }
      renderer.dispose();
      canvas.remove();
    },
  };
}
