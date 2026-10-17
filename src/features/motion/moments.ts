import { DESKTOP_WIDTH } from "@/lib/motion/conditions";
import { leadingNumber } from "@/lib/motion/numbers";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

/**
 * Les moments GSAP de la « Carte des animations » (numéros de l'artboard du canvas).
 * Les composants serveur posent seulement des attributs data-motion ; tout part d'ici,
 * une fois la page au repos. Chaque animation part de l'état final, déjà dans le HTML :
 * sans JavaScript, ou avec « réduire les animations », rien ne manque.
 *
 * Les moments visibles dès le chargement (tampon « Disponible », mots sous GOTF) sont
 * en CSS (globals.css) : chargé après l'affichage, GSAP les ferait sauter.
 */

// Déclenchement dès que l'élément entre vraiment dans la fenêtre : même tout en bas de la
// page, il atteint ce seuil, et rien ne reste masqué.
const ENTER = "top 92%";
const STAMP_EASE = "back.out(2.2)";

/** N° 7 et 11 : coup de tampon à l'entrée (numéros de section, « À la une »). */
function stamps(root: ParentNode) {
  for (const element of root.querySelectorAll<HTMLElement>('[data-motion="stamp"]')) {
    gsap.from(element, {
      scale: 1.35,
      opacity: 0,
      duration: 0.25,
      ease: STAMP_EASE,
      scrollTrigger: { trigger: element, start: ENTER, once: true },
    });
  }
}

/** N° 8 : les tuiles sortent du dossier une à une, 24 px vers le haut. */
function rises(root: ParentNode) {
  for (const list of root.querySelectorAll<HTMLElement>('[data-motion="rise"]')) {
    gsap.from(list.children, {
      y: 24,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: { trigger: list, start: ENTER, once: true },
    });
  }
}

/** N° 9 : le trait manuscrit se dessine sous la devise. */
function drawings(root: ParentNode) {
  for (const svg of root.querySelectorAll<SVGElement>('[data-motion="draw"]')) {
    gsap.from(svg.querySelectorAll("path"), {
      drawSVG: "0%",
      duration: 0.7,
      stagger: 0.15,
      ease: "power1.inOut",
      scrollTrigger: { trigger: svg, start: ENTER, once: true },
    });
  }
}

/** N° 12 : les chiffres clés comptent jusqu'à leur valeur, déjà écrite dans le HTML. */
function counters(root: ParentNode, locale: string) {
  const format = new Intl.NumberFormat(locale);
  for (const element of root.querySelectorAll<HTMLElement>('[data-motion="count"]')) {
    const original = element.textContent ?? "";
    const parsed = leadingNumber(original);
    if (!parsed) continue;
    const state = { value: 0 };
    gsap.to(state, {
      value: parsed.value,
      duration: 1.1,
      ease: "power2.out",
      snap: { value: 1 },
      scrollTrigger: { trigger: element, start: ENTER, once: true },
      onStart: () => element.classList.add("tabular-nums"),
      onUpdate: () => {
        element.textContent = `${format.format(state.value)}${parsed.rest}`;
      },
      onComplete: () => {
        element.textContent = original;
      },
    });
  }
}

/** N° 18 : le point 01 se remplit, puis les tirets se tracent vers 02 et 03. */
function contactSteps(root: ParentNode) {
  for (const list of root.querySelectorAll<HTMLElement>('[data-motion="steps"]')) {
    const horizontal = getComputedStyle(list).display === "grid";
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: list, start: ENTER, once: true },
    });
    list.querySelectorAll<HTMLElement>("[data-motion-dot]").forEach((dot, index) => {
      timeline.from(dot, { scale: 0.4, opacity: 0, duration: 0.25, ease: STAMP_EASE }, index * 0.35);
    });
    list.querySelectorAll<HTMLElement>("[data-motion-line]").forEach((line, index) => {
      timeline.from(
        line,
        horizontal
          ? { scaleX: 0, transformOrigin: "left center", duration: 0.35, ease: "none" }
          : { scaleY: 0, transformOrigin: "center top", duration: 0.35, ease: "none" },
        0.2 + index * 0.35,
      );
    });
  }
}

