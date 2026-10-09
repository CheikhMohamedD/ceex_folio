/* S1 — « L'instant » · 0.00 → 3.50
 * Le hook : Dakar à 18h47, un car rapide s'arrête, repart… et un téléphone
 * s'échappe de la porte arrière. Ralenti au sommet devant le soleil, impact,
 * texte cinétique, puis plongée dans l'écran éteint → plein cadre ink.
 * Tout est piloté par `tl` ; onFrame (pur) ne gère que la traînée et la face visible. */
(function () {
  const ID = 's1';
  const START = 0;
  const END = 3.5;

  // --- Repères (coordonnées « sol » = calque qui porte route, car et téléphone) ---
  const CAR_LEFT = 110, CAR_TOP = 1090, CAR_K = 0.95;          // svg du car : 860×440 → ×0.95
  const HAND = [918, 1316];                                      // main de l'apprenti (sol)
  const LAND = [600, 1655];                                      // point d'impact (sol)
  const FALL_PATH = `M${HAND[0]},${HAND[1]} C850,760 700,760 ${LAND[0]},${LAND[1]}`;
  const T_EJECT = 1.15, T_IMPACT = 2.3, FALL_D = T_IMPACT - T_EJECT;
  const T_ZOOM = 3.1, T_BLACK = 3.44;
  // Dérive caméra par plan (valeur à t=0 → valeur à T_ZOOM).
  const DRIFT = { sky: [8, -6], sun: [16, -12], far: [30, -25], mid: [56, -45], ground: [80, -60], fg: [220, -160] };
  const PHONE_W = 150, PHONE_H = 300;

  // Partagés avec onFrame.
  let R = null;

  function buildCar(C) {
    const Y = '#FBD234', YD = '#E3AE12', B = '#2C8FD8', BD = '#1E6FB0', GL = '#1C2540', SIL = '#0E1220';
    // Fenêtres latérales + passagers
    let wins = '', pax = '';
    const wx0 = 212, ww = 94, wg = 11;
    const heads = [[248, 150], [286, 156], [358, 148], [452, 152], [496, 158], [560, 150], [648, 154], [700, 149]];
    for (let i = 0; i < 5; i++) {
      const x = wx0 + i * (ww + wg);
      wins += `<rect x="${x}" y="118" width="${ww}" height="60" rx="7" fill="${GL}"/>`;
      wins += `<path d="M${x + 14} 118 L${x + 40} 118 L${x + 14} 178 L${x - 6 > x ? x : x} 178 Z" fill="#FF9F5A" opacity="0.22"/>`;
      wins += `<path d="M${x + 52} 118 L${x + 60} 118 L${x + 36} 178 L${x + 28} 178 Z" fill="#FFD9A8" opacity="0.18"/>`;
    }
    heads.forEach(([hx, hy], i) => {
      pax += `<path d="M${hx - 22} 182 Q${hx - 20} ${hy + 14} ${hx} ${hy + 12} Q${hx + 20} ${hy + 14} ${hx + 22} 182 Z" fill="${SIL}"/>`;
      pax += `<circle cx="${hx}" cy="${hy}" r="${11 + (i % 3)}" fill="${SIL}"/>`;
      if (i % 3 === 1) pax += `<path d="M${hx - 13} ${hy - 4} Q${hx} ${hy - 22} ${hx + 13} ${hy - 4} Z" fill="${['#E31B23', '#00853F', '#C8643B'][i % 3]}"/>`;
    });
    // Fenêtres : rails de séparation (montants jaunes)
    let pillars = '';
    for (let i = 0; i < 4; i++) {
      const x = wx0 + (i + 1) * (ww + wg) - wg;
      pillars += `<rect x="${x}" y="114" width="${wg}" height="68" fill="${Y}"/><rect x="${x + wg - 3}" y="114" width="3" height="68" fill="${YD}"/>`;
    }
    // Galerie : montants
    let posts = '';
    for (let x = 214; x <= 740; x += 66) posts += `<rect x="${x}" y="80" width="5" height="18" fill="#BDB6AA"/>`;
    // Échelle arrière
    let rungs = '';
    for (let y = 92; y <= 312; y += 22) rungs += `<rect x="768" y="${y}" width="14" height="4" rx="2" fill="#D9D4CC"/>`;
    // Losanges peints (droite du flanc)
    let diamonds = '';
    [[612, '#00853F'], [650, '#E31B23'], [688, '#00853F'], [726, '#E31B23']].forEach(([x, f]) => {
      diamonds += `<path d="M${x} 214 l14 22 l-14 22 l-14 -22 z" fill="${f}" stroke="#fff" stroke-width="3"/>`;
      diamonds += `<circle cx="${x}" cy="236" r="4" fill="#FDEF42"/>`;
    });
    let dots = '';
    for (let x = 220; x < 740; x += 20) dots += `<circle cx="${x}" cy="270" r="3" fill="#fff" opacity="0.85"/>`;
    // Franges au-dessus du pare-brise
    let fringe = '';
    const fc = ['#E31B23', '#00853F', '#FDEF42', '#fff'];
    for (let i = 0; i < 9; i++) fringe += `<path d="M${118 + i * 10} 110 l10 0 l-5 12 z" fill="${fc[i % 4]}"/>`;

    return `
<svg class="s1-car" viewBox="0 0 860 440" width="${860 * CAR_K}" height="${440 * CAR_K}" overflow="visible" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="s1-wax" width="26" height="26" patternUnits="userSpaceOnUse">
      <rect width="26" height="26" fill="#F7A21B"/>
      <circle cx="13" cy="13" r="8" fill="#00853F"/><circle cx="13" cy="13" r="3.5" fill="#FDEF42"/>
      <path d="M0 0h7L0 7Z M26 26h-7l7-7Z M26 0v7l-7-7Z M0 26v-7l7 7Z" fill="#E31B23"/>
    </pattern>
    <pattern id="s1-zig" width="30" height="57" patternUnits="userSpaceOnUse">
      <rect width="30" height="57" fill="${B}"/>
      <path d="M0 24 L7.5 12 L15 24 L22.5 12 L30 24" fill="none" stroke="#FDEF42" stroke-width="4" stroke-linejoin="round"/>
      <path d="M0 36 L7.5 48 L15 36 L22.5 48 L30 36" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" opacity="0.9"/>
      <circle cx="15" cy="30" r="2.5" fill="#E31B23"/>
    </pattern>
    <pattern id="s1-mat" width="16" height="18" patternUnits="userSpaceOnUse">
      <rect width="16" height="18" fill="#F3E6CF"/><rect width="5" height="18" fill="#E31B23"/><rect x="9" width="3" height="18" fill="#00853F"/>
    </pattern>
    <clipPath id="s1-bodyclip">
      <path d="M52 345 L44 262 Q42 222 72 214 L122 204 L166 112 Q174 96 194 96 L748 96 Q766 96 766 118 L766 330 Q766 345 750 345 Z"/>
    </clipPath>
  </defs>

  <!-- Ombre portée dure, projetée vers la caméra (contre-jour) -->
  <path class="s1-car-shadow" d="M28 402 L790 402 L860 440 L-30 440 Z" fill="#12090F" opacity="0.6"/>

  <g class="s1-car-body">
    <!-- Porte arrière ouverte (derrière l'apprenti) -->
    <g class="s1-door">
      <path d="M786 112 L842 124 L842 330 L786 342 Z" fill="${YD}"/>
      <path d="M790 122 L836 132 L836 186 L790 180 Z" fill="${GL}"/>
      <path d="M786 270 L842 266 L842 330 L786 342 Z" fill="${BD}"/>
      <path d="M786 112 L842 124 L842 130 L786 119 Z" fill="#F4F0E6"/>
      <rect x="826" y="210" width="10" height="5" rx="2" fill="#D9D4CC"/>
    </g>

    <!-- Galerie de toit chargée de bagages ficelés -->
    <g class="s1-bags">
      <rect x="206" y="78" width="546" height="7" rx="3.5" fill="#E6E2DA"/>
      <rect x="206" y="83" width="546" height="2" fill="#9C9488"/>
      ${posts}
      <g class="s1-bag-a">
        <rect x="222" y="34" width="112" height="46" rx="9" fill="#E31B23"/>
        <rect x="222" y="34" width="112" height="10" rx="5" fill="#FF5A5F"/>
        <rect x="262" y="26" width="32" height="10" rx="5" fill="none" stroke="#7A0E12" stroke-width="5"/>
        <rect x="236" y="34" width="6" height="46" fill="#7A0E12" opacity="0.5"/><rect x="312" y="34" width="6" height="46" fill="#7A0E12" opacity="0.5"/>
        <rect x="222" y="70" width="112" height="10" rx="4" fill="#A6141A"/>
      </g>
      <g class="s1-bag-b">
        <rect x="338" y="22" width="132" height="58" rx="24" fill="url(#s1-wax)"/>
        <rect x="338" y="62" width="132" height="18" rx="9" fill="#000" opacity="0.18"/>
        <path d="M404 22 Q398 8 410 2 Q420 10 412 22" fill="#F7A21B" stroke="#00853F" stroke-width="2"/>
        <rect x="360" y="4" width="160" height="20" rx="10" fill="url(#s1-mat)"/>
        <rect x="360" y="16" width="160" height="8" rx="4" fill="#000" opacity="0.15"/>
        <circle cx="520" cy="14" r="10" fill="#F3E6CF"/><circle cx="520" cy="14" r="5" fill="none" stroke="#C8643B" stroke-width="2"/>
      </g>
      <g class="s1-bag-c">
        <rect x="474" y="44" width="78" height="36" rx="8" fill="#00853F"/>
        <path d="M474 52 Q513 40 552 52" fill="none" stroke="#2BD67B" stroke-width="3"/>
        <rect x="474" y="70" width="78" height="10" rx="4" fill="#005A2B"/>
        <rect x="556" y="30" width="88" height="50" rx="8" fill="#C8643B"/>
        <path d="M562 42h76M562 54h76M562 66h76" stroke="#8E3E1F" stroke-width="3"/>
        <path d="M576 30v50M598 30v50M620 30v50" stroke="#E08A5E" stroke-width="2.5"/>
        <rect x="648" y="50" width="86" height="30" rx="13" fill="#1F5FD1"/>
        <rect x="648" y="50" width="86" height="8" rx="4" fill="#4C8BFF"/>
        <rect x="686" y="38" width="10" height="16" rx="3" fill="#FDEF42"/>
      </g>
      <!-- cordes -->
      <path d="M216 82 L300 24 L392 82 L470 18 L560 82 L640 28 L742 82" fill="none" stroke="#F3E6CF" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M216 82 L300 24 L392 82 L470 18 L560 82 L640 28 L742 82" fill="none" stroke="#8C6448" stroke-width="1.2" stroke-dasharray="4 5"/>
      <path d="M222 56 Q480 40 740 60" fill="none" stroke="#F3E6CF" stroke-width="3"/>
    </g>

    <!-- Fanion / drapeau à l'avant du toit -->
    <rect x="186" y="26" width="4" height="72" rx="2" fill="#D9D4CC"/>
    <circle cx="188" cy="25" r="4" fill="#FDEF42"/>
    <g class="s1-flag">
      <rect x="190" y="28" width="16" height="30" fill="#00853F"/>
      <rect x="206" y="28" width="16" height="30" fill="#FDEF42"/>
      <rect x="222" y="28" width="16" height="30" fill="#E31B23"/>
      <path d="M214 37 l1.9 4.6 5 .3 -3.9 3.2 1.3 4.8 -4.3 -2.7 -4.3 2.7 1.3 -4.8 -3.9 -3.2 5 -.3z" fill="#00853F"/>
    </g>

    <!-- Carrosserie -->
    <g clip-path="url(#s1-bodyclip)">
      <rect x="0" y="80" width="800" height="300" fill="${Y}"/>
      <rect x="0" y="90" width="800" height="20" fill="#F4F0E6"/>
      <rect x="0" y="108" width="800" height="4" fill="#E31B23"/>
      <rect x="0" y="112" width="800" height="74" fill="${B}"/>
      <rect x="0" y="186" width="800" height="5" fill="#fff" opacity="0.55"/>
      <rect x="0" y="262" width="800" height="16" fill="${YD}"/>
      ${dots}
      <rect x="0" y="278" width="800" height="7" fill="#E31B23"/>
      <rect x="0" y="285" width="800" height="3" fill="#fff"/>
      <rect x="0" y="288" width="800" height="62" fill="url(#s1-zig)"/>
      <rect x="0" y="330" width="800" height="20" fill="#000" opacity="0.22"/>
      <!-- nez bleu -->
      <rect x="36" y="204" width="34" height="150" fill="${B}"/>
      <path d="M44 226 l12 10 l-12 10 M44 248 l12 10 l-12 10" fill="none" stroke="#FDEF42" stroke-width="4"/>
      <!-- fenêtres + passagers -->
      ${wins}
      <g>${pax}</g>
      ${pillars}
      <!-- pare-brise + chauffeur -->
      <path d="M128 202 L168 118 L200 118 L200 202 Z" fill="${GL}"/>
      <circle cx="182" cy="150" r="13" fill="${SIL}"/>
      <path d="M160 202 Q164 168 182 166 Q200 168 202 202 Z" fill="${SIL}"/>
      <path d="M150 196 l12 -24" stroke="#3A4560" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 196 L178 126 L190 126 L162 196 Z" fill="#FFB36B" opacity="0.25"/>
      ${fringe}
      <!-- portes -->
      <path d="M206 114 V340 M740 114 V340" stroke="#8E6D0A" stroke-width="2.5" opacity="0.55"/>
      <!-- passages de roue -->
      <circle cx="175" cy="356" r="56" fill="#1A1220"/>
      <circle cx="610" cy="356" r="56" fill="#1A1220"/>
      <path d="M119 356 A56 56 0 0 1 231 356" fill="none" stroke="#3A2A1A" stroke-width="6"/>
      <path d="M554 356 A56 56 0 0 1 666 356" fill="none" stroke="#3A2A1A" stroke-width="6"/>
      <!-- liseré lumière du couchant sur l'arête du toit -->
      <path d="M166 112 Q174 96 194 96 L748 96 Q766 96 766 118" fill="none" stroke="#FFB36B" stroke-width="5"/>
      <rect x="760" y="100" width="6" height="240" fill="#FF8A3D" opacity="0.8"/>
    </g>

    <!-- Peintures du flanc -->
    <g class="s1-paint">
      <g transform="translate(250 236)">
        <circle cx="0" cy="-15" r="9" fill="#E31B23"/><circle cx="14" cy="-5" r="9" fill="#E31B23"/>
        <circle cx="9" cy="12" r="9" fill="#E31B23"/><circle cx="-9" cy="12" r="9" fill="#E31B23"/>
        <circle cx="-14" cy="-5" r="9" fill="#E31B23"/><circle r="8" fill="#00853F"/><circle r="3.5" fill="#FDEF42"/>
        <path d="M24 0 q14 -14 26 0 q-14 14 -26 0z" fill="#00853F"/>
      </g>
      <text x="438" y="252" text-anchor="middle" transform="skewX(-12) translate(52 0)" font-family="'Bricolage Grotesque Variable', sans-serif" font-weight="800" font-size="40" letter-spacing="-0.5" fill="#E31B23" stroke="#fff" stroke-width="7" stroke-linejoin="round" paint-order="stroke">Alhamdoulilah</text>
      <path d="M318 262 Q440 274 562 262" fill="none" stroke="#1E6FB0" stroke-width="3.5" stroke-linecap="round"/>
      ${diamonds}
      <path d="M58 300 l6 -10 l6 10 l-6 10z" fill="#fff"/>
    </g>

    <!-- Phares, pare-chocs, rétro -->
    <circle cx="60" cy="236" r="13" fill="#D8DCE3"/><circle cx="60" cy="236" r="8.5" fill="#FFF6C8"/><circle cx="57" cy="233" r="3" fill="#fff"/>
    <rect x="50" y="258" width="16" height="8" rx="3" fill="#FF9A2F"/>
    <rect x="28" y="322" width="62" height="17" rx="7" fill="#CFD5DD"/><rect x="32" y="324" width="52" height="4" rx="2" fill="#fff"/>
    <path d="M124 192 L108 170" stroke="#1A1220" stroke-width="4"/>
    <rect x="96" y="148" width="13" height="28" rx="5" fill="#1A1220"/><rect x="98" y="151" width="4" height="20" rx="2" fill="#5A6A8A"/>
    <rect x="742" y="326" width="40" height="15" rx="6" fill="#CFD5DD"/>
    <rect x="757" y="288" width="9" height="24" rx="2" fill="#E31B23"/><rect x="759" y="290" width="3" height="10" fill="#FF9AA0"/>
    <!-- bavettes -->
    <rect x="232" y="330" width="16" height="44" rx="3" fill="#E31B23"/><circle cx="240" cy="364" r="4" fill="#fff"/>
    <rect x="668" y="330" width="16" height="44" rx="3" fill="#E31B23"/><circle cx="676" cy="364" r="4" fill="#fff"/>
    <!-- échelle + marchepied -->
    <rect x="766" y="70" width="4" height="252" rx="2" fill="#D9D4CC"/><rect x="780" y="70" width="4" height="252" rx="2" fill="#D9D4CC"/>
    ${rungs}
    <rect x="756" y="344" width="78" height="9" rx="3" fill="#9A948A"/><rect x="756" y="344" width="78" height="3" fill="#CFC8BC"/>

    <!-- Apprenti (« coxeur ») accroché à l'arrière -->
    <g class="s1-appr">
      <path d="M806 346 L812 286 M822 346 L818 286" stroke="#2A1E3A" stroke-width="13" stroke-linecap="round"/>
      <path d="M798 347 h16 M816 347 h16" stroke="#0E0A12" stroke-width="7" stroke-linecap="round"/>
      <path d="M800 292 Q796 252 806 222 Q822 210 836 222 Q842 256 830 292 Z" fill="url(#s1-wax)" stroke="#2A1E3A" stroke-width="3"/>
      <path d="M830 226 Q842 256 830 292" fill="none" stroke="#FF8A3D" stroke-width="3"/>
      <path d="M808 226 Q790 190 776 160" stroke="#5A3420" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="775" cy="158" r="7" fill="#5A3420"/>
      <rect x="814" y="206" width="12" height="12" fill="#5A3420"/>
      <circle cx="822" cy="194" r="16" fill="#5A3420"/>
      <path d="M836 192 Q840 200 834 206" fill="none" stroke="#FF8A3D" stroke-width="3"/>
      <path d="M805 190 Q806 172 824 172 Q840 174 840 188 L850 190 Z" fill="#E31B23"/>
      <g class="s1-arm">
        <path d="M830 228 Q846 236 852 252" stroke="#5A3420" stroke-width="10" stroke-linecap="round" fill="none"/>
        <circle cx="853" cy="254" r="7" fill="#5A3420"/>
        <g class="s1-handphone"><rect x="848" y="240" width="11" height="20" rx="3" fill="#1F5FD1" transform="rotate(18 853 250)"/></g>
      </g>
    </g>
  </g>

  <!-- Roues -->
  ${[175, 610].map((cx) => `
  <g class="s1-wheel" data-cx="${cx}">
    <circle cx="${cx}" cy="360" r="46" fill="#15101B"/>
    <circle cx="${cx}" cy="360" r="40" fill="none" stroke="#2C2433" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="${cx}" cy="360" r="27" fill="#ECE8E0"/>
    <circle cx="${cx}" cy="360" r="27" fill="none" stroke="#B6AFA3" stroke-width="3"/>
    ${[0, 60, 120].map((a) => `<rect x="${cx - 2.5}" y="336" width="5" height="48" fill="#B6AFA3" transform="rotate(${a} ${cx} 360)"/>`).join('')}
    <circle cx="${cx}" cy="360" r="10" fill="#E31B23"/><circle cx="${cx}" cy="360" r="4" fill="#FDEF42"/>
    <circle cx="${cx + 16}" cy="347" r="3" fill="#fff"/>
  </g>
  <path d="M${cx - 38} 340 A44 44 0 0 1 ${cx - 6} 316" fill="none" stroke="#FF8A3D" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`).join('')}
</svg>`;
  }

  FEKK.scene({
    id: ID, start: START, end: END,
    build(root, tl, ctx) {
      const C = ctx.C;
      const rng = FEKK.rng(1847);

      CustomEase.create('s1.fall', 'M0,0 C0.08,0.2 0.16,0.28 0.22,0.3 0.32,0.33 0.5,0.37 0.6,0.4 0.72,0.45 0.88,0.65 1,1');
      CustomEase.create('s1.depart', 'M0,0 C0.12,0.01 0.2,0.05 0.26,0.07 0.42,0.11 0.55,0.13 0.66,0.19 0.8,0.3 0.92,0.62 1,1');

      root.appendChild(FEKK.el(`<style>
        .s1-abs { position:absolute; left:0; top:0; width:1080px; height:1920px; }
        .s1-cam, .s1-zoom { position:absolute; inset:0; }
        .s1-cam { will-change: transform; }
        .s1-plane { position:absolute; left:0; top:0; width:1080px; height:1920px; overflow:visible; }
        .s1-carwrap { position:absolute; left:${CAR_LEFT}px; top:${CAR_TOP}px; width:${860 * CAR_K}px; height:${440 * CAR_K}px; }
        .s1-carwrap > svg { display:block; overflow:visible; }
        .s1-ph { position:absolute; left:0; top:0; width:${PHONE_W}px; height:${PHONE_H}px; margin-left:${-PHONE_W / 2}px; margin-top:${-PHONE_H / 2}px; }
        .s1-ph-squash, .s1-ph-tilt, .s1-ph-flip, .s1-face { position:absolute; inset:0; }
        .s1-face svg { width:100%; height:100%; display:block; }
        .s1-face-front { transform: scaleX(-1); visibility:hidden; }
        .s1-face-front > .s1-inner { position:absolute; inset:0; }
        .s1-screenoff { position:absolute; left:8%; top:4%; width:84%; height:92%; border-radius:17px; background:${C.ink}; opacity:0; }
        .s1-crack { position:absolute; inset:0; width:100%; height:100%; }
        .s1-ghost { position:absolute; left:0; top:0; width:${PHONE_W}px; height:${PHONE_H}px; margin-left:${-PHONE_W / 2}px; margin-top:${-PHONE_H / 2}px; border-radius:26px; background:${C.blue}; opacity:0; filter: blur(5px); }
        .s1-ph-shadow { position:absolute; left:0; top:0; width:190px; height:60px; margin-left:-95px; margin-top:-30px; border-radius:50%; background:#12090F; opacity:0; }
        .s1-dim { position:absolute; left:-400px; top:-200px; width:1880px; height:2400px; background:#6A3680; mix-blend-mode:multiply; opacity:0; }
        .s1-vig { position:absolute; inset:0; background: radial-gradient(ellipse 75% 60% at 55% 52%, rgba(11,18,16,0) 55%, rgba(11,18,16,0.55) 100%); }
        .s1-focus { position:absolute; inset:0; opacity:0; background: radial-gradient(circle at 73% 49%, rgba(11,18,16,0) 18%, rgba(11,18,16,0.6) 70%); }
        .s1-label { position:absolute; top:282px; left:540px; transform:translateX(-50%); white-space:nowrap;
          font-family: var(--ui); font-weight:600; font-size:34px; letter-spacing:0.28em; color:#fff;
          text-shadow: 3px 3px 0 ${C.ink}; }
        .s1-label-in { position:relative; display:inline-block; padding-left:46px; }
        .s1-label-pin { position:absolute; left:0; top:2px; width:28px; height:38px; }
        .s1-cursor { position:absolute; top:4px; left:0; width:4px; height:36px; background:${C.yellow}; }
        .s1-label-line { position:absolute; top:22px; height:3px; width:0; background:${C.yellow}; }
        .s1-type { position:absolute; inset:0; pointer-events:none; }
        .s1-line { position:absolute; left:0; width:1080px; text-align:center; white-space:nowrap;
          font-family: var(--display); font-weight:800; letter-spacing:-0.03em; line-height:0.92; color:#fff; }
        .s1-line .s1-ch, .s1-line .s1-w { display:inline-block; will-change:transform; }
        .s1-la { font-size:124px; top:650px; text-shadow: 8px 9px 0 ${C.ink}; }
        .s1-lb { font-size:150px; top:690px; text-shadow: 9px 10px 0 ${C.ink}; }
        .s1-lc { font-size:300px; top:822px; text-shadow: 12px 14px 0 ${C.ink}; }
        .s1-under { position:absolute; left:0; top:0; width:1080px; height:1920px; overflow:visible; }
        .s1-flash { position:absolute; inset:0; background:#FFF3D6; opacity:0; mix-blend-mode: screen; }
        .s1-ink { position:absolute; inset:0; background:${C.ink}; opacity:0; }
      </style>`));

      // ============ CIEL ============
      const sky = FEKK.el(`<svg class="s1-plane s1-sky" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s1-skyg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1A1738"/><stop offset="0.22" stop-color="${C.dusk}"/>
            <stop offset="0.42" stop-color="#5E2B5C"/><stop offset="0.55" stop-color="#A3405A"/>
            <stop offset="0.66" stop-color="${C.clay}"/><stop offset="0.76" stop-color="${C.sunset}"/>
            <stop offset="1" stop-color="#FFB347"/>
          </linearGradient>
          <pattern id="s1-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.6" fill="#fff"/></pattern>
          <linearGradient id="s1-dotfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="s1-dotmask"><rect width="1080" height="1920" fill="url(#s1-dotfade)"/></mask>
        </defs>
        <rect x="-200" y="-100" width="1480" height="2100" fill="url(#s1-skyg)"/>
        <rect x="-200" y="-100" width="1480" height="2100" fill="url(#s1-dots)" opacity="0.07" mask="url(#s1-dotmask)"/>
        <g class="s1-clouds">
          <rect class="s1-cl" x="-160" y="560" width="720" height="30" rx="15" fill="#4A2D5E" opacity="0.75"/>
          <rect class="s1-cl" x="-60" y="602" width="420" height="16" rx="8" fill="#6E3460" opacity="0.7"/>
          <rect class="s1-cl" x="560" y="640" width="700" height="24" rx="12" fill="#7A3560" opacity="0.7"/>
          <rect class="s1-cl" x="-120" y="790" width="560" height="20" rx="10" fill="#C24F55" opacity="0.6"/>
          <rect class="s1-cl" x="640" y="846" width="560" height="16" rx="8" fill="#FF9452" opacity="0.55"/>
          <rect class="s1-cl" x="380" y="900" width="300" height="12" rx="6" fill="#FFC06A" opacity="0.5"/>
        </g>
        <g class="s1-stars"></g>
        <g class="s1-birds"></g>
      </svg>`);
      // Premières étoiles dans le haut du ciel (18h47 : le jour bascule)
      const starsG = sky.querySelector('.s1-stars');
      const stars = [];
      for (let i = 0; i < 26; i++) {
        const x = 30 + rng() * 1020, y0 = 20 + rng() * 360, y = y0 > 240 ? y0 + 110 : y0, r = 1.2 + rng() * 2.2;
        const st = FEKK.el(`<svg><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#FFF3D6"/></svg>`).firstElementChild;
        starsG.appendChild(st);
        stars.push([st, 0.25 + rng() * 0.6, rng()]);
      }
      // Une étoile à quatre branches, plus présente
      starsG.appendChild(FEKK.el(`<svg><path class="s1-star4" d="M880 214 l5 17 17 5 -17 5 -5 17 -5 -17 -17 -5 17 -5z" fill="#FFF3D6"/></svg>`).firstElementChild);

      // ============ SOLEIL ============
      const SX = 740, SY = 965, SR = 318;
      const sun = FEKK.el(`<svg class="s1-plane s1-sun" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s1-sung" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${C.yellow}"/><stop offset="0.55" stop-color="#FFC43D"/><stop offset="1" stop-color="${C.sunset}"/>
          </linearGradient>
          <clipPath id="s1-sunclip"><circle cx="${SX}" cy="${SY}" r="${SR}"/></clipPath>
        </defs>
        <circle class="s1-halo3" cx="${SX}" cy="${SY}" r="${SR + 190}" fill="#FFB060" opacity="0.07"/>
        <circle class="s1-halo2" cx="${SX}" cy="${SY}" r="${SR + 110}" fill="#FFB060" opacity="0.1"/>
        <circle class="s1-halo1" cx="${SX}" cy="${SY}" r="${SR + 46}" fill="#FFC870" opacity="0.16"/>
        <circle class="s1-disc" cx="${SX}" cy="${SY}" r="${SR}" fill="url(#s1-sung)"/>
        <g clip-path="url(#s1-sunclip)">
          <rect x="${SX - SR}" y="${SY + 70}" width="${SR * 2}" height="10" fill="#FF8A3D"/>
          <rect x="${SX - SR}" y="${SY + 104}" width="${SR * 2}" height="14" fill="#FF8A3D"/>
          <rect x="${SX - SR}" y="${SY + 142}" width="${SR * 2}" height="18" fill="#FF8A3D"/>
          <circle cx="${SX - 90}" cy="${SY - 110}" r="58" fill="#fff" opacity="0.18"/>
        </g>
        <g class="s1-motes"></g>
      </svg>`);

      // ============ PLAN LOINTAIN : Mamelles + phare + Plateau ============
      const towers = [[560, 66, 1060], [622, 52, 1120], [668, 92, 990], [756, 58, 1070], [810, 84, 1020], [888, 56, 1100], [940, 90, 1045], [1026, 70, 1110]];
      let farHTML = '';
      towers.forEach(([x, w, top]) => {
        farHTML += `<rect x="${x}" y="${top}" width="${w}" height="${1330 - top}" fill="#5A3268"/>`;
        farHTML += `<rect x="${x}" y="${top}" width="5" height="${1330 - top}" fill="#7C3F6E"/>`;
        for (let yy = top + 16; yy < 1300; yy += 22) for (let xx = x + 12; xx < x + w - 8; xx += 16) {
          if (rng() < 0.32) farHTML += `<rect x="${xx}" y="${yy}" width="6" height="9" fill="#FFC46B" opacity="${(0.45 + rng() * 0.5).toFixed(2)}"/>`;
        }
      });
      const far = FEKK.el(`<svg class="s1-plane s1-far" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <g class="s1-beam"><path d="M360 1116 L-60 1030 L-60 1130 Z" fill="#FFE2A0" opacity="0.16"/></g>
        <path d="M-80 1340 Q20 1190 120 1176 Q186 1170 228 1222 Q290 1150 360 1156 Q450 1166 540 1340 Z" fill="#53305F"/>
        <path d="M120 1176 Q186 1170 228 1222" fill="none" stroke="#FF8A3D" stroke-width="3" opacity="0.6"/>
        <rect x="353" y="1112" width="14" height="46" fill="#EAD8C6"/><rect x="353" y="1126" width="14" height="6" fill="#E31B23"/><rect x="353" y="1142" width="14" height="6" fill="#E31B23"/>
        <rect x="350" y="1104" width="20" height="10" rx="3" fill="#FDEF42"/>
        <rect x="723" y="940" width="4" height="52" fill="#5A3268"/><circle cx="725" cy="940" r="4" fill="${C.red}"/>
        ${farHTML}
        <rect x="-100" y="1240" width="1300" height="110" fill="#FF7A2F" opacity="0.16"/>
      </svg>`);

      // ============ PLAN MOYEN : baobab, maisons, mosquée, palmier ============
      const MID = '#2C1838', RIM = '#FF8A3D';
      const houses = [[240, 130, 1272], [362, 104, 1236], [458, 150, 1300], [880, 120, 1262], [992, 130, 1296]];
      let houseHTML = '';
      houses.forEach(([x, w, top], i) => {
        houseHTML += `<rect x="${x}" y="${top}" width="${w}" height="${1420 - top}" fill="${MID}"/>`;
        houseHTML += `<rect x="${x - 4}" y="${top - 8}" width="${w + 8}" height="10" fill="${MID}"/>`;
        houseHTML += `<rect x="${x + (x < 700 ? w - 4 : 0)}" y="${top}" width="4" height="${1420 - top}" fill="${RIM}" opacity="0.75"/>`;
        houseHTML += `<rect x="${x + 18}" y="${top - 34}" width="34" height="26" rx="6" fill="${MID}"/>`; // citerne
        if (i % 2 === 0) houseHTML += `<path d="M${x + w - 36} ${top - 8} q14 -30 30 -20" fill="none" stroke="${MID}" stroke-width="5"/><circle cx="${x + w - 20}" cy="${top - 30}" r="10" fill="${MID}"/>`;
        for (let yy = top + 24; yy < 1400; yy += 46) for (let xx = x + 16; xx < x + w - 20; xx += 34) {
          const lit = rng() < 0.28;
          houseHTML += `<rect x="${xx}" y="${yy}" width="14" height="20" fill="${lit ? '#FFB45C' : '#22122C'}" opacity="${lit ? 0.85 : 1}"/>`;
        }
      });
      const mid = FEKK.el(`<svg class="s1-plane s1-mid" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <!-- Mosquée + minaret -->
        <path d="M612 1420 V1312 Q612 1238 692 1232 Q772 1238 772 1312 V1420 Z" fill="${MID}"/>
        <path d="M692 1232 Q772 1238 772 1312" fill="none" stroke="${RIM}" stroke-width="4" opacity="0.6"/>
        <rect x="688" y="1206" width="8" height="28" fill="${MID}"/><path d="M692 1188 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z" fill="#FFC43D"/>
        <rect x="796" y="1080" width="50" height="340" fill="${MID}"/>
        <rect x="786" y="1146" width="70" height="14" fill="${MID}"/><rect x="790" y="1160" width="62" height="6" fill="#3E2448"/>
        <rect x="804" y="1018" width="34" height="64" fill="${MID}"/>
        <rect x="796" y="1072" width="50" height="10" fill="${MID}"/>
        <path d="M804 1018 L821 972 L838 1018 Z" fill="${C.green}"/>
        <path d="M821 972 V954" stroke="#FFC43D" stroke-width="3"/><path d="M816 946 a7 7 0 1 0 8 11 a5.5 5.5 0 1 1 -8 -11z" fill="#FFC43D"/>
        <rect x="796" y="1080" width="4" height="340" fill="${RIM}" opacity="0.7"/>
        <rect x="813" y="1104" width="16" height="30" rx="8" fill="#FFB45C" opacity="0.85"/>
        ${houseHTML}
        <!-- Baobab -->
        <g class="s1-baobab">
          <path d="M70 1420 C84 1340 92 1270 98 1210 C70 1180 40 1150 20 1110 L32 1104 C56 1140 84 1166 108 1180 C112 1140 104 1100 92 1070 L104 1066 C120 1100 128 1140 130 1170 C150 1130 176 1100 204 1086 L210 1096 C186 1116 166 1146 156 1182 C180 1170 214 1166 244 1170 L244 1182 C210 1184 182 1192 162 1210 C170 1280 184 1350 200 1420 Z" fill="#26132F"/>
          <path d="M156 1182 C170 1280 184 1350 200 1420" fill="none" stroke="${RIM}" stroke-width="4" opacity="0.7"/>
          ${[[22, 1100, 34], [62, 1080, 28], [98, 1056, 38], [150, 1074, 30], [206, 1080, 36], [248, 1166, 30], [-4, 1120, 26], [184, 1050, 24]].map(([x, y, r]) =>
            `<ellipse class="s1-leaf" cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.62}" fill="#26132F"/>`).join('')}
        </g>
        <!-- Palmier -->
        <g class="s1-palm">
          <path d="M1000 1300 Q1008 1180 990 1080" fill="none" stroke="#26132F" stroke-width="14" stroke-linecap="round"/>
          <g class="s1-fronds">
            ${[-160, -120, -70, -30, 10, 50].map((a) => `<path d="M990 1080 q60 -10 110 36 q-56 -16 -110 -24z" fill="#26132F" transform="rotate(${a} 990 1080)"/>`).join('')}
          </g>
        </g>
        <rect x="-100" y="1360" width="1300" height="70" fill="#FF7A2F" opacity="0.12"/>
      </svg>`);

      // ============ SOL : trottoir, route, car, poussières, téléphone ============
      let dashes = '';
      for (let x = -200; x < 1400; x += 190) dashes += `<rect x="${x}" y="1556" width="100" height="11" rx="3" fill="#F3E6CF" opacity="0.75"/>`;
      let mural = '';
      for (let x = -200; x < 1400; x += 64) mural += `<path d="M${x} 1376 l32 -18 l32 18 z" fill="${['#00853F', '#FDEF42', '#E31B23'][Math.abs(Math.round(x / 64)) % 3]}" opacity="0.55"/>`;
      // Texture de la route : grains, sable accumulé, plaque d'égout
      const rr = FEKK.rng(1960);
      let specks = '';
      for (let i = 0; i < 90; i++) {
        const x = -200 + rr() * 1500, y = 1445 + rr() * 400, w = 2 + rr() * 6;
        specks += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(1)}" height="${(w * 0.5).toFixed(1)}" rx="1" fill="${rr() < 0.5 ? '#6E4A56' : '#160D14'}" opacity="${(0.4 + rr() * 0.5).toFixed(2)}"/>`;
      }
      dashes += specks + `
        <ellipse cx="250" cy="1730" rx="70" ry="16" fill="#1A1018"/><ellipse cx="250" cy="1727" rx="62" ry="12" fill="#3A2832"/>
        <path d="M200 1727 h100 M215 1721 h70 M215 1733 h70" stroke="#1A1018" stroke-width="2.5"/>
        <path d="M-200 1846 Q60 1818 260 1836 Q420 1812 560 1840 Q760 1820 900 1838 Q1100 1816 1300 1846 Z" fill="#9C7656"/>
        <path d="M-200 1846 Q60 1818 260 1836 Q420 1812 560 1840" fill="none" stroke="#D9B48A" stroke-width="3" opacity="0.6"/>
        <path d="M-200 1436 Q100 1452 340 1440 Q600 1456 900 1442 Q1100 1452 1300 1436 Z" fill="#7E5640" opacity="0.8"/>
        <path d="M640 1610 q60 -6 120 2 M660 1622 q50 -4 100 2" stroke="#160D14" stroke-width="3" fill="none" opacity="0.5"/>`;
      const groundSvg = FEKK.el(`<svg class="s1-plane s1-road" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s1-roadg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#5A3646"/><stop offset="0.35" stop-color="#3D2635"/><stop offset="1" stop-color="#1E121B"/>
          </linearGradient>
        </defs>
        <rect x="-300" y="1330" width="1700" height="74" fill="#3A2132"/>
        ${mural}
        <rect x="-300" y="1330" width="1700" height="6" fill="#FF8A3D" opacity="0.6"/>
        <rect x="-300" y="1400" width="1700" height="26" fill="#C99C6C"/>
        <rect x="-300" y="1400" width="1700" height="5" fill="#F3D3A0"/>
        <rect x="-300" y="1426" width="1700" height="10" fill="#7E5640"/>
        <rect x="-300" y="1436" width="1700" height="500" fill="url(#s1-roadg)"/>
        <rect x="-300" y="1446" width="1700" height="4" fill="#FF7A2F" opacity="0.25"/>
        <rect x="-300" y="1470" width="1700" height="3" fill="#FF7A2F" opacity="0.18"/>
        <rect x="-300" y="1500" width="1700" height="2" fill="#FF7A2F" opacity="0.12"/>
        ${dashes}
        <rect x="-300" y="1846" width="1700" height="10" fill="#7E5640"/>
        <rect x="-300" y="1856" width="1700" height="80" fill="#B88A5E"/>
        <rect x="-300" y="1856" width="1700" height="4" fill="#E6CFA6"/>
        <!-- lampadaire -->
        <rect x="1010" y="1110" width="9" height="296" fill="#2A1830"/>
        <path d="M1014 1112 Q1014 1090 990 1090 L960 1090" fill="none" stroke="#2A1830" stroke-width="7"/>
        <rect x="944" y="1086" width="30" height="10" rx="4" fill="#2A1830"/><rect x="948" y="1096" width="22" height="4" fill="#FFE2A0"/>
        <rect x="1010" y="1110" width="3" height="296" fill="#FF8A3D" opacity="0.6"/>
      </svg>`);

      const carWrap = FEKK.el(`<div class="s1-carwrap">${buildCar(C)}</div>`);
      const carSvg = carWrap.querySelector('svg');
      const fxBack = FEKK.el(`<svg class="s1-plane s1-fxback" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"></svg>`);
      const fx = FEKK.el(`<svg class="s1-plane s1-fx" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <path class="s1-trail-wide" d="${FALL_PATH}" fill="none" stroke="${C.yellow}" stroke-width="64" stroke-linecap="round" opacity="0.22"/>
        <path class="s1-trail-core" d="${FALL_PATH}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
        <g class="s1-speed"></g>
      </svg>`);
      const fxFront = FEKK.el(`<svg class="s1-plane s1-fxfront" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <ellipse class="s1-ring" cx="${LAND[0]}" cy="${LAND[1] + 30}" rx="40" ry="10" fill="none" stroke="#FFE2A0" stroke-width="6" opacity="0"/>
        <g class="s1-burst"></g>
        <g class="s1-impact"></g>
      </svg>`);

      // Téléphone : pos (motionPath, rotation, échelle) > squash > tilt (rotationX) > flip (rotationY) > faces
      const ghosts = [0, 1, 2, 3].map(() => FEKK.el(`<div class="s1-ghost"></div>`));
      const phShadow = FEKK.el(`<div class="s1-ph-shadow"></div>`);
      const phone = FEKK.el(`<div class="s1-ph">
        <div class="s1-ph-squash"><div class="s1-ph-tilt"><div class="s1-ph-flip">
          <div class="s1-face s1-face-back">${FEKK.ASSETS.phoneBack}</div>
          <div class="s1-face s1-face-front"><div class="s1-inner">
            ${FEKK.ASSETS.phoneFront}
            <div class="s1-screenoff"></div>
            <svg class="s1-crack" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
              <path d="M178 26 L150 60 L158 86 L132 112" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M150 60 L118 62 L96 50" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M158 86 L176 104" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M178 26 L166 20 M150 60 L146 30" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
              <path class="s1-shard" d="M150 60 L158 86 L176 70 Z" fill="#fff" opacity="0.28"/>
              <path class="s1-shard" d="M150 60 L118 62 L146 30 Z" fill="#fff" opacity="0.18"/>
            </svg>
          </div></div>
        </div></div></div>
      </div>`);

      const groundPlane = FEKK.el(`<div class="s1-plane s1-groundplane"></div>`);
      const dim = FEKK.el(`<div class="s1-dim"></div>`);
      groundPlane.append(groundSvg, fxBack, carWrap, dim, fx, phShadow, fxFront, ...ghosts, phone);

      const fg = FEKK.el(`<svg class="s1-plane s1-fg" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <path d="M-60 1920 L-60 1868 Q60 1840 170 1872 Q240 1850 300 1880 L330 1920 Z" fill="#140B12"/>
        <path d="M60 1852 q8 -40 4 -70 M76 1858 q16 -36 30 -52 M44 1856 q-10 -30 -30 -44 M92 1862 q22 -20 44 -24" stroke="#140B12" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path d="M1140 1920 L1140 1876 Q1040 1852 960 1880 Q900 1866 850 1896 L840 1920 Z" fill="#140B12"/>
        <path d="M1000 1866 q-6 -34 6 -60 M1020 1870 q10 -26 30 -38" stroke="#140B12" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M60 1852 q8 -40 4 -70" stroke="#FF8A3D" stroke-width="2" fill="none" opacity="0.6"/>
      </svg>`);

      const cam = FEKK.el(`<div class="s1-cam"></div>`);
      const zoom = FEKK.el(`<div class="s1-zoom"></div>`);
      const focus = FEKK.el(`<div class="s1-focus"></div>`);
      const vig = FEKK.el(`<div class="s1-vig"></div>`);
      zoom.append(sky, sun, far, mid, groundPlane, fg, focus);
      cam.append(zoom);
      root.append(cam, vig);

      // ============ TEXTES ============
      const typeLayer = FEKK.el(`<div class="s1-type">
        <div class="s1-label"><div class="s1-label-in">
          <svg class="s1-label-pin" viewBox="0 0 120 160"><path d="M60 4C30.2 4 8 26.6 8 56.5 8 95 60 154 60 154S112 95 112 56.5C112 26.6 89.8 4 60 4Z" fill="${C.red}"/><circle cx="60" cy="56" r="20" fill="#fff"/></svg>
          <span class="s1-label-txt">Dakar · 18h47</span><div class="s1-cursor"></div>
        </div></div>
        <svg class="s1-under" viewBox="0 0 1080 1920"><path class="s1-underline" d="M200 1118 C400 1096 660 1106 884 1088" fill="none" stroke="${C.red}" stroke-width="22" stroke-linecap="round"/></svg>
        <div class="s1-line s1-la">Un instant…</div>
        <div class="s1-line s1-lb">et c’est</div>
        <div class="s1-line s1-lc">perdu.</div>
      </div>`);
      const flash = FEKK.el(`<div class="s1-flash"></div>`);
      const ink = FEKK.el(`<div class="s1-ink"></div>`);
      root.append(typeLayer, flash, ink);

      const q = (s, el = root) => el.querySelector(s);
      const qa = (s, el = root) => Array.from(el.querySelectorAll(s));

      // ====================================================================
      // TIMELINE
      // ====================================================================
      tl.set({}, {}, END - START); // couvre toute la durée
      // État initial : appliqué tout de suite ET posé à t=0 dans la timeline (seek(0) ne rend pas les set à 0).
      const S = (target, vars) => { gsap.set(target, vars); tl.set(target, vars, 0); };

      // ---- Caméra : dérive parallaxe ----
      const planes = { sky, sun, far, mid, ground: groundPlane, fg };
      Object.entries(DRIFT).forEach(([k, [a, b]]) => {
        tl.fromTo(planes[k], { x: a }, { x: b, duration: T_ZOOM, ease: 'power1.inOut' }, 0);
      });
      tl.fromTo(cam, { scale: 1.06, y: 10, transformOrigin: '540px 1100px' }, { scale: 1.0, y: 0, duration: 1.3, ease: 'power2.out' }, 0);
      // Push-in pendant le ralenti (vers le sommet de la trajectoire)
      tl.to(cam, { scale: 1.07, rotation: -1.2, transformOrigin: '780px 940px', duration: 0.5, ease: 'power2.out' }, 1.32);
      tl.to(cam, { scale: 1.0, rotation: 0, duration: 0.42, ease: 'power3.in' }, 1.86);
      tl.fromTo(focus, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 1.36);
      tl.to(focus, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.9);
      // Halo du soleil qui respire, plus fort au ralenti
      tl.fromTo(qa('.s1-halo1, .s1-halo2, .s1-halo3', sun), { scale: 0.96, svgOrigin: `${SX} ${SY}` }, { scale: 1.04, duration: 1.3, ease: 'sine.inOut', stagger: 0.12 }, 0);
      tl.to(qa('.s1-halo1, .s1-halo2, .s1-halo3', sun), { scale: 1.12, duration: 0.6, ease: 'power2.out', stagger: 0.05 }, 1.35);
      tl.to(qa('.s1-halo1, .s1-halo2, .s1-halo3', sun), { scale: 1.0, duration: 0.5, ease: 'power2.in' }, 1.95);
      tl.fromTo(q('.s1-disc', sun), { y: 14 }, { y: -6, duration: 3.1, ease: 'none' }, 0);
      // Nuages
      qa('.s1-cl', sky).forEach((c, i) => tl.fromTo(c, { x: 0 }, { x: (i % 2 ? -1 : 1) * (26 + i * 9), duration: 3.4, ease: 'none' }, 0));
      // Phare : balayage
      tl.fromTo(q('.s1-beam', far), { rotation: -6, svgOrigin: '360 1116' }, { rotation: 10, duration: 3.4, ease: 'sine.inOut' }, 0);
      // Palmier & baobab : légère respiration au vent
      tl.fromTo(q('.s1-fronds', mid), { rotation: -2, svgOrigin: '990 1080' }, { rotation: 3, duration: 1.1, ease: 'sine.inOut', repeat: 2, yoyo: true }, 0);
      tl.fromTo(qa('.s1-leaf', mid), { x: -2 }, { x: 3, duration: 0.9, ease: 'sine.inOut', repeat: 3, yoyo: true, stagger: 0.07 }, 0);

      // Oiseaux
      const birdsG = q('.s1-birds', sky);
      [[150, 420, 1], [218, 452, 0.8], [300, 404, 0.9], [880, 520, 0.7], [930, 548, 0.6]].forEach(([x, y, s], i) => {
        const b = FEKK.el(`<svg><g class="s1-bird"><path d="M-14 0 Q-7 -8 0 0 Q7 -8 14 0" fill="none" stroke="#1A1230" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`).firstElementChild;
        birdsG.appendChild(b);
        tl.fromTo(b, { x, y, scale: s }, { x: x + 120 + i * 10, y: y - 40 + i * 6, duration: 3.5, ease: 'none' }, 0);
        tl.fromTo(b.firstElementChild, { scaleY: 1 }, { scaleY: -0.6, duration: 0.16 + i * 0.015, ease: 'sine.inOut', repeat: 21, yoyo: true }, i * 0.05);
      });
      stars.forEach(([st, o, ph]) => {
        tl.fromTo(st, { opacity: o }, { opacity: o * 0.25, duration: 0.3 + ph * 0.4, ease: 'sine.inOut', repeat: 7, yoyo: true }, ph * 0.3);
      });
      tl.fromTo(q('.s1-star4', sky), { scale: 0.7, rotation: 0, svgOrigin: '880 236' }, { scale: 1.15, rotation: 45, duration: 1.7, ease: 'sine.inOut', repeat: 1, yoyo: true }, 0);
      // Poussières de lumière autour du soleil
      const motes = q('.s1-motes', sun);
      for (let i = 0; i < 22; i++) {
        const m = FEKK.el(`<svg><circle r="${(1.5 + rng() * 3).toFixed(1)}" fill="#FFF3C4"/></svg>`).firstElementChild;
        motes.appendChild(m);
        const x0 = 480 + rng() * 520, y0 = 760 + rng() * 420;
        tl.fromTo(m, { x: x0, y: y0, opacity: 0.2 + rng() * 0.6 }, { x: x0 + 20 + rng() * 40, y: y0 - 40 - rng() * 60, opacity: 0.15, duration: 3.5, ease: 'none' }, 0);
      }

      // ---- Label « Dakar · 18h47 » qui s'écrit ----
      const labelTxt = q('.s1-label-txt');
      const labelSplit = new SplitText(labelTxt, { type: 'chars', charsClass: 's1-lch' });
      const lchars = labelSplit.chars;
      const cursor = q('.s1-cursor');
      const labelIn = q('.s1-label-in');
      const inRect = labelIn.getBoundingClientRect();
      S(lchars, { opacity: 0 });
      tl.fromTo(q('.s1-label-pin'), { scale: 0, y: -30, transformOrigin: '50% 100%' }, { scale: 1, y: 0, duration: 0.35, ease: 'back.out(3)' }, 0.0);
      S(cursor, { x: 46, opacity: 1 });
      lchars.forEach((ch, i) => {
        const r = ch.getBoundingClientRect();
        const t = 0.04 + i * 0.026;
        tl.set(ch, { opacity: 1 }, t);
        tl.fromTo(ch, { y: 10 }, { y: 0, duration: 0.12, ease: 'power2.out', immediateRender: false }, t);
        tl.set(cursor, { x: r.right - inRect.left + 4 }, t);
      });
      // Clignotement du curseur, puis disparition
      [0.5, 0.75, 1.0, 1.25].forEach((t, i) => tl.set(cursor, { opacity: i % 2 ? 1 : 0 }, t));
      tl.set(cursor, { opacity: 0 }, 1.5);
      tl.to(q('.s1-label'), { y: -6, duration: 2.6, ease: 'none' }, 0.4);

      // ---- Car rapide : entrée, freinage, repart ----
      const body = q('.s1-car-body', carSvg);
      const bags = q('.s1-bags', carSvg);
      const wheels = qa('.s1-wheel', carSvg);
      const flag = q('.s1-flag', carSvg);
      const arm = q('.s1-arm', carSvg);
      const appr = q('.s1-appr', carSvg);
      const handPhone = q('.s1-handphone', carSvg);
      const ARRIVE = 0.3, STOP = 1.0, DEPART = 1.18, GONE = 2.48;
      const WR = 46 * CAR_K;
      const deg = (px) => (px / WR) * (180 / Math.PI);

      tl.fromTo(carWrap, { x: 1180 }, { x: 0, duration: STOP - ARRIVE, ease: 'power3.out' }, ARRIVE);
      wheels.forEach((w) => {
        const cx = +w.dataset.cx;
        tl.fromTo(w, { rotation: 0, svgOrigin: `${cx} 360` }, { rotation: -deg(1180), duration: STOP - ARRIVE, ease: 'power3.out' }, ARRIVE);
        tl.to(w, { rotation: `-=${deg(1250)}`, duration: GONE - DEPART, ease: 's1.depart' }, DEPART);
      });
      // Roulis de route à l'arrivée
      tl.fromTo(body, { y: 0 }, { y: -4, duration: 0.09, ease: 'sine.inOut', repeat: 5, yoyo: true }, ARRIVE);
      // Freinage : le nez plonge (squash), rebond arrière, stabilisation
      tl.to(body, { rotation: -2.6, scaleX: 1.025, scaleY: 0.965, svgOrigin: '175 400', duration: 0.13, ease: 'power2.out' }, STOP - 0.12);
      tl.to(body, { rotation: 1.1, scaleX: 0.99, scaleY: 1.02, svgOrigin: '175 400', duration: 0.12, ease: 'sine.inOut' }, STOP + 0.01);
      tl.to(body, { rotation: 0, scaleX: 1, scaleY: 1, svgOrigin: '175 400', duration: 0.1, ease: 'sine.out' }, STOP + 0.13);
      // Galerie : follow-through (en retard sur la carrosserie)
      tl.to(bags, { x: -16, rotation: -2.5, svgOrigin: '480 82', duration: 0.16, ease: 'power2.out' }, STOP - 0.08);
      tl.to(bags, { x: 6, rotation: 1, svgOrigin: '480 82', duration: 0.14, ease: 'sine.inOut' }, STOP + 0.08);
      tl.to(bags, { x: 0, rotation: 0, svgOrigin: '480 82', duration: 0.1, ease: 'sine.out' }, STOP + 0.22);
      // Départ : anticipation (l'arrière s'écrase), le car arrache
      tl.to(body, { rotation: 2.2, scaleX: 1.02, scaleY: 0.97, svgOrigin: '610 400', duration: 0.1, ease: 'power2.out' }, DEPART - 0.02);
      tl.to(body, { rotation: 0, scaleX: 1, scaleY: 1, svgOrigin: '610 400', duration: 0.3, ease: 'sine.out' }, DEPART + 0.1);
      tl.to(bags, { x: 18, rotation: 2.5, svgOrigin: '480 82', duration: 0.16, ease: 'power2.out' }, DEPART);
      tl.to(bags, { x: 0, rotation: 0, svgOrigin: '480 82', duration: 0.4, ease: 'sine.inOut' }, DEPART + 0.16);
      tl.to(carWrap, { x: -1240, duration: GONE - DEPART, ease: 's1.depart' }, DEPART);
      // Drapeau qui claque
      tl.fromTo(flag, { skewY: -6, scaleX: 0.9, svgOrigin: '190 28' }, { skewY: 6, scaleX: 1, duration: 0.11, ease: 'sine.inOut', repeat: 21, yoyo: true }, 0);
      // Apprenti : balancement, le bras fouette au départ → le téléphone s'échappe
      tl.fromTo(appr, { rotation: -3, svgOrigin: '812 346' }, { rotation: 4, duration: 0.2, ease: 'sine.inOut', repeat: 3, yoyo: true }, ARRIVE);
      tl.to(appr, { rotation: 8, svgOrigin: '812 346', duration: 0.12, ease: 'power2.out' }, STOP - 0.06);
      tl.to(appr, { rotation: -10, svgOrigin: '812 346', duration: 0.16, ease: 'power2.out' }, DEPART);
      tl.to(appr, { rotation: 2, svgOrigin: '812 346', duration: 0.4, ease: 'sine.inOut' }, DEPART + 0.16);
      tl.fromTo(arm, { rotation: 0, svgOrigin: '830 228' }, { rotation: -38, duration: 0.14, ease: 'power3.out', immediateRender: false }, DEPART - 0.06);
      tl.to(arm, { rotation: 12, svgOrigin: '830 228', duration: 0.3, ease: 'back.out(2)' }, DEPART + 0.1);
      S(handPhone, { opacity: 1 });
      tl.set(handPhone, { opacity: 0 }, T_EJECT);

      // Poussières du car (freinage + démarrage) et fumée d'échappement
      const fxB = fxBack;
      const puff = (x, y, t, n, spread, dir, col, seedR) => {
        for (let i = 0; i < n; i++) {
          const r0 = 6 + seedR() * 10;
          const c = FEKK.el(`<svg><circle r="${r0.toFixed(1)}" fill="${col}"/></svg>`).firstElementChild;
          fxB.appendChild(c);
          const dx = dir * (30 + seedR() * spread), dy = -10 - seedR() * 60;
          const tt = t + seedR() * 0.12;
          S(c, { opacity: 0 });
          const d = 0.5 + seedR() * 0.4;
          tl.fromTo(c, { x: x + (seedR() - 0.5) * 30, y: y - seedR() * 10, scale: 0.3, opacity: 1 },
            { x: `+=${dx}`, y: `+=${dy}`, scale: 1.5 + seedR() * 1.2, duration: d, ease: 'power2.out', immediateRender: false }, tt);
          tl.to(c, { scale: 0, duration: d * 0.6, ease: 'power2.in' }, tt + d * 0.55);
        }
      };
      const pr = FEKK.rng(77);
      const fw = CAR_LEFT + 175 * CAR_K, rw = CAR_LEFT + 610 * CAR_K, gy = CAR_TOP + 404 * CAR_K;
      puff(fw - 10, gy, STOP - 0.12, 7, 90, -1, '#D9B48A', pr);
      puff(rw - 10, gy, STOP - 0.1, 7, 90, -1, '#D9B48A', pr);
      puff(rw + 40, gy, DEPART + 0.02, 9, 160, 1, '#E6CFA6', pr);
      puff(CAR_LEFT + 780 * CAR_K, CAR_TOP + 336 * CAR_K, DEPART - 0.02, 6, 110, 1, '#6B5A6E', pr);

      // ---- Téléphone : chute en arc avec ralenti au sommet ----
      const pos = phone;
      const squash = q('.s1-ph-squash', phone);
      const tilt = q('.s1-ph-tilt', phone);
      const flip = q('.s1-ph-flip', phone);
      const screenOff = q('.s1-screenoff', phone);
      const crackPaths = qa('.s1-crack path:not(.s1-shard)', phone);
      const shards = qa('.s1-shard', phone);
      const fallEase = gsap.parseEase('s1.fall');

      S(pos, { opacity: 0, x: HAND[0], y: HAND[1], scale: 0.14, rotation: 18 });
      S(tilt, { rotationX: 0, transformPerspective: 560 });
      S(flip, { rotationY: 0, transformPerspective: 900 });
      tl.set(pos, { opacity: 1 }, T_EJECT);
      tl.to(pos, { motionPath: { path: FALL_PATH }, duration: FALL_D, ease: 's1.fall' }, T_EJECT);
      tl.to(pos, { rotation: 346, duration: FALL_D, ease: 's1.fall' }, T_EJECT);
      tl.to(pos, { scale: 0.86, duration: 0.42, ease: 'power2.out' }, T_EJECT);
      tl.to(pos, { scale: 1, duration: FALL_D - 0.42, ease: 'power2.in' }, T_EJECT + 0.42);
      // Retournement : un tour complet au lancer, dos visible pendant le ralenti et la chute,
      // puis il se retourne au rebond et retombe écran vers le haut.
      const flipSeq = (el) => {
        tl.to(el, { rotationY: 360, duration: 1.4 - T_EJECT, ease: 'power2.out' }, T_EJECT);
        tl.to(el, { rotationY: 392, duration: T_IMPACT - 1.4, ease: 'sine.inOut' }, 1.4);
        tl.to(el, { rotationY: 540, duration: 0.2, ease: 'power1.inOut' }, T_IMPACT + 0.05);
      };
      flipSeq(flip);
      tl.to(tilt, { rotationX: 28, duration: FALL_D, ease: 's1.fall' }, T_EJECT);
      // Fantômes de mouvement (même trajectoire, en retard)
      ghosts.forEach((g, i) => {
        const lag = 0.035 * (i + 1);
        S(g, { x: HAND[0], y: HAND[1], scale: 0.14, rotation: 18, rotationY: 0, transformPerspective: 900, opacity: 0 });
        tl.set(g, { opacity: [0.2, 0.13, 0.08, 0.04][i] }, T_EJECT + lag);
        tl.to(g, { motionPath: { path: FALL_PATH }, duration: FALL_D, ease: 's1.fall' }, T_EJECT + lag);
        tl.to(g, { rotation: 346, duration: FALL_D, ease: 's1.fall' }, T_EJECT + lag);
        flipSeq(g);
        tl.to(g, { scale: 0.86, duration: 0.42, ease: 'power2.out' }, T_EJECT + lag);
        tl.to(g, { scale: 1, duration: FALL_D - 0.42, ease: 'power2.in' }, T_EJECT + lag + 0.42);
        tl.set(g, { opacity: 0 }, T_IMPACT + 0.01);
      });
      // Ombre au sol qui se resserre à l'approche
      S(phShadow, { x: LAND[0], y: LAND[1] + 34, opacity: 0, scale: 0.3 });
      tl.to(phShadow, { opacity: 0.55, scale: 1, duration: 0.5, ease: 'power3.in' }, T_IMPACT - 0.5);

      // Impact : squash, rebond, à plat
      tl.to(tilt, { rotationX: 70, duration: 0.06, ease: 'power2.out' }, T_IMPACT);
      tl.fromTo(squash, { scaleX: 1, scaleY: 1 }, { scaleX: 1.22, scaleY: 0.74, duration: 0.05, ease: 'power2.out', immediateRender: false }, T_IMPACT);
      tl.to(squash, { scaleX: 0.92, scaleY: 1.1, y: -70, duration: 0.13, ease: 'power2.out' }, T_IMPACT + 0.05);
      tl.to(squash, { scaleX: 1.08, scaleY: 0.9, y: 0, duration: 0.11, ease: 'power2.in' }, T_IMPACT + 0.18);
      tl.to(squash, { scaleX: 1, scaleY: 1, duration: 0.25, ease: 'elastic.out(1, 0.4)' }, T_IMPACT + 0.29);
      tl.to(tilt, { rotationX: 52, duration: 0.13, ease: 'power2.out' }, T_IMPACT + 0.06);
      tl.to(tilt, { rotationX: 64, duration: 0.2, ease: 'power2.inOut' }, T_IMPACT + 0.19);
      tl.to(pos, { rotation: 352, x: '+=8', duration: 0.3, ease: 'power2.out' }, T_IMPACT + 0.05);
      tl.to(phShadow, { scale: 0.75, opacity: 0.35, duration: 0.13, ease: 'power2.out' }, T_IMPACT + 0.05);
      tl.to(phShadow, { scale: 1, opacity: 0.55, duration: 0.11, ease: 'power2.in' }, T_IMPACT + 0.18);
      // Fissure
      S(crackPaths, { drawSVG: '0%' });
      S(shards, { opacity: 0 });
      tl.to(crackPaths, { drawSVG: '100%', duration: 0.1, ease: 'power3.out', stagger: 0.025 }, T_IMPACT + 0.01);
      tl.to(shards, { opacity: (i) => [0.28, 0.18][i], duration: 0.05, stagger: 0.03 }, T_IMPACT + 0.05);
      // Flash d'impact
      tl.fromTo(flash, { opacity: 0 }, { opacity: 0.45, duration: 0.03, ease: 'none', immediateRender: false }, T_IMPACT);
      tl.to(flash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, T_IMPACT + 0.03);
      // Shake caméra
      const sr = FEKK.rng(2300);
      for (let i = 0; i < 7; i++) {
        const k = 1 - i / 7;
        tl.to(cam, { x: (sr() - 0.5) * 34 * k, y: (sr() - 0.3) * 30 * k, duration: 0.032, ease: 'none' }, T_IMPACT + i * 0.032);
      }
      tl.to(cam, { x: 0, y: 0, duration: 0.06, ease: 'power1.out' }, T_IMPACT + 7 * 0.032);

      // Onde au sol + nuage de poussière + lignes d'impact
      const ring = q('.s1-ring', fxFront);
      tl.fromTo(ring, { attr: { rx: 40, ry: 10 }, opacity: 0.9 }, { attr: { rx: 260, ry: 46 }, opacity: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, T_IMPACT);
      S(ring, { opacity: 0 });
      const burst = q('.s1-burst', fxFront);
      const br = FEKK.rng(4821);
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const ang = (side > 0 ? 0 : Math.PI) + side * (-(0.05 + br() * 0.75));
        const dist = 70 + br() * 230;
        const r0 = 6 + br() * 12;
        const col = ['#B88A6A', '#9A7060', '#D9B48A', '#7A5656'][i % 4];
        const p = FEKK.el(`<svg><circle r="${r0.toFixed(1)}" fill="${col}"/></svg>`).firstElementChild;
        burst.appendChild(p);
        const tt = T_IMPACT + br() * 0.05;
        S(p, { opacity: 0 });
        tl.fromTo(p, { x: LAND[0] + (br() - 0.5) * 50, y: LAND[1] + 30, scale: 0.3, opacity: 1 },
          { x: `+=${Math.cos(ang) * dist}`, y: `+=${Math.sin(ang) * dist * 0.45 - 24}`, scale: 1.3 + br() * 0.9, duration: 0.5 + br() * 0.3, ease: 'power3.out', immediateRender: false }, tt);
        tl.to(p, { scale: 0, duration: 0.3, ease: 'power2.in' }, tt + 0.28 + br() * 0.2);
      }
      const impact = q('.s1-impact', fxFront);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI + (i / 8) * Math.PI;
        const r1 = 120, r2 = 190 + (i % 2) * 40;
        const cx = LAND[0], cy = LAND[1] + 10;
        const ln = FEKK.el(`<svg><path d="M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1 * 0.7).toFixed(1)} L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2 * 0.7).toFixed(1)}" stroke="${i % 3 === 1 ? C.yellow : '#fff'}" stroke-width="${i % 2 ? 7 : 10}" stroke-linecap="round" fill="none"/></svg>`).firstElementChild;
        impact.appendChild(ln);
        S(ln, { drawSVG: '0% 0%' });
        tl.to(ln, { drawSVG: '0% 100%', duration: 0.07, ease: 'power3.out' }, T_IMPACT + 0.01);
        tl.to(ln, { drawSVG: '100% 100%', duration: 0.16, ease: 'power2.in' }, T_IMPACT + 0.1);
        S(ln, { opacity: 1 });
        tl.set(ln, { opacity: 0 }, T_IMPACT + 0.27);
      }

      // Lignes de vitesse pendant la chute rapide
      const speed = q('.s1-speed', fx);
      const sp = FEKK.rng(99);
      for (let i = 0; i < 7; i++) {
        const x = 560 + sp() * 160, y0 = 1080 + sp() * 300, len = 90 + sp() * 120;
        const ln = FEKK.el(`<svg><path d="M${x.toFixed(0)} ${y0.toFixed(0)} l${-(len * 0.14).toFixed(0)} ${len.toFixed(0)}" stroke="#fff" stroke-width="${(2 + sp() * 3).toFixed(1)}" stroke-linecap="round" opacity="0.55"/></svg>`).firstElementChild;
        speed.appendChild(ln);
        S(ln, { drawSVG: '0% 0%' });
        const tt = 1.92 + sp() * 0.22;
        tl.to(ln, { drawSVG: '0% 100%', duration: 0.08, ease: 'none' }, tt);
        tl.to(ln, { drawSVG: '100% 100%', duration: 0.1, ease: 'none' }, tt + 0.08);
        S(ln, { opacity: 1 });
        tl.set(ln, { opacity: 0 }, tt + 0.19);
      }

      // Fond qui s'assombrit pour laisser respirer le texte (le téléphone reste en lumière)
      tl.fromTo(dim, { opacity: 0 }, { opacity: 0.7, duration: 0.5, ease: 'power2.out', immediateRender: false }, 2.36);
      S(dim, { opacity: 0 });

      // L'écran s'allume au sol puis s'éteint (le téléphone « meurt »)
      S(screenOff, { opacity: 0 });
      [[2.92, 0.6], [2.96, 0.1], [3.0, 0.75], [3.03, 0.3], [3.08, 1]].forEach(([t, o]) => tl.set(screenOff, { opacity: o }, t));

      // ---- Texte cinétique ----
      const la = q('.s1-la'), lb = q('.s1-lb'), lc = q('.s1-lc');
      const sa = new SplitText(la, { type: 'chars', charsClass: 's1-ch' });
      const sb = new SplitText(lb, { type: 'words', wordsClass: 's1-w' });
      const sc = new SplitText(lc, { type: 'chars', charsClass: 's1-ch' });
      S([la, lb, lc], { opacity: 1 });
      S([...sa.chars, ...sb.words, ...sc.chars], { opacity: 0 });
      S(la, { y: 0, scale: 1, transformOrigin: '50% 50%' });
      // « Un instant… » : les lettres jaillissent du bas, en éventail
      tl.fromTo(sa.chars, { opacity: 0, yPercent: 90, rotation: (i) => (i % 2 ? 14 : -10), scaleY: 1.35 },
        { opacity: 1, yPercent: 0, rotation: 0, scaleY: 1, duration: 0.3, ease: 'back.out(2.2)', stagger: 0.018, immediateRender: false }, 2.36);
      // il monte et se range quand la suite arrive (overlap)
      tl.to(la, { y: -126, scale: 0.8, duration: 0.34, ease: 'fekk.swift' }, 2.6);
      // « et c'est » : mots qui claquent
      tl.fromTo(sb.words, { opacity: 0, scale: 1.6, y: -40 },
        { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'fekk.snap', stagger: 0.09, immediateRender: false }, 2.66);
      // « perdu. » : slam massif, squash à l'atterrissage
      tl.fromTo(sc.chars, { scale: 1.45, y: 30, rotation: (i) => [-8, 6, -4, 7, -6, 4][i % 6], transformOrigin: '50% 90%' },
        { scale: 1, y: 0, rotation: 0, duration: 0.14, ease: 'power4.in', stagger: 0.03, immediateRender: false }, 2.8);
      tl.fromTo(sc.chars, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none', stagger: 0.03, immediateRender: false }, 2.8);
      sc.chars.forEach((ch, i) => {
        const t = 2.8 + i * 0.03 + 0.14;
        tl.to(ch, { scaleY: 0.86, scaleX: 1.07, duration: 0.05, ease: 'power2.out' }, t);
        tl.to(ch, { scaleY: 1, scaleX: 1, duration: 0.22, ease: 'elastic.out(1, 0.45)' }, t + 0.05);
      });
      // Soulignement rouge tracé
      const under = q('.s1-underline');
      S(under, { drawSVG: '0%' });
      tl.to(under, { drawSVG: '100%', duration: 0.2, ease: 'power3.out' }, 3.04);
      // micro-dérive pour que rien ne fige
      tl.to([lb, lc], { y: '-=10', duration: 0.5, ease: 'none' }, 2.8);

      // ---- Transition sortante : plongée dans l'écran éteint → plein cadre ink ----
      const ox = LAND[0] + DRIFT.ground[1] + 8; // position écran du téléphone une fois la caméra posée
      const oy = LAND[1];
      S(zoom, { transformOrigin: `${ox}px ${oy}px`, scale: 1, x: 0, y: 0 });
      tl.to(zoom, { scale: 11, x: 540 - ox, y: 960 - oy, duration: T_BLACK - T_ZOOM, ease: 'power4.in' }, T_ZOOM);
      tl.to(pos, { rotation: 360, duration: T_BLACK - T_ZOOM - 0.04, ease: 'power3.inOut' }, T_ZOOM);
      tl.to(tilt, { rotationX: 0, duration: T_BLACK - T_ZOOM - 0.04, ease: 'power3.in' }, T_ZOOM);
      tl.to(phShadow, { opacity: 0, duration: 0.15 }, T_ZOOM);
      tl.to(qa('.s1-crack', phone), { opacity: 0, duration: 0.14, ease: 'power1.in' }, T_ZOOM + 0.14);
      tl.to(vig, { opacity: 1.0, duration: 0.3, ease: 'power2.in' }, T_ZOOM);
      // Les textes passent « à travers » la caméra
      const TX = 3.3, TXD = T_BLACK - TX;
      tl.to(la, { y: '-=260', scale: 1.9, opacity: 0, duration: TXD, ease: 'power2.in' }, TX);
      tl.to(lb, { y: '-=60', scale: 2.3, opacity: 0, duration: TXD, ease: 'power2.in' }, TX + 0.01);
      tl.to(lc, { y: '+=240', scale: 2.8, opacity: 0, duration: TXD - 0.01, ease: 'power2.in' }, TX + 0.01);
      tl.to(q('.s1-under'), { y: 300, scale: 2.8, transformOrigin: '540px 1108px', opacity: 0, duration: TXD - 0.01, ease: 'power2.in' }, TX + 0.01);
      tl.to(q('.s1-label'), { y: -80, opacity: 0, duration: 0.2, ease: 'power2.in' }, T_ZOOM + 0.06);
      S(ink, { opacity: 0 });
      tl.set(ink, { opacity: 1 }, T_BLACK);

      // Références pour onFrame
      const trailWide = q('.s1-trail-wide', fx);
      const trailCore = q('.s1-trail-core', fx);
      R = {
        trailWide, trailCore, len: trailCore.getTotalLength(), fallEase, flip,
        back: q('.s1-face-back', phone), front: q('.s1-face-front', phone),
      };
    },

    onFrame(t) {
      if (!R) return;
      // Traînée lumineuse : segment de la trajectoire entre la tête et la queue (retard temporel).
      const p = (tt) => R.fallEase(Math.min(1, Math.max(0, (tt - T_EJECT) / FALL_D)));
      const on = t > T_EJECT && t < T_IMPACT + 0.12;
      const head = p(Math.min(t, T_IMPACT)), tail = p(t - 0.16);
      const L = R.len;
      const seg = Math.max(0, (head - tail) * L);
      [R.trailWide, R.trailCore].forEach((el, i) => {
        el.style.visibility = on && seg > 1 ? 'visible' : 'hidden';
        el.style.strokeDasharray = `0 ${(tail * L).toFixed(2)} ${seg.toFixed(2)} ${(L * 2).toFixed(2)}`;
        el.style.strokeDashoffset = '0';
      });
      // Face visible du téléphone selon sa rotation Y
      const ry = gsap.getProperty(R.flip, 'rotationY') || 0;
      const front = Math.cos((ry * Math.PI) / 180) < 0;
      R.front.style.visibility = front ? 'visible' : 'hidden';
      R.back.style.visibility = front ? 'hidden' : 'visible';
    },
  });
})();
