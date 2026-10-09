/* Assets partagés : LE téléphone perdu (doit être identique dans toutes les scènes)
 * et le logo Fekk. Tous en SVG inline, sans dépendance externe. */
(function () {
  const C = FEKK.C;

  FEKK.ASSETS = {
    /* Téléphone perdu — face avant (écran verrouillé, 18:47). viewBox 200×400. */
    phoneFront: `
<svg class="asset-phone-front" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="196" height="396" rx="34" fill="${C.blue}"/>
  <rect x="10" y="10" width="180" height="380" rx="27" fill="#0A0D14"/>
  <rect x="16" y="16" width="168" height="368" rx="22" fill="url(#pfScreen)"/>
  <defs>
    <linearGradient id="pfScreen" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#2A2350"/><stop offset="0.6" stop-color="#C8643B"/><stop offset="1" stop-color="#FF7A2F"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="30" r="5" fill="#0A0D14"/>
  <text x="100" y="118" text-anchor="middle" font-family="Inter Variable, sans-serif" font-weight="300" font-size="58" fill="#fff">18:47</text>
  <text x="100" y="146" text-anchor="middle" font-family="Inter Variable, sans-serif" font-weight="500" font-size="14" fill="#fff" opacity="0.8">vendredi 9 octobre</text>
  <rect x="70" y="362" width="60" height="5" rx="2.5" fill="#fff" opacity="0.7"/>
</svg>`,

    /* Téléphone perdu — dos (coque bleue, module photo). viewBox 200×400. */
    phoneBack: `
<svg class="asset-phone-back" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="196" height="396" rx="34" fill="${C.blue}"/>
  <rect x="14" y="14" width="172" height="372" rx="26" fill="#2A6FE6"/>
  <rect x="26" y="26" width="74" height="112" rx="22" fill="#0A0D14"/>
  <circle cx="63" cy="56" r="17" fill="#1B2233" stroke="#3A4560" stroke-width="4"/>
  <circle cx="63" cy="104" r="17" fill="#1B2233" stroke="#3A4560" stroke-width="4"/>
  <circle cx="63" cy="56" r="6" fill="#4C6FFF" opacity="0.6"/>
  <circle cx="63" cy="104" r="6" fill="#4C6FFF" opacity="0.6"/>
  <circle cx="120" cy="44" r="6" fill="#FDEF42" opacity="0.9"/>
  <path d="M100 250 l10 -20 l10 20 l-10 20 z" fill="#FDEF42" opacity="0.9"/>
</svg>`,

    /* Logo Fekk : épingle de localisation verte dont la tête est une loupe.
     * viewBox 120×160. Les sous-éléments ont des classes pour l'animation :
     * .logo-pin (silhouette), .logo-ring (anneau de loupe, stroke → DrawSVG), .logo-handle (manche). */
    logoMark: `
<svg class="asset-logo" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
  <path class="logo-pin" d="M60 4C30.2 4 8 26.6 8 56.5 8 95 60 154 60 154S112 95 112 56.5C112 26.6 89.8 4 60 4Z" fill="${C.green}"/>
  <circle class="logo-ring" cx="56" cy="52" r="20" fill="none" stroke="#fff" stroke-width="9"/>
  <path class="logo-handle" d="M70.5 66.5 L84 80" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
  <circle class="logo-dot" cx="56" cy="52" r="6" fill="${C.yellow}"/>
</svg>`,
  };
})();
