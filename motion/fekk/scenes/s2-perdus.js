/* S2 — « Perdus » · 3.50 → 7.00
 * Le drop : un mur typographique qui se construit coup sur coup (Téléphone. / Carte d'identité. /
 * Clés. / Portefeuille. / Sac.), chaque mot claque sur un bandeau de couleur et son objet,
 * illustré en sticker découpé, rebondit dessus. Puis le mur s'effondre, les objets deviennent
 * des épingles grises sur la presqu'île du Cap-Vert, « Chaque jour à Dakar. »,
 * « Et si on pouvait les retrouver ? », l'épingle Fekk tombe et un cercle vert envahit le cadre.
 * Tout est piloté par `tl` (t local 0 = 3.50 absolu). */
(function () {
  const ID = 's2';
  const START = 3.5;
  const END = 7.0;

  // Hits musicaux (temps local) : 3.50, 3.95, 4.40, 4.75, 5.10
  const HITS = [0, 0.45, 0.9, 1.25, 1.6];
  const T_COLLAPSE = 1.9;         // 5.40 : le mur s'effondre, la carte arrive
  const T_SUB = 2.25;             // « Chaque jour à Dakar. » (après la chute des lettres du mur)
  const T_Q = 2.38;               // question (posée vers 6.10 absolu)
  const T_MARK = 2.56;            // marqueur jaune
  const T_TXT_OUT = 3.37;         // les textes, restés au-dessus de la vague verte, rentrent dans leurs masques
  const T_PIN = 2.84;             // l'épingle Fekk tombe
  const T_LAND = 3.02;            // atterrissage
  const T_FLOOD = 3.12;           // le cercle vert part de la pointe
  const T_FULL = 3.44;            // plein cadre vert garanti

  const O = [540, 880];           // origine caméra (centre de la zone de sécurité)
  const MAP = { x: -19, y: 230, k: 1.5 };
  const mp = (x, y) => [MAP.x + x * MAP.k, MAP.y + y * MAP.k];
  const TIP = mp(345, 375);       // Colobane : là où le téléphone a été perdu → l'épingle Fekk y tombe

  // ---------------------------------------------------------------- utilitaires
  function crPath(pts) {
    // Catmull-Rom ouverte → Bézier cubiques
    const n = pts.length;
    const P = (i) => pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  const star = (cx, cy, r, ri = r * 0.42) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2);
    }
    return d + 'Z';
  };
  // Filtre « sticker découpé » : liseré sable + ombre portée dure.
  const dieFilter = (id, rUnits, dx, dy) => `
    <filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="${rUnits.toFixed(2)}" result="d"/>
      <feFlood flood-color="#F3E6CF"/><feComposite in2="d" operator="in" result="border"/>
      <feOffset in="d" dx="${dx.toFixed(2)}" dy="${dy.toFixed(2)}" result="so"/>
      <feFlood flood-color="#05090A" flood-opacity="0.55"/><feComposite in2="so" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;

  // ---------------------------------------------------------------- illustrations (stickers)
  // Chaque sticker : { vb:[x,y,w,h], w (px affichés), svg(filterId) }
  function stickerPhone(C) {
    const back = FEKK.ASSETS.phoneBack.trim().replace('<svg ', '<svg x="0" y="0" width="200" height="400" ');
    return {
      vb: [-22, -22, 244, 444], w: 158, rest: -13,
      body: (f) => `
        <defs><clipPath id="s2-phclip"><rect x="2" y="2" width="196" height="396" rx="34"/></clipPath></defs>
        <g filter="url(#${f})">
          ${back}
          <g clip-path="url(#s2-phclip)">
            <rect x="180" y="0" width="22" height="400" fill="#1648A8"/>
            <path d="M118 -10 L170 -10 L40 410 L-12 410 Z" fill="#fff" opacity="0.13"/>
            <path d="M178 -10 L192 -10 L62 410 L48 410 Z" fill="#fff" opacity="0.10"/>
            <rect x="0" y="372" width="200" height="30" fill="#0B1210" opacity="0.18"/>
          </g>
          <path d="M9 70 V320" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
          <rect x="198" y="96" width="5" height="44" rx="2.5" fill="#163F8F"/>
          <rect x="198" y="152" width="5" height="26" rx="2.5" fill="#163F8F"/>
        </g>`,
    };
  }

  function stickerCNI(C) {
    let mrz = '';
    for (let r = 0; r < 2; r++) for (let i = 0; i < 25; i++) {
      const w = (i * 7 + r * 3) % 5 === 0 ? 4 : 7;
      mrz += `<rect x="${20 + i * 12.2}" y="${193 + r * 10}" width="${w}" height="4" rx="1" fill="#6E7A73"/>`;
    }
    return {
      vb: [-24, -24, 388, 264], w: 300, rest: 7,
      body: (f) => `
        <defs>
          <clipPath id="s2-cniclip"><rect width="340" height="216" rx="18"/></clipPath>
          <pattern id="s2-guil" width="36" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 7 Q9 0 18 7 T36 7" fill="none" stroke="#CFE2C6" stroke-width="1.3"/>
          </pattern>
        </defs>
        <g filter="url(#${f})">
          <rect width="340" height="216" rx="18" fill="#F6F1DE"/>
          <g clip-path="url(#s2-cniclip)">
            <rect width="340" height="216" fill="url(#s2-guil)"/>
            <circle cx="262" cy="150" r="74" fill="none" stroke="#D9E8CF" stroke-width="2"/>
            <circle cx="262" cy="150" r="58" fill="none" stroke="#D9E8CF" stroke-width="1.5"/>
            <path d="${star(262, 150, 46)}" fill="${C.green}" opacity="0.10"/>
            <rect width="340" height="48" fill="${C.green}"/>
            <rect y="40" width="340" height="8" fill="#006A32"/>
            <circle cx="30" cy="24" r="15" fill="${C.yellow}"/>
            <path d="${star(30, 24.5, 10)}" fill="${C.green}"/>
            <rect x="58" y="13" width="150" height="8" rx="4" fill="#F3E6CF" opacity="0.95"/>
            <rect x="58" y="27" width="96" height="6" rx="3" fill="#F3E6CF" opacity="0.6"/>
            <rect x="262" y="14" width="58" height="18" rx="9" fill="#F3E6CF" opacity="0.25"/>
            <rect x="0" y="48" width="113.4" height="7" fill="${C.green}"/>
            <rect x="113.4" y="48" width="113.4" height="7" fill="${C.yellow}"/>
            <rect x="226.8" y="48" width="113.4" height="7" fill="${C.red}"/>
            <rect x="18" y="68" width="90" height="112" rx="9" fill="#C9D8E2"/>
            <rect x="18" y="68" width="90" height="112" rx="9" fill="none" stroke="#9FB3C2" stroke-width="2"/>
            <circle cx="63" cy="110" r="21" fill="#4F6475"/>
            <path d="M26 180 Q30 141 63 139 Q96 141 100 180 Z" fill="#4F6475"/>
            <path d="M50 99 Q56 92 64 92" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.45"/>
            <rect x="124" y="70" width="40" height="5" rx="2.5" fill="#A7B2A2"/>
            <rect x="124" y="80" width="118" height="10" rx="5" fill="#26332D"/>
            <rect x="124" y="100" width="30" height="5" rx="2.5" fill="#A7B2A2"/>
            <rect x="124" y="110" width="92" height="10" rx="5" fill="#26332D"/>
            <rect x="124" y="130" width="46" height="5" rx="2.5" fill="#A7B2A2"/>
            <rect x="124" y="140" width="56" height="10" rx="5" fill="#26332D"/>
            <rect x="190" y="130" width="30" height="5" rx="2.5" fill="#A7B2A2"/>
            <rect x="190" y="140" width="40" height="10" rx="5" fill="${C.red}" opacity="0.85"/>
            <path d="M126 172 c8 -14 16 4 23 -5 s9 -12 15 1 s12 -5 20 -11 s8 6 14 2" stroke="#26332D" stroke-width="2.4" fill="none" stroke-linecap="round"/>
            <rect x="266" y="70" width="52" height="40" rx="8" fill="#E7B53C"/>
            <path d="M266 90 H318 M292 70 V110 M279 70 V84 M305 96 V110 M266 82 H279 M305 98 H318" stroke="#B88629" stroke-width="2" fill="none"/>
            <rect x="268" y="72" width="22" height="6" rx="3" fill="#FFE39A" opacity="0.8"/>
            <rect x="0" y="184" width="340" height="32" fill="#EDE5CC"/>
            ${mrz}
            <path d="M210 -10 L262 -10 L132 226 L80 226 Z" fill="#fff" opacity="0.22"/>
          </g>
        </g>`,
    };
  }

  function stickerKeys(C) {
    return {
      vb: [-22, -22, 344, 384], w: 312, rest: -10,
      body: (f) => `
        <defs>
          <pattern id="s2-tagwax" width="18" height="18" patternUnits="userSpaceOnUse">
            <rect width="18" height="18" fill="${C.green}"/>
            <circle cx="9" cy="9" r="4.5" fill="${C.yellow}"/><circle cx="9" cy="9" r="1.8" fill="${C.red}"/>
            <path d="M0 0 h4 L0 4Z M18 18 h-4 l4 -4Z" fill="#F3E6CF"/>
          </pattern>
        </defs>
        <g filter="url(#${f})">
          <g class="s2-keyswing">
            <!-- porte-clés en cuir wax -->
            <g transform="rotate(34 150 112)">
              <circle cx="150" cy="128" r="9" fill="none" stroke="#AEB7BC" stroke-width="5"/>
              <rect x="124" y="136" width="52" height="92" rx="20" fill="url(#s2-tagwax)"/>
              <rect x="131" y="143" width="38" height="78" rx="15" fill="none" stroke="#F3E6CF" stroke-width="2.5" stroke-dasharray="6 5"/>
              <rect x="124" y="136" width="52" height="92" rx="20" fill="none" stroke="#005C2B" stroke-width="3"/>
              <circle cx="150" cy="150" r="6" fill="#D7DDE0" stroke="#8E9AA1" stroke-width="2"/>
            </g>
            <!-- clé argent, tête caoutchouc rouge -->
            <g transform="rotate(-30 150 112)">
              <rect x="143" y="160" width="15" height="112" rx="3" fill="#CDD5DA"/>
              <rect x="146" y="166" width="3" height="100" fill="#9AA6AD"/>
              <path d="M143 214 h-12 v10 h6 v8 h-8 v12 h10 v8 h-6 v12 h10 Z" fill="#CDD5DA"/>
              <rect x="122" y="108" width="57" height="62" rx="18" fill="${C.red}"/>
              <rect x="122" y="150" width="57" height="20" rx="8" fill="#B5141B"/>
              <path d="M132 124 h37 M132 134 h37" stroke="#B5141B" stroke-width="4" stroke-linecap="round"/>
              <circle cx="150" cy="118" r="7" fill="#F3E6CF"/>
              <path d="M128 120 q2 -8 10 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
            </g>
            <!-- clé laiton -->
            <g transform="rotate(10 150 112)">
              <rect x="142" y="166" width="17" height="124" rx="3" fill="#F2B632"/>
              <rect x="147" y="172" width="4" height="112" fill="#C98E12"/>
              <path d="M159 222 h14 v9 h-7 v9 h9 v12 h-11 v9 h7 v12 h-12 Z" fill="#F2B632"/>
              <path d="M142 286 l17 0 l-8.5 14 Z" fill="#F2B632"/>
              <circle cx="150" cy="142" r="32" fill="#F2B632"/>
              <circle cx="150" cy="142" r="32" fill="none" stroke="#C98E12" stroke-width="4"/>
              <circle cx="150" cy="128" r="9" fill="#F3E6CF"/>
              <path d="M126 140 a24 24 0 0 1 14 -22" stroke="#FFE39A" stroke-width="5" fill="none" stroke-linecap="round"/>
              <circle cx="150" cy="152" r="5" fill="#C98E12"/>
            </g>
          </g>
          <!-- anneau -->
          <circle cx="150" cy="78" r="44" fill="none" stroke="#8E9AA1" stroke-width="12"/>
          <circle cx="150" cy="78" r="44" fill="none" stroke="#C9D1D6" stroke-width="7"/>
          <path d="M116 58 A44 44 0 0 1 146 34" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        </g>`,
    };
  }

  function stickerWallet(C) {
    return {
      vb: [-22, -22, 368, 296], w: 268, rest: 6,
      body: (f) => `
        <defs>
          <clipPath id="s2-wclip"><rect x="10" y="80" width="300" height="152" rx="28"/></clipPath>
          <pattern id="s2-grain" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="1.1" fill="#000" opacity="0.13"/><circle cx="10" cy="11" r="0.9" fill="#fff" opacity="0.08"/>
          </pattern>
        </defs>
        <g filter="url(#${f})">
          <rect x="10" y="42" width="300" height="190" rx="28" fill="#6B3920"/>
          <!-- billet -->
          <g transform="rotate(-7 120 60)">
            <rect x="34" y="8" width="176" height="96" rx="7" fill="#8FC6A2"/>
            <rect x="42" y="16" width="160" height="80" rx="4" fill="none" stroke="#5E9B78" stroke-width="2.5"/>
            <circle cx="84" cy="50" r="20" fill="#5E9B78" opacity="0.55"/>
            <path d="M120 40 q15 -10 30 0 t30 0 M120 54 q15 -10 30 0 t30 0" stroke="#5E9B78" stroke-width="2.5" fill="none"/>
          </g>
          <!-- cartes -->
          <g transform="rotate(9 230 60)">
            <rect x="160" y="16" width="134" height="84" rx="10" fill="${C.yellow}"/>
            <rect x="160" y="34" width="134" height="12" fill="#D9C82C"/>
            <rect x="174" y="58" width="22" height="16" rx="3" fill="#E7B53C"/>
          </g>
          <g transform="rotate(17 250 70)">
            <rect x="196" y="30" width="118" height="80" rx="10" fill="${C.blue}"/>
            <rect x="208" y="42" width="40" height="7" rx="3.5" fill="#fff" opacity="0.6"/>
          </g>
          <!-- poche avant -->
          <rect x="10" y="80" width="300" height="152" rx="28" fill="#A85A32"/>
          <g clip-path="url(#s2-wclip)">
            <rect x="10" y="80" width="300" height="152" fill="url(#s2-grain)"/>
            <rect x="10" y="196" width="300" height="40" fill="#5A2E18" opacity="0.28"/>
            <path d="M10 80 H310 V92 Q160 100 10 92 Z" fill="#C46E42"/>
            <path d="M40 -10 L90 -10 L10 260 L-40 260 Z" fill="#fff" opacity="0.07"/>
          </g>
          <rect x="24" y="94" width="272" height="124" rx="18" fill="none" stroke="#F3E6CF" stroke-width="3" stroke-dasharray="9 7" opacity="0.85"/>
          <!-- languette + pression -->
          <path d="M238 112 H306 Q336 112 336 142 Q336 172 306 172 H238 Z" fill="#8C4527"/>
          <path d="M246 120 H304 Q326 120 326 142 Q326 164 304 164 H246" fill="none" stroke="#F3E6CF" stroke-width="2.5" stroke-dasharray="7 6" opacity="0.8"/>
          <path d="M238 165 H306 Q330 165 334 154 Q330 172 306 172 H238Z" fill="#5A2E18" opacity="0.4"/>
          <circle cx="300" cy="142" r="15" fill="#B9C2C8"/>
          <circle cx="300" cy="142" r="8" fill="#8E9AA1"/>
          <circle cx="295" cy="137" r="4" fill="#fff" opacity="0.8"/>
        </g>`,
    };
  }

  function stickerBag(C) {
    return {
      vb: [-22, -30, 344, 392], w: 252, rest: -7,
      body: (f) => `
        <defs>
          <pattern id="s2-wax" width="58" height="58" patternUnits="userSpaceOnUse">
            <rect width="58" height="58" fill="${C.sunset}"/>
            <circle cx="29" cy="29" r="19" fill="${C.blue}"/>
            <circle cx="29" cy="29" r="12" fill="${C.yellow}"/>
            <circle cx="29" cy="29" r="5" fill="${C.red}"/>
            <path d="M0 0 h14 a14 14 0 0 1 -14 14Z M58 0 v14 a14 14 0 0 1 -14 -14Z M0 58 v-14 a14 14 0 0 1 14 14Z M58 58 h-14 a14 14 0 0 1 14 -14Z" fill="${C.green}"/>
            <circle cx="29" cy="2" r="3" fill="#F3E6CF"/><circle cx="2" cy="29" r="3" fill="#F3E6CF"/>
            <circle cx="56" cy="29" r="3" fill="#F3E6CF"/><circle cx="29" cy="56" r="3" fill="#F3E6CF"/>
          </pattern>
          <clipPath id="s2-bagclip"><path d="M38 128 H262 L280 318 Q282 342 258 342 H42 Q18 342 20 318 Z"/></clipPath>
        </defs>
        <g filter="url(#${f})">
          <!-- anse arrière -->
          <g class="s2-handles">
            <path d="M118 132 C116 46 186 46 184 132" fill="none" stroke="#163F8F" stroke-width="17" stroke-linecap="round"/>
          </g>
          <!-- baguette qui dépasse -->
          <g transform="rotate(-22 110 120)">
            <rect x="86" y="-14" width="46" height="190" rx="23" fill="#E3A857"/>
            <rect x="92" y="-8" width="14" height="170" rx="7" fill="#F2CB86" opacity="0.8"/>
            <path d="M98 14 l26 -10 M98 46 l26 -10 M98 78 l26 -10 M98 110 l26 -10" stroke="#B5742F" stroke-width="6" stroke-linecap="round"/>
          </g>
          <!-- feuilles (menthe) -->
          <path d="M214 132 q-6 -50 26 -76 q4 44 -26 76Z" fill="${C.mint}"/>
          <path d="M228 132 q20 -40 56 -42 q-16 38 -56 42Z" fill="${C.green}"/>
          <path d="M218 128 q4 -30 18 -56" stroke="#005C2B" stroke-width="3" fill="none"/>
          <!-- corps wax -->
          <path d="M38 128 H262 L280 318 Q282 342 258 342 H42 Q18 342 20 318 Z" fill="url(#s2-wax)"/>
          <g clip-path="url(#s2-bagclip)">
            <path d="M196 120 H290 V350 H222 Z" fill="#0B1210" opacity="0.2"/>
            <path d="M58 170 L50 330" stroke="#fff" stroke-width="10" opacity="0.18" stroke-linecap="round"/>
            <rect x="0" y="128" width="300" height="34" fill="${C.blue}"/>
            <rect x="0" y="158" width="300" height="5" fill="#163F8F"/>
            <path d="M20 148 H280" stroke="${C.yellow}" stroke-width="3" stroke-dasharray="8 6"/>
          </g>
          <!-- anse avant -->
          <g class="s2-handles">
            <path d="M84 140 C82 22 218 22 216 140" fill="none" stroke="${C.blue}" stroke-width="19" stroke-linecap="round"/>
            <path d="M84 140 C82 22 218 22 216 140" fill="none" stroke="${C.yellow}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/>
          </g>
          <rect x="72" y="128" width="26" height="30" rx="5" fill="#163F8F"/>
          <rect x="202" y="128" width="26" height="30" rx="5" fill="#163F8F"/>
        </g>`,
    };
  }

  // ---------------------------------------------------------------- carte de Dakar (coords carte)
  const COAST = [
    [1010, -12], [870, 14], [760, 36], [660, 58], [560, 84], [480, 104], [440, 114], [390, 126], [360, 134],
    [320, 146], [275, 160], [240, 166], [200, 182], [160, 190], [135, 193], [120, 203], [100, 212], [86, 226],
    [112, 250], [140, 272], [166, 296], [186, 310], [214, 330], [240, 352], [258, 372], [276, 390], [292, 404],
    [314, 426], [330, 446], [346, 470], [362, 500], [384, 513],
    [402, 494], [418, 462], [412, 430], [408, 400], [420, 372], [440, 352], [470, 322], [510, 294], [540, 276],
    [580, 252], [630, 228], [670, 238], [720, 258], [800, 288], [870, 316], [930, 332], [1010, 350],
  ];
  // Épingles des 5 objets (ordre des stickers) puis épingles « du jour ».
  const OBJ_PINS = [[345, 375], [369, 446], [380, 182], [512, 200], [206, 284]]; // Colobane, Sandaga, Parcelles, Pikine, Ouakam
  const EXTRA_PINS = [[262, 200], [150, 232], [286, 364], [244, 322], [338, 262], [470, 282], [528, 136],
    [640, 170], [574, 226], [430, 232], [300, 300], [400, 320], [600, 120], [458, 160], [372, 412]];
  const BLINKS = [[300, 240], [430, 290], [560, 170], [610, 200], [690, 150], [220, 270], [400, 196], [322, 344], [520, 250], [480, 120], [200, 220]];

  // ---------------------------------------------------------------- scène
  FEKK.scene({
    id: ID, start: START, end: END,
    build(root, tl, ctx) {
      const C = ctx.C;
      const S = gsap.set;
      const q = (s, r = root) => r.querySelector(s);
      const qa = (s, r = root) => Array.from(r.querySelectorAll(s));
      const rng = FEKK.rng(2047);

      // ---------------- styles
      root.appendChild(FEKK.el(`<style>
        .s2-full { position:absolute; left:0; top:0; width:1080px; height:1920px; }
        .s2-bg { background:${C.ink}; }
        .s2-cam { transform-origin:${O[0]}px ${O[1]}px; }
        .s2-row { position:absolute; left:0; width:1080px; }
        .s2-band { position:absolute; left:-260px; width:1600px; top:0; bottom:0; }
        .s2-tx { position:absolute; top:0; white-space:nowrap; font-family:var(--display); font-weight:800;
          letter-spacing:-0.035em; line-height:0.9; }
        .s2-tx .s2-line { display:block; }
        .s2-tx .s2-ch { display:inline-block; }
        .s2-stk { position:absolute; }
        .s2-stk-sq, .s2-stk-sw { position:absolute; inset:0; }
        .s2-stk svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; display:block; }
        .s2-speed { position:absolute; height:6px; border-radius:3px; background:#F3E6CF; }
        .s2-burst { position:absolute; overflow:visible; }
        .s2-pin { position:absolute; left:0; top:0; width:40px; height:52px; margin-left:-20px; margin-top:-50px; overflow:visible; }
        .s2-sub { position:absolute; left:0; width:1080px; top:1040px; text-align:center; white-space:nowrap;
          font-family:var(--display); font-weight:700; font-size:66px; letter-spacing:-0.02em; color:${C.sand}; line-height:1; }
        .s2-sub-in { display:inline-block; position:relative; padding-left:52px; }
        .s2-sub-mask { display:inline-block; overflow:hidden; padding:6px 4px 12px; vertical-align:top; }
        .s2-sub .s2-sch { display:inline-block; }
        .s2-live { position:absolute; left:4px; top:30px; width:26px; height:26px; border-radius:50%; background:${C.red}; }
        .s2-live-ring { position:absolute; left:4px; top:30px; width:26px; height:26px; border-radius:50%; border:3px solid ${C.red}; }
        .s2-q { position:absolute; left:0; width:1080px; top:1158px; text-align:center; white-space:nowrap;
          font-family:var(--display); font-weight:800; letter-spacing:-0.035em; line-height:0.9; color:${C.sand}; }
        .s2-qline { position:relative; display:block; }
        .s2-qmask { display:inline-block; overflow:hidden; padding:0.22em 0.04em 0.16em; margin:-0.22em -0.04em -0.16em; vertical-align:top; }
        .s2-qw { display:inline-block; }
        .s2-ql2 > .s2-qmask:last-child { margin-left:0.1em; } /* le marqueur déborde de 20 px : l'espace avant « ? » reste visible */
        .s2-hl-wrap { position:relative; display:inline-block; }
        .s2-hl .s2-hch { display:inline-block; }
        .s2-mark { position:absolute; overflow:visible; }
        .s2-flood { position:absolute; border-radius:50%; background:${C.green}; }
        .s2-logo { position:absolute; overflow:visible; }
        .s2-logo svg { width:100%; height:100%; overflow:visible; display:block; }
      </style>`));

      // ---------------- defs SVG (filtres de flou directionnel, découpe sticker)
      const STK = [stickerPhone(C), stickerCNI(C), stickerKeys(C), stickerWallet(C), stickerBag(C)];
      let defs = '';
      for (let i = 0; i < 5; i++) {
        defs += `<filter id="s2-mb${i}" x="-25%" y="-10%" width="150%" height="120%"><feGaussianBlur class="s2-mbf" stdDeviation="0 0"/></filter>`;
      }
      root.appendChild(FEKK.el(`<svg width="0" height="0" style="position:absolute"><defs>${defs}
        <filter id="s2-q-mb" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur class="s2-qmbf" stdDeviation="0 0"/></filter>
      </defs></svg>`));

      // ---------------- fond : ink + motif wax ton sur ton, en parallaxe
      const bg = FEKK.el(`<div class="s2-full s2-bg"></div>`);
      root.appendChild(bg);
      const bgPat = FEKK.el(`
        <svg class="s2-full" viewBox="0 0 1080 2300" width="1080" height="2300" style="top:-190px">
          <defs>
            <pattern id="s2-bgwax" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
              <circle cx="45" cy="45" r="30" fill="none" stroke="#15221E" stroke-width="5"/>
              <circle cx="45" cy="45" r="12" fill="#121D1A"/>
              <path d="M95 20 l20 18 l20 -18 l20 18" fill="none" stroke="#131F1B" stroke-width="5" stroke-linejoin="round"/>
              <circle cx="135" cy="135" r="30" fill="none" stroke="#15221E" stroke-width="5"/>
              <path d="M120 135 h30 M135 120 v30" stroke="#121D1A" stroke-width="5"/>
              <path d="M10 120 l20 18 l20 -18 l20 18" fill="none" stroke="#131F1B" stroke-width="5" stroke-linejoin="round"/>
              <circle cx="90" cy="90" r="4" fill="#17241F"/><circle cx="0" cy="0" r="4" fill="#17241F"/>
            </pattern>
            <radialGradient id="s2-vig" cx="0.5" cy="0.46" r="0.62">
              <stop offset="0.55" stop-color="#0B1210" stop-opacity="0"/><stop offset="1" stop-color="#0B1210" stop-opacity="0.85"/>
            </radialGradient>
          </defs>
          <rect width="1080" height="2300" fill="url(#s2-bgwax)"/>
          <rect width="1080" height="2300" fill="url(#s2-vig)"/>
        </svg>`);
      root.appendChild(bgPat);
      S(bgPat, { opacity: 0 });
      tl.to(bgPat, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.05);
      tl.fromTo(bgPat, { y: 0 }, { y: 160, duration: 3.5, ease: 'none', immediateRender: false }, 0);

      // ================================================================ CARTE (sous le mur)
      const mapCam = FEKK.el(`<div class="s2-full"></div>`);
      root.appendChild(mapCam);
      const coastD = crPath(COAST);
      const landD = coastD + ' L1010,-12 Z';
      const roads = [
        crPath([[372, 452], [392, 380], [440, 318], [520, 262], [640, 214], [780, 168], [1010, 120]]),
        crPath([[360, 440], [318, 372], [290, 300], [262, 236], [236, 186]]),
        crPath([[392, 372], [372, 300], [372, 220], [384, 150]]),
        crPath([[268, 380], [214, 318], [150, 262], [112, 230]]),
      ];
      const mapSvg = FEKK.el(`
        <svg class="s2-full" viewBox="0 0 1080 1920" width="1080" height="1920" style="overflow:visible">
          <defs>
            <pattern id="s2-dots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="2" fill="#F3E6CF" opacity="0.16"/>
            </pattern>
            <pattern id="s2-landpat" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="22" height="22" fill="#163528"/><rect width="3" height="22" fill="#1A3D2F"/>
            </pattern>
            <clipPath id="s2-mapclip"><circle class="s2-mapclip-c" cx="${TIP[0]}" cy="${TIP[1]}" r="0"/></clipPath>
          </defs>
          <g clip-path="url(#s2-mapclip)">
            <rect x="0" y="0" width="1080" height="1920" fill="url(#s2-dots)"/>
            <g transform="translate(${MAP.x} ${MAP.y}) scale(${MAP.k})">
              <path d="${landD}" fill="#04140D" transform="translate(7 9)"/>
              <path d="${landD}" fill="url(#s2-landpat)"/>
              ${roads.map((d) => `<path d="${d}" fill="none" stroke="#2A5747" stroke-width="3.2" stroke-linecap="round"/>`).join('')}
              <ellipse cx="128" cy="178" rx="9" ry="6" fill="#163528" stroke="#F3E6CF" stroke-width="2.6"/>
              <ellipse cx="278" cy="500" rx="7" ry="5" fill="#163528" stroke="#F3E6CF" stroke-width="2.6"/>
              <ellipse cx="486" cy="461" rx="8" ry="5" fill="#163528" stroke="#F3E6CF" stroke-width="2.6"/>
            </g>
            <g font-family="Inter Variable, sans-serif" font-weight="600" font-size="19" letter-spacing="3.2" fill="#F3E6CF">
              <g transform="translate(150 316)" opacity="0.6">
                <circle r="34" fill="none" stroke="#F3E6CF" stroke-width="2" stroke-dasharray="3 6"/>
                <path d="M0 -26 L8 0 L0 6 L-8 0Z" fill="${C.red}"/><path d="M0 26 L8 0 L0 -6 L-8 0Z" fill="#F3E6CF" opacity="0.6"/>
                <text x="0" y="-42" text-anchor="middle" font-size="18" letter-spacing="0">N</text>
              </g>
              <text x="104" y="404" font-style="italic" opacity="0.45">OCÉAN</text>
              <text x="104" y="430" font-style="italic" opacity="0.45">ATLANTIQUE</text>
              <path d="M${mp(86, 226)[0]} ${mp(86, 226)[1] + 8} V${mp(86, 226)[1] + 92}" stroke="#F3E6CF" stroke-width="2" opacity="0.5"/>
              <text x="${mp(86, 226)[0] - 6}" y="${mp(86, 226)[1] + 120}" opacity="0.75">ALMADIES</text>
              <path d="M${mp(392, 506)[0] + 4} ${mp(392, 506)[1] + 2} L${mp(392, 506)[0] + 44} ${mp(392, 506)[1] + 24}" stroke="#F3E6CF" stroke-width="2" opacity="0.5"/>
              <text x="${mp(392, 506)[0] + 52}" y="${mp(392, 506)[1] + 34}" opacity="0.75">PLATEAU</text>
              <text x="${mp(500, 470)[0]}" y="${mp(500, 470)[1] + 6}" opacity="0.55" font-size="16">GORÉE</text>
              <text x="${mp(560, 336)[0]}" y="${mp(560, 336)[1]}" opacity="0.45" font-style="italic" font-size="18">BAIE DE HANN</text>
            </g>
          </g>
          <g transform="translate(${MAP.x} ${MAP.y}) scale(${MAP.k})">
            <path class="s2-coast" d="${coastD}" fill="none" stroke="#F3E6CF" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
          </g>
          <g class="s2-blinks"></g>
          <g class="s2-radar"><circle cx="${TIP[0]}" cy="${TIP[1]}" r="10" fill="none" stroke="${C.mint}" stroke-width="7"/></g>
        </svg>`);
      mapCam.appendChild(mapSvg);
      const pinLayer = FEKK.el(`<div class="s2-full"></div>`);
      mapCam.appendChild(pinLayer);
      S(mapCam, { transformOrigin: `${TIP[0]}px ${TIP[1]}px` });
      tl.fromTo(mapCam, { scale: 1 }, { scale: 1.07, duration: END - START - T_COLLAPSE, ease: 'none', immediateRender: false }, T_COLLAPSE);

      const clipC = q('.s2-mapclip-c', mapSvg);
      tl.fromTo(clipC, { attr: { r: 0 } }, { attr: { r: 1050 }, duration: 0.55, ease: 'power2.inOut', immediateRender: false }, T_COLLAPSE + 0.04);
      const coast = q('.s2-coast', mapSvg);
      S(coast, { drawSVG: '0% 0%' });
      tl.fromTo(coast, { drawSVG: '38% 38%' }, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.inOut', immediateRender: false }, T_COLLAPSE + 0.02);

      // Points qui clignotent (rouges) + épingles
      const blinkG = q('.s2-blinks', mapSvg);
      const pinSvg = (dotC = '#F3E6CF', body = '#8C9792', shade = '#5F6B66') => `
        <svg class="s2-pin" viewBox="0 0 40 52">
          <ellipse cx="20" cy="50" rx="9" ry="3" fill="#000" opacity="0.45"/>
          <path class="s2-pinb" d="M20 2C10.6 2 3.5 9.3 3.5 18.6 3.5 30.6 20 49 20 49S36.5 30.6 36.5 18.6C36.5 9.3 29.4 2 20 2Z" fill="${body}"/>
          <path class="s2-pins" d="M20 2C29.4 2 36.5 9.3 36.5 18.6 36.5 30.6 20 49 20 49Z" fill="${shade}" opacity="0.55"/>
          <circle cx="20" cy="18" r="6.5" fill="#0B1210"/>
          <circle cx="20" cy="18" r="3.4" fill="${dotC}"/>
        </svg>`;
      BLINKS.forEach(([x, y], i) => {
        const [sx, sy] = mp(x, y);
        const g = FEKK.el(`<svg><g><circle cx="${sx}" cy="${sy}" r="16" fill="none" stroke="${C.red}" stroke-width="3"/><circle cx="${sx}" cy="${sy}" r="6.5" fill="${C.red}"/></g></svg>`).firstElementChild;
        blinkG.appendChild(g);
        const ring = g.children[0], dot = g.children[1];
        S([ring, dot], { opacity: 0, transformOrigin: '50% 50%', svgOrigin: `${sx} ${sy}` });
        const t0 = T_COLLAPSE + 0.3 + i * 0.07;
        tl.fromTo(dot, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.12, ease: 'back.out(3)', immediateRender: false }, t0);
        // clignotement en marches (pas de fondu mou)
        for (let k = 1; k < 9; k++) tl.set(dot, { opacity: k % 2 ? 0.25 : 1 }, t0 + k * (0.13 + (i % 3) * 0.02));
        tl.fromTo(ring, { scale: 0.3, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.55, ease: 'power2.out', repeat: 2, immediateRender: false }, t0 + 0.05);
      });

      // Épingles « du jour » (en plus des 5 objets)
      const allPins = [];
      EXTRA_PINS.forEach(([x, y], i) => {
        const [sx, sy] = mp(x, y);
        const p = FEKK.el(pinSvg());
        pinLayer.appendChild(p);
        S(p, { x: sx, y: sy, scale: 0, transformOrigin: '50% 96%' });
        const t0 = T_COLLAPSE + 0.22 + i * 0.035 + rng() * 0.05;
        tl.fromTo(p, { scale: 0, y: sy - 50 }, { scale: 1, y: sy, duration: 0.2, ease: 'back.out(2.6)', immediateRender: false }, t0);
        tl.to(p, { scaleY: 0.78, scaleX: 1.18, duration: 0.05, ease: 'power2.out' }, t0 + 0.2);
        tl.to(p, { scaleY: 1, scaleX: 1, duration: 0.25, ease: 'elastic.out(1,0.4)' }, t0 + 0.25);
        allPins.push({ el: p, x: sx, y: sy });
      });

      // ================================================================ MUR TYPOGRAPHIQUE
      const camPos = FEKK.el(`<div class="s2-full s2-cam"></div>`);
      const camRot = FEKK.el(`<div class="s2-full s2-cam"></div>`);
      const camPunch = FEKK.el(`<div class="s2-full s2-cam"></div>`);
      camPos.appendChild(camRot); camRot.appendChild(camPunch);
      root.appendChild(camPos);
      const rowsLayer = FEKK.el(`<div class="s2-full"></div>`);
      const fxLayer = FEKK.el(`<div class="s2-full"></div>`);
      const stkLayer = FEKK.el(`<div class="s2-full"></div>`);
      camPunch.appendChild(rowsLayer); camPunch.appendChild(fxLayer); camPunch.appendChild(stkLayer);

      // Lignes de chaque mot
      const ROWS = [
        { lines: ['Téléphone.'], align: 'L', band: C.blue, shade: '#163F8F', ink: C.sand, cap: 190 },
        { lines: ['Carte', 'd’identité.'], align: 'R', band: C.green, shade: '#005C2B', ink: C.sand, cap: 150 },
        { lines: ['Clés.'], align: 'L', band: C.yellow, shade: '#C9B820', ink: C.ink, cap: 222 },
        { lines: ['Portefeuille.'], align: 'R', band: C.sunset, shade: C.clay, ink: C.ink, cap: 150, fk: 0.92, stkMin: 46 },
        { lines: ['Sac.'], align: 'L', band: C.red, shade: '#9E1016', ink: C.sand, cap: 236 },
      ];
      const XL = 120, XR = 960;               // bord gauche / droit du texte (zone sûre)
      const GAP = 16;

      // Mesure des largeurs à 100px
      const meas = FEKK.el(`<div class="s2-tx" style="font-size:100px;visibility:hidden;left:0;top:0"></div>`);
      root.appendChild(meas);
      ROWS.forEach((r, i) => {
        const st = STK[i];
        const avail = (XR - XL) - st.w * 0.62;
        let wmax = 0;
        r.lines.forEach((l) => { meas.textContent = l; wmax = Math.max(wmax, meas.getBoundingClientRect().width); });
        r.fs = Math.floor(Math.min(r.cap, (avail / wmax) * 100) * (r.fk || 1));
        r.tw = (wmax * r.fs) / 100;
      });
      meas.remove();
      // Hauteurs
      let y = 0;
      ROWS.forEach((r) => {
        r.pad = Math.round(r.fs * 0.11 + 8);
        r.h = Math.round(r.lines.length * r.fs * 0.9 + r.pad * 2);
        r.top = y; y += r.h + GAP;
      });
      const totalH = y - GAP;
      const top0 = O[1] - totalH / 2 + 16;
      ROWS.forEach((r) => { r.top += top0; r.cy = r.top + r.h / 2; });

      // Caméra : à chaque coup, la pile déjà posée est recentrée sur O.
      const CAM_S = [1.07, 1.05, 1.03, 1.015, 1.0];
      const camY = ROWS.map((r, k) => {
        const c = (ROWS[0].top + ROWS[k].top + ROWS[k].h) / 2;
        return -CAM_S[k] * (c - O[1]);
      });
      const ROT0 = -2.6, ROT1 = -0.4, ROT_T = 2.4;
      const rotAt = (t) => ROT0 + (ROT1 - ROT0) * Math.min(1, t / ROT_T);
      S(camPos, { y: camY[0] - 40, scale: CAM_S[0] + 0.12 });
      tl.to(camPos, { y: camY[0], scale: CAM_S[0], duration: 0.42, ease: 'fekk.snap' }, 0);
      for (let k = 1; k < 5; k++) tl.to(camPos, { y: camY[k], scale: CAM_S[k], duration: 0.34, ease: 'fekk.snap' }, HITS[k] - 0.015);
      S(camRot, { rotation: ROT0 });
      tl.to(camRot, { rotation: ROT1, duration: ROT_T, ease: 'none' }, 0);
      HITS.forEach((h, k) => {
        tl.fromTo(camPunch, { scale: 1.035, y: -10, rotation: k % 2 ? 0.6 : -0.6 },
          { scale: 1, y: 0, rotation: 0, duration: 0.26, ease: 'power3.out', immediateRender: k === 0 }, h);
      });

      // Construction des rangées
      const rowEls = ROWS.map((r, i) => {
        const left = r.align === 'L' ? XL : XR - r.tw;
        const el = FEKK.el(`
          <div class="s2-row" style="top:${r.top}px;height:${r.h}px">
            <div class="s2-band" style="background:${r.band};box-shadow:0 12px 0 ${r.shade}"></div>
            <div class="s2-tx" style="left:${left}px;top:${r.pad + r.fs * 0.02}px;font-size:${r.fs}px;color:${r.ink};
              text-align:${r.align === 'L' ? 'left' : 'right'};width:${Math.ceil(r.tw) + 4}px;
              text-shadow:${(r.fs * 0.035).toFixed(1)}px ${(r.fs * 0.045).toFixed(1)}px 0 ${r.shade}">
              ${r.lines.map((l) => `<span class="s2-line">${l}</span>`).join('')}
            </div>
          </div>`);
        rowsLayer.appendChild(el);
        return el;
      });

      // Stickers (positions en coordonnées du mur)
      const stkEls = STK.map((st, i) => {
        const r = ROWS[i];
        const ratio = st.vb[3] / st.vb[2];
        const w = st.w, h = w * ratio;
        let cx;
        if (r.align === 'L') cx = Math.min(XL + r.tw + 22 + w * 0.5, 1000 - w * 0.5);
        else cx = Math.max(XR - r.tw - 22 - w * 0.5, (r.stkMin ?? 80) + w * 0.5);
        const cy = r.cy + [-6, 4, 6, 0, -4][i];
        const pxPerU = w / st.vb[2];
        const fid = `s2-die${i}`;
        const el = FEKK.el(`
          <div class="s2-stk" style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px">
            <div class="s2-stk-sq"><div class="s2-stk-sw">
              <svg viewBox="${st.vb.join(' ')}" xmlns="http://www.w3.org/2000/svg">
                <defs>${dieFilter(fid, 8 / pxPerU, 7 / pxPerU, 10 / pxPerU)}</defs>
                ${st.body(fid)}
              </svg>
            </div></div>
          </div>`);
        stkLayer.appendChild(el);
        return { el, sq: q('.s2-stk-sq', el), sw: q('.s2-stk-sw', el), cx, cy, w, h, rest: st.rest };
      });

      // Rafales d'impact (traits radiaux) autour des stickers
      const bursts = stkEls.map((s, i) => {
        const R0 = Math.max(s.w, s.h) * 0.5 + 6, R1 = R0 + 54;
        let lines = '';
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2 + i * 0.4;
          lines += `<line x1="${(Math.cos(a) * R0).toFixed(1)}" y1="${(Math.sin(a) * R0).toFixed(1)}" x2="${(Math.cos(a) * R1).toFixed(1)}" y2="${(Math.sin(a) * R1).toFixed(1)}"/>`;
        }
        const col = i === 2 ? C.sand : C.yellow;
        const el = FEKK.el(`<svg class="s2-burst" style="left:${s.cx}px;top:${s.cy}px" width="1" height="1"><g stroke="${col}" stroke-width="9" stroke-linecap="round">${lines}</g></svg>`);
        fxLayer.appendChild(el);
        return qa('line', el);
      });

      // ---------------- animation de chaque coup
      const mbProxy = [];
      ROWS.forEach((r, i) => {
        const h = HITS[i];
        const row = rowEls[i];
        const band = q('.s2-band', row);
        const tx = q('.s2-tx', row);
        const split = new SplitText(qa('.s2-line', tx), { type: 'chars', charsClass: 's2-ch' });
        r.chars = split.chars;
        const dir = r.align === 'L' ? -1 : 1;
        const fe = q(`#s2-mb${i} .s2-mbf`, root);

        // Bandeau : flash (couleur du bandeau éclaircie vers sand) → couleur, entre par le côté du texte
        S(band, { scaleX: 0, transformOrigin: r.align === 'L' ? '0% 50%' : '100% 50%', backgroundColor: gsap.utils.interpolate(r.band, C.sand, 0.45) });
        tl.to(band, { scaleX: 1, duration: 0.14, ease: 'power4.out' }, h);
        tl.to(band, { backgroundColor: r.band, duration: 0.07, ease: 'power1.in' }, h + 0.015);

        // Mot : glisse + scale 1.3→1 + flou de bougé directionnel
        S(tx, { transformOrigin: r.align === 'L' ? '0% 50%' : '100% 50%' });
        tl.fromTo(tx, { x: dir * 260, scale: 1.3 }, { x: 0, scale: 1, duration: 0.3, ease: 'fekk.snap', immediateRender: true }, h);
        const px = { b: 34 };
        mbProxy.push(px);
        S(tx, { filter: `url(#s2-mb${i})` });
        fe.setAttribute('stdDeviation', '34 0');
        tl.fromTo(px, { b: 34 }, {
          b: 0, duration: 0.16, ease: 'power2.out', immediateRender: false,
          onUpdate: () => fe.setAttribute('stdDeviation', `${px.b.toFixed(2)} 0`),
        }, h);
        tl.set(tx, { filter: 'none' }, h + 0.17);
        // lettres en cascade (overlap)
        const order = r.align === 'L' ? r.chars : r.chars.slice().reverse();
        S(r.chars, { opacity: 0 });
        // (le mot est déjà présent, flou, dès la première image de la plaque)
        tl.fromTo(order, { opacity: 0.55, yPercent: 55, scaleY: 1.5, transformOrigin: '50% 100%' },
          { opacity: 1, yPercent: 0, scaleY: 1, duration: 0.2, ease: 'back.out(2.4)', stagger: 0.014, immediateRender: false }, h + 0.005);

        // Traits de vitesse
        for (let k = 0; k < 6; k++) {
          const ly = r.top + r.h * (0.12 + 0.76 * rng());
          const lw = 180 + rng() * 360;
          const so = +(0.5 + rng() * 0.5).toFixed(2);
          const sl = FEKK.el(`<div class="s2-speed" style="top:${ly}px;left:0;width:${lw}px;height:${(3 + rng() * 6).toFixed(1)}px"></div>`);
          fxLayer.appendChild(sl);
          const from = dir < 0 ? -lw - 40 : 1080 + 40, to = dir < 0 ? 900 + rng() * 300 : -lw - 200 - rng() * 300;
          S(sl, { x: from, opacity: 0 });
          const t0 = h + rng() * 0.05;
          tl.set(sl, { opacity: so }, t0);
          tl.to(sl, { x: to, duration: 0.2 + rng() * 0.08, ease: 'power2.out' }, t0);
          tl.set(sl, { opacity: 0 }, t0 + 0.3);
        }

        // Le coup suivant : bandeau qui se retire, texte en contour
        if (i < 4) {
          const hn = HITS[i + 1];
          tl.set(band, { transformOrigin: r.align === 'L' ? '100% 50%' : '0% 50%' }, hn - 0.03);
          tl.to(band, { scaleX: 0, duration: 0.16, ease: 'power3.in' }, hn - 0.03);
          tl.to(tx, { color: C.sand, textShadow: `${(r.fs * 0.035).toFixed(1)}px ${(r.fs * 0.045).toFixed(1)}px 0px rgba(0,0,0,0)`, duration: 0.12, ease: 'none' }, hn);
        }
      });

      // ---------------- stickers : entrées variées
      const T_IMP = HITS.map((h) => h + 0.11);
      stkEls.forEach((s, i) => {
        const ti = T_IMP[i], h = HITS[i];
        S(s.el, { transformOrigin: '50% 50%', opacity: 0 });
        tl.set(s.el, { opacity: 1 }, Math.max(0, h - 0.03));
        S(s.sq, { transformOrigin: '50% 100%' });
        S(s.sw, { rotation: s.rest, transformOrigin: '50% 50%' });
        if (i === 0) {
          // Téléphone : retombe en vrille (écho de S1)
          tl.fromTo(s.el, { y: -900, rotation: 220, scale: 0.8 }, { y: 0, rotation: 0, scale: 1, duration: ti - h, ease: 'power2.in', immediateRender: true }, h);
        } else if (i === 1) {
          // CNI : lancée de côté comme une carte à jouer
          tl.fromTo(s.el, { x: -760, y: -120, rotation: -260, scale: 0.7 }, { x: 0, y: 0, rotation: 0, scale: 1, duration: ti - h + 0.03, ease: 'power3.out', immediateRender: true }, h - 0.03);
        } else if (i === 2) {
          // Clés : tombent, puis balancier
          tl.fromTo(s.el, { y: -820, rotation: -30 }, { y: 0, rotation: 0, duration: ti - h + 0.03, ease: 'power2.in', immediateRender: true }, h - 0.03);
        } else if (i === 3) {
          // Portefeuille : jaillit du bas, tourne
          tl.fromTo(s.el, { y: 700, rotation: 90, scale: 0.6 }, { y: 0, rotation: 0, scale: 1, duration: ti - h + 0.03, ease: 'power3.out', immediateRender: true }, h - 0.03);
        } else {
          // Sac : jeté depuis la droite, sur sa propre rangée (ne passe pas devant « Portefeuille. »)
          tl.fromTo(s.el, { x: 760, rotation: 40 }, { x: 0, rotation: 0, duration: ti - h + 0.03, ease: 'power2.in', immediateRender: true }, h - 0.03);
        }
        // Squash & stretch à l'impact
        const horiz = i === 1 || i === 3 || i === 4;
        tl.to(s.sq, horiz ? { scaleX: 0.84, scaleY: 1.14, duration: 0.05, ease: 'power2.out' } : { scaleX: 1.24, scaleY: 0.78, duration: 0.05, ease: 'power2.out' }, ti);
        tl.to(s.sq, horiz ? { scaleX: 1.08, scaleY: 0.94, duration: 0.08, ease: 'sine.inOut' } : { scaleX: 0.9, scaleY: 1.12, duration: 0.08, ease: 'sine.inOut' }, ti + 0.05);
        tl.to(s.sq, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1,0.38)' }, ti + 0.13);
        // Rafale d'impact
        const lines = bursts[i];
        S(lines, { drawSVG: '0% 0%', opacity: 0 });
        tl.set(lines, { opacity: 1 }, ti);
        tl.to(lines, { drawSVG: '0% 100%', duration: 0.08, ease: 'power2.out' }, ti);
        tl.to(lines, { drawSVG: '100% 100%', duration: 0.14, ease: 'power2.in' }, ti + 0.08);
        tl.set(lines, { opacity: 0 }, ti + 0.22);
        // Respiration : balancement léger jusqu'à l'effondrement
        tl.to(s.sw, { rotation: s.rest + (i % 2 ? 3.5 : -3.5), duration: 0.42, ease: 'sine.inOut', repeat: 4, yoyo: true }, ti + 0.16);
        tl.to(s.sq, { y: -8, duration: 0.5, ease: 'sine.inOut', repeat: 3, yoyo: true }, ti + 0.4);
        // Le coup suivant : le sticker recule dans le mur
        if (i < 4) tl.to(s.el, { scale: 0.8, duration: 0.3, ease: 'back.out(2)' }, HITS[i + 1]);
      });
      // Clés : balancier amorti autour de l'anneau
      const keySwing = q('.s2-keyswing', stkEls[2].el);
      S(keySwing, { svgOrigin: '150 78' });
      [[22, 0.1], [-16, 0.12], [10, 0.12], [-6, 0.12], [3, 0.12], [0, 0.14]].reduce((t, [a, d]) => {
        tl.to(keySwing, { rotation: a, duration: d, ease: 'sine.inOut' }, t);
        return t + d;
      }, T_IMP[2]);
      // Sac : les anses suivent avec retard
      qa('.s2-handles', stkEls[4].el).forEach((hd, k) => {
        S(hd, { svgOrigin: '150 138' });
        tl.to(hd, { scaleY: 0.72, rotation: k ? 6 : -6, duration: 0.07, ease: 'power2.out' }, T_IMP[4] + 0.02);
        tl.to(hd, { scaleY: 1, rotation: 0, duration: 0.4, ease: 'elastic.out(1,0.35)' }, T_IMP[4] + 0.09);
      });

      // ================================================================ EFFONDREMENT → ÉPINGLES
      // Lettres : petit saut d'anticipation puis chute en vrille
      ROWS.forEach((r, i) => {
        r.chars.forEach((ch) => {
          const t0 = T_COLLAPSE + (4 - i) * 0.012 + rng() * 0.04;
          tl.to(ch, { yPercent: -16, duration: 0.06, ease: 'power2.out' }, t0);
          tl.to(ch, {
            yPercent: 0, y: 2300 + rng() * 600, x: (rng() - 0.5) * 360, rotation: (rng() - 0.5) * 220,
            duration: 0.26 + rng() * 0.08, ease: 'power2.in',
          }, t0 + 0.06);
        });
      });
      tl.set(q('.s2-band', rowEls[4]), { transformOrigin: '100% 50%' }, T_COLLAPSE);
      tl.to(q('.s2-band', rowEls[4]), { scaleX: 0, duration: 0.2, ease: 'power3.in' }, T_COLLAPSE + 0.02);

      // Position écran d'un point du mur à l'instant t (caméra posée : punch = 1, camPos final)
      const toScreen = (p, t) => {
        const th = (rotAt(t) * Math.PI) / 180, s = CAM_S[4];
        const dx = p[0] - O[0], dy = p[1] - O[1];
        const rx = dx * Math.cos(th) - dy * Math.sin(th), ry = dx * Math.sin(th) + dy * Math.cos(th);
        return [O[0] + s * rx, O[1] + camY[4] + s * ry];
      };
      stkEls.forEach((s, i) => {
        const t0 = T_COLLAPSE + 0.02 + i * 0.045;
        tl.to(s.el, { scale: (i < 4 ? 0.8 : 1) * 1.12, duration: 0.06, ease: 'power2.out' }, t0);
        tl.to(s.el, { scale: 0, rotation: (i % 2 ? 1 : -1) * 160, duration: 0.17, ease: 'power3.in' }, t0 + 0.06);
        // le jeton-épingle naît là où le sticker disparaît et vole vers son quartier
        const [sx, sy] = toScreen([s.cx, s.cy + s.h * 0.2], t0 + 0.2);
        const [ex, ey] = mp(...OBJ_PINS[i]);
        const p = FEKK.el(pinSvg([C.blue, C.green, C.yellow, C.sunset, C.red][i]));
        pinLayer.appendChild(p);
        S(p, { x: sx, y: sy, scale: 0, transformOrigin: '50% 96%' });
        const tf = t0 + 0.16;
        tl.to(p, { scale: 2.2, duration: 0.04, ease: 'power2.out' }, tf);
        const mx = (sx + ex) / 2 + (i % 2 ? 120 : -120), my = Math.min(sy, ey) - 220;
        tl.to(p, {
          motionPath: { path: [{ x: sx, y: sy }, { x: mx, y: my }, { x: ex, y: ey }], curviness: 1.25 },
          scale: 1.15, duration: 0.42, ease: 'power2.inOut',
        }, tf + 0.04);
        tl.to(p, { scaleY: 0.72, scaleX: 1.3, duration: 0.05, ease: 'power2.out' }, tf + 0.46);
        tl.to(p, { scaleY: 1.15, scaleX: 1.15, duration: 0.3, ease: 'elastic.out(1,0.4)' }, tf + 0.51);
        allPins.push({ el: p, x: ex, y: ey, obj: true });
      });

      // Petites ondes sous chaque épingle (rien de figé)
      allPins.forEach((pn, i) => {
        if (pn.obj) return;
        const ring = FEKK.el(`<svg><ellipse cx="${pn.x}" cy="${pn.y}" rx="20" ry="7" fill="none" stroke="#8C9792" stroke-width="2.5"/></svg>`).firstElementChild;
        q('.s2-blinks', mapSvg).appendChild(ring);
        S(ring, { svgOrigin: `${pn.x} ${pn.y}`, scale: 0, opacity: 0 });
        tl.fromTo(ring, { scale: 0.4, opacity: 0.9 }, { scale: 2.2, opacity: 0, duration: 0.7, ease: 'power2.out', repeat: 2, immediateRender: false }, T_COLLAPSE + 0.4 + (i % 5) * 0.12);
      });

      // ================================================================ TEXTES
      const txt = FEKK.el(`<div class="s2-full"></div>`);
      root.appendChild(txt);
      const sub = FEKK.el(`<div class="s2-sub"><span class="s2-sub-in"><span class="s2-live-ring"></span><span class="s2-live"></span><span class="s2-sub-mask"><span class="s2-sub-t">Chaque jour à Dakar.</span></span></span></div>`);
      txt.appendChild(sub);
      const subSplit = new SplitText(q('.s2-sub-t', sub), { type: 'chars', charsClass: 's2-sch' });
      S(subSplit.chars, { yPercent: 120 });
      tl.to(subSplit.chars, { yPercent: 0, duration: 0.34, ease: 'fekk.snap', stagger: 0.01 }, T_SUB);
      const live = q('.s2-live', sub), liveRing = q('.s2-live-ring', sub);
      S([live, liveRing], { scale: 0 });
      tl.to(live, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, T_SUB - 0.04);
      tl.fromTo(liveRing, { scale: 0.6, opacity: 1 }, { scale: 2.4, opacity: 0, duration: 0.5, ease: 'power2.out', repeat: 2, immediateRender: false }, T_SUB + 0.06);
      tl.fromTo(sub, { y: 0 }, { y: -14, duration: 1.4, ease: 'none', immediateRender: false }, T_SUB);

      // Question
      const qEl = FEKK.el(`<div class="s2-q">
          <span class="s2-qline s2-ql1"><span class="s2-qmask"><span class="s2-qw">Et</span></span> <span class="s2-qmask"><span class="s2-qw">si</span></span> <span class="s2-qmask"><span class="s2-qw">on</span></span> <span class="s2-qmask"><span class="s2-qw">pouvait</span></span></span>
          <span class="s2-qline s2-ql2"><span class="s2-hl-wrap"><svg class="s2-mark"><path/></svg><span class="s2-qmask"><span class="s2-qw s2-hl">les retrouver</span></span></span><span class="s2-qmask"><span class="s2-qw s2-qm"> ?</span></span></span>
        </div>`);
      txt.appendChild(qEl);
      // Taille : les deux lignes tiennent dans 860px
      const qMeasure = (fs) => {
        qEl.style.fontSize = fs + 'px';
        return Math.max(...qa('.s2-qline', qEl).map((l) => { const rg = document.createRange(); rg.selectNodeContents(l); return rg.getBoundingClientRect().width; }));
      };
      let qfs = 128;
      while (qfs > 70 && qMeasure(qfs) > 860) qfs -= 2;
      qEl.style.fontSize = qfs + 'px';
      const hlWrap = q('.s2-hl-wrap', qEl);
      const hlRect = hlWrap.getBoundingClientRect();
      const mark = q('.s2-mark', qEl), markPath = q('.s2-mark path', qEl);
      const mw = hlRect.width + 40, mh = qfs * 1.2;
      mark.setAttribute('width', mw); mark.setAttribute('height', mh);
      mark.setAttribute('viewBox', `0 0 ${mw} ${mh}`);
      Object.assign(mark.style, { left: '-20px', top: `${hlRect.height * 0.5 - mh * 0.5 - qfs * 0.02}px` });
      const sw = qfs * 0.9;
      markPath.setAttribute('d', `M${sw * 0.5} ${mh * 0.53} C${mw * 0.3} ${mh * 0.47} ${mw * 0.62} ${mh * 0.55} ${mw - sw * 0.5} ${mh * 0.47}`);
      markPath.setAttribute('fill', 'none'); markPath.setAttribute('stroke', C.yellow);
      markPath.setAttribute('stroke-width', sw.toFixed(1)); markPath.setAttribute('stroke-linecap', 'round');
      S(mark, { zIndex: 0 });
      S(q('.s2-hl-wrap .s2-qmask', qEl), { position: 'relative', zIndex: 1 });

      const qWords = qa('.s2-qw', qEl);
      S(qWords, { yPercent: 115, rotation: 6, transformOrigin: '0% 100%' });
      tl.to(qWords.slice(0, 4), { yPercent: 0, rotation: 0, duration: 0.32, ease: 'fekk.snap', stagger: 0.03 }, T_Q);
      tl.to(qWords.slice(4), { yPercent: 0, rotation: 0, duration: 0.32, ease: 'fekk.snap', stagger: 0.04 }, T_Q + 0.08);
      // Marqueur jaune tracé + lettres qui passent en ink au passage du feutre
      S(markPath, { drawSVG: '0% 0%' });
      const MARK_D = 0.22;
      tl.to(markPath, { drawSVG: '0% 100%', duration: MARK_D, ease: 'none' }, T_MARK);
      const hlSplit = new SplitText(q('.s2-hl', qEl), { type: 'chars', charsClass: 's2-hch' });
      const hlLeft = hlRect.left;
      hlSplit.chars.forEach((ch) => {
        const b = ch.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (b.left + b.width * 0.5 - hlLeft + 20) / mw));
        tl.to(ch, { color: C.ink, duration: 0.04, ease: 'none' }, T_MARK + f * MARK_D - 0.02);
      });
      // Le « ? » pivote une fois la question posée
      const qm = q('.s2-qm', qEl);
      S(qm, { transformOrigin: '60% 90%' });
      tl.to(qm, { rotation: 14, duration: 0.12, ease: 'power2.out' }, T_MARK + MARK_D);
      tl.to(qm, { rotation: 0, duration: 0.4, ease: 'elastic.out(1,0.35)' }, T_MARK + MARK_D + 0.12);
      tl.fromTo(qEl, { y: 0 }, { y: -8, duration: T_FLOOD - T_Q, ease: 'none', immediateRender: false }, T_Q);

      // ================================================================ ÉPINGLE FEKK + CERCLE VERT
      const LW = 150, LH = LW * (160 / 120);
      const logo = FEKK.el(`<div class="s2-logo" style="left:${TIP[0] - LW * 0.5}px;top:${TIP[1] - LH * (154 / 160)}px;width:${LW}px;height:${LH}px">${FEKK.ASSETS.logoMark}</div>`);
      const logoShadow = FEKK.el(`<div style="position:absolute;left:${TIP[0] - 50}px;top:${TIP[1] - 12}px;width:100px;height:24px;border-radius:50%;background:#000"></div>`);
      pinLayer.appendChild(logoShadow);
      pinLayer.appendChild(logo);
      S(logo, { transformOrigin: `50% ${(154 / 160) * 100}%`, y: -1100, opacity: 0 });
      S(logoShadow, { scale: 0.2, opacity: 0 });
      tl.set(logo, { opacity: 1 }, T_PIN);
      tl.fromTo(logo, { y: -1100, scaleY: 1.25, scaleX: 0.85 }, { y: 0, scaleY: 1.1, scaleX: 0.92, duration: T_LAND - T_PIN, ease: 'power3.in', immediateRender: false }, T_PIN);
      tl.to(logoShadow, { scale: 1, opacity: 0.5, duration: T_LAND - T_PIN, ease: 'power3.in' }, T_PIN);
      tl.to(logo, { scaleY: 0.62, scaleX: 1.32, duration: 0.05, ease: 'power2.out' }, T_LAND);
      tl.to(logo, { scaleY: 1, scaleX: 1, duration: 0.3, ease: 'fekk.land' }, T_LAND + 0.05);
      const ring = q('.s2-logo .logo-ring', root), dot = q('.s2-logo .logo-dot', root);
      S(dot, { svgOrigin: '56 52' });
      tl.fromTo(dot, { scale: 0.3 }, { scale: 1.6, duration: 0.12, ease: 'power2.out', immediateRender: false }, T_LAND + 0.04);
      tl.to(dot, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, T_LAND + 0.16);
      // Onde radar mint : les épingles grises passent au vert au passage
      const radar = q('.s2-radar circle', mapSvg);
      S(radar, { attr: { r: 10 }, opacity: 0 });
      const RR = 760, RD = 0.5;
      tl.fromTo(radar, { attr: { r: 10 }, opacity: 1 }, { attr: { r: RR }, opacity: 0, duration: RD, ease: 'power2.out', immediateRender: false }, T_LAND);
      allPins.forEach((pn) => {
        const d = Math.hypot(pn.x - TIP[0], pn.y - TIP[1]);
        if (d > RR * 0.95) return;
        const p = 1 - Math.sqrt(1 - d / RR);
        const t = T_LAND + p * RD;
        tl.to(q('.s2-pinb', pn.el), { fill: C.mint, duration: 0.06, ease: 'none' }, t);
        tl.to(q('.s2-pins', pn.el), { fill: C.green, duration: 0.06, ease: 'none' }, t);
        tl.to(pn.el, { y: pn.y - 16, duration: 0.08, ease: 'power2.out' }, t);
        tl.to(pn.el, { y: pn.y, duration: 0.2, ease: 'bounce.out' }, t + 0.08);
      });

      // Cercle vert depuis la pointe de l'épingle
      const FD = 2900;
      const flood = FEKK.el(`<div class="s2-flood" style="left:${TIP[0] - FD / 2}px;top:${TIP[1] - FD / 2}px;width:${FD}px;height:${FD}px"></div>`);
      // liseré mint qui précède la vague verte
      const edge = FEKK.el(`<div class="s2-flood" style="left:${TIP[0] - FD / 2}px;top:${TIP[1] - FD / 2}px;width:${FD}px;height:${FD}px;background:none;border:22px solid ${C.mint}"></div>`);
      root.appendChild(edge);
      root.appendChild(flood);
      S([flood, edge], { scale: 0, transformOrigin: '50% 50%' });
      tl.to(edge, { scale: 1.04, duration: T_FULL - T_FLOOD, ease: 'power2.in' }, T_FLOOD);
      tl.to(flood, { scale: 1, duration: T_FULL - T_FLOOD, ease: 'power2.in' }, T_FLOOD);
      // impact de l'épingle : traits radiaux
      {
        let ls = '';
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 + 0.3, r0 = 70, r1 = 120;
          ls += `<line x1="${(TIP[0] + Math.cos(a) * r0).toFixed(1)}" y1="${(TIP[1] + Math.sin(a) * r0 * 0.6).toFixed(1)}" x2="${(TIP[0] + Math.cos(a) * r1).toFixed(1)}" y2="${(TIP[1] + Math.sin(a) * r1 * 0.6).toFixed(1)}"/>`;
        }
        const imp = FEKK.el(`<svg class="s2-full" viewBox="0 0 1080 1920" style="overflow:visible"><g stroke="${C.yellow}" stroke-width="7" stroke-linecap="round">${ls}</g></svg>`);
        pinLayer.insertBefore(imp, logoShadow);
        const lines = qa('line', imp);
        S(lines, { drawSVG: '0% 0%', opacity: 0 });
        tl.set(lines, { opacity: 1 }, T_LAND);
        tl.to(lines, { drawSVG: '0% 100%', duration: 0.07, ease: 'power2.out' }, T_LAND);
        tl.to(lines, { drawSVG: '100% 100%', duration: 0.13, ease: 'power2.in' }, T_LAND + 0.07);
        tl.set(lines, { opacity: 0 }, T_LAND + 0.2);
      }
      // Les textes restent au-dessus de la vague verte (lisibles jusqu'à ~6.90), puis rentrent dans leurs masques.
      root.appendChild(txt);
      const full = FEKK.el(`<div class="s2-full" style="background:${C.green};opacity:0"></div>`);
      root.appendChild(full);
      tl.set(full, { opacity: 1 }, T_FULL);
      // Pendant l'invasion, la question est légèrement poussée par la vague
      S(qEl, { transformOrigin: '50% 0%' });
      tl.to(qEl, { y: '+=18', scale: 1.025, duration: T_FULL - T_FLOOD, ease: 'power2.in' }, T_FLOOD);
      tl.to(sub, { scale: 1.04, duration: T_FULL - T_FLOOD, ease: 'power2.in' }, T_FLOOD);
      tl.to(qWords, { yPercent: 115, duration: T_FULL - T_TXT_OUT, ease: 'power2.in', stagger: 0.004 }, T_TXT_OUT);
      tl.to(subSplit.chars, { yPercent: 120, duration: T_FULL - T_TXT_OUT, ease: 'power2.in' }, T_TXT_OUT);
      tl.to([live, liveRing], { scale: 0, duration: T_FULL - T_TXT_OUT, ease: 'power2.in' }, T_TXT_OUT);
      tl.to(mark, { opacity: 0, duration: T_FULL - T_TXT_OUT, ease: 'power2.in' }, T_TXT_OUT);

      // garde la timeline exactement sur la durée de la scène
      tl.set({}, {}, END - START);
    },
  });
})();
