import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP 3.15 et ses extensions, enregistrées une fois : le seul module de lib/ qui a un
 * effet à l'import. Il n'est jamais importé statiquement par une page : le chargeur des
 * moments (features/motion) et les onglets de dossier le demandent après l'affichage,
 * il reste donc hors du JavaScript initial.
 */
gsap.registerPlugin(ScrollTrigger, Flip, DrawSVGPlugin);

export { DrawSVGPlugin, Flip, gsap, ScrollTrigger };