/** N° 5 : la fiche du hero monte un peu plus vite que le collage ; moitié moins sur mobile. */
function heroParallax(root: ParentNode, mobile: boolean) {
  const hero = root.querySelector<HTMLElement>('[data-motion="hero"]');
  if (!hero) return;
  const sheet = hero.querySelector('[data-motion="hero-sheet"]');
  const collage = hero.querySelector('[data-motion="hero-collage"]');
  const amplitude = mobile ? 0.5 : 1;
  const scrollTrigger = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  if (sheet) gsap.to(sheet, { y: -64 * amplitude, ease: "none", scrollTrigger });
  if (collage) gsap.to(collage, { y: 32 * amplitude, ease: "none", scrollTrigger });
}

/** N° 15 : sur desktop, la bande Hobbies glisse vers la gauche au défilement, sans bloquer la page. */
function hobbiesDrift(root: ParentNode, mobile: boolean) {
  if (mobile) return; // Sur mobile, on glisse la bande au doigt.
  const region = root.querySelector<HTMLElement>('[data-motion="drift"]');
  const strip = region?.firstElementChild as HTMLElement | null;
  if (!region || !strip) return;
  const overflow = region.style.overflowX;
  region.style.overflowX = "hidden";
  gsap.to(strip, {
    x: () => -Math.max(0, strip.scrollWidth - region.clientWidth),
    ease: "none",
    scrollTrigger: {
      trigger: region,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
      onKill: () => {
        region.style.overflowX = overflow;
      },
    },
  });
}

/**
 * N° 1 : un trait rouge glisse sous la section en cours, dans la barre du haut comme
 * dans la barre d'onglets du bas. Seulement sur les pages qui ont ces sections.
 */
function sectionIndicator(root: ParentNode) {
  const bars = [...root.querySelectorAll<HTMLElement>('[data-motion="sections"]')];
  if (bars.length === 0) return;
  const sections = [
    ...new Set(
      bars.flatMap((bar) =>
        [...bar.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')].map(
          (link) => new URL(link.href).hash.slice(1),
        ),
      ),
    ),
  ]
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section !== null);
  if (sections.length === 0) return;

  const marks = bars.map((bar) => {
    const mark = document.createElement("span");
    mark.setAttribute("aria-hidden", "true");
    mark.className = "section-mark";
    bar.append(mark);
    gsap.set(mark, { opacity: 0 });
    return { bar, mark };
  });

  const show = (id: string | null) => {
    for (const { bar, mark } of marks) {
      const link = id ? bar.querySelector<HTMLElement>(`a[href$="#${CSS.escape(id)}"]`) : null;
      if (!link) {
        gsap.to(mark, { opacity: 0, duration: 0.2 });
        continue;
      }
      const box = bar.getBoundingClientRect();
      const target = link.getBoundingClientRect();
      gsap.to(mark, {
        x: target.left - box.left,
        width: target.width,
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  };

  for (const section of sections) {
    ScrollTrigger.create({
      trigger: section,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => (self.isActive ? show(section.id) : null),
    });
  }
  ScrollTrigger.create({
    trigger: sections[0],
    start: "top 45%",
    onLeaveBack: () => show(null),
  });
  return () => marks.forEach(({ mark }) => mark.remove());
}

export type MomentsOptions = { locale: string };

/** Lance les moments de la page ; renvoie de quoi tout défaire (changement de page). */
export function playMoments(root: ParentNode, { locale }: MomentsOptions): () => void {
  const mobile = window.innerWidth < DESKTOP_WIDTH;
  let removeMarks: (() => void) | undefined;
  const context = gsap.context(() => {
    stamps(root);
    rises(root);
    drawings(root);
    counters(root, locale);
    contactSteps(root);
    heroParallax(root, mobile);
    hobbiesDrift(root, mobile);
    removeMarks = sectionIndicator(root);
  });
  return () => {
    context.revert();
    removeMarks?.();
  };
}
