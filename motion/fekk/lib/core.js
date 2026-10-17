/* Fekk motion — noyau partagé.
 * Tout le film est piloté par UNE timeline GSAP en pause : le rendu seek()e
 * image par image. Donc : aucune animation CSS, aucun setTimeout/requestAnimationFrame,
 * aucun Math.random() — utiliser FEKK.rng(seed). */
(function () {
  gsap.registerPlugin(CustomEase, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, SplitText);

  // Courbes signature, à réutiliser dans toutes les scènes pour une sensation homogène.
  CustomEase.create('fekk.snap', 'M0,0 C0.16,1 0.3,1 1,1');          // sortie très vive
  CustomEase.create('fekk.swift', 'M0,0 C0.7,0 0.1,1 1,1');          // in-out expressif
  CustomEase.create('fekk.anticip', 'M0,0 C0.36,-0.32 0.4,1 1,1');   // petite anticipation
  CustomEase.create('fekk.land', 'M0,0 C0.2,0 0.35,1.25 0.6,1 0.75,0.92 0.9,1 1,1'); // atterrissage + rebond

  const FEKK = {
    W: 1080,
    H: 1920,
    DURATION: 20,
    SCENES: [],
    frameHooks: [],

    // Palette — voir STORYBOARD.md
    C: {
      ink: '#0B1210',
      night: '#10213A',
      dusk: '#2A2350',
      sand: '#F3E6CF',
      sand2: '#E6CFA6',
      clay: '#C8643B',
      sunset: '#FF7A2F',
      green: '#00853F',
      mint: '#2BD67B',
      yellow: '#FDEF42',
      red: '#E31B23',
      blue: '#1F5FD1',
      white: '#FFFFFF',
    },

    /** PRNG déterministe (mulberry32). */
    rng(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    /** Crée un élément depuis une chaîne HTML/SVG. */
    el(html) {
      const tpl = document.createElement('template');
      tpl.innerHTML = html.trim();
      return tpl.content.firstElementChild;
    },

    /**
     * Déclare une scène.
     * { id, start, end, z?, build(root, tl, ctx) , onFrame?(tLocal) }
     * - root : <div class="layer"> 1080×1920 propre à la scène (overflow hidden).
     * - tl   : timeline GSAP dont t=0 correspond à `start` (temps absolu du film).
     * - La couche est visible uniquement pendant [start, end].
     * - onFrame(tLocal) : appelée après chaque seek si la scène est visible (canvas, particules…).
     */
    scene(def) {
      FEKK.SCENES.push(def);
    },
  };

  window.FEKK = FEKK;
})();
