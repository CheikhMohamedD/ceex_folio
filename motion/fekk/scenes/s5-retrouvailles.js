/* S5 — « Retrouvailles » + carton final · 15.50 → 20.00 (4,5 s)
 * 0.00–1.60  Sur plein cadre sand : deux mains (manches wax) se rejoignent autour du téléphone bleu,
 *            l'écran s'allume, les pouces se touchent, un cœur, puis « Jërëjëf ! » explose
 *            (bulle + confettis aux couleurs du drapeau, particules seedées en onFrame pur).
 * 1.58–2.02  Wipe : cercles rouge, jaune puis vert depuis le point de contact des mains.
 * 1.90–4.50  Carton final sur green : icône d'app + logoMark qui se dessine, wordmark « fekk »,
 *            définition, tagline, CTA pilule. Respiration douce jusqu'à la dernière image.
 * Commence sur plein cadre sand #F3E6CF ; finit sur le carton final propre (pas de fondu). */
(function () {
  const C = FEKK.C;
  let frame = null;

  /* ---------- Géométrie de la scène des mains ---------- */
  const PW = 240, PH = 480;                // téléphone (asset 200×400 × 1.2)
  const PL = 540 - PW / 2, PT = 690;       // bord gauche / haut du téléphone
  const GY = 1052;                         // hauteur de la prise (centre des doigts)
  const WRIST = [PL - 190, GY + 20];       // poignet (pivot des mouvements de bras)
  const TB = [PL - 92, GY - 62];           // base du pouce (pivot)
  const TOUCH = [540, GY - 98];            // point de contact des pouces (repère du rig)
  const RIG_DY = 100, RIG_S = 1.15;          // le rig des mains est agrandi et descendu
  const T2 = [TOUCH[0], TOUCH[1] + RIG_DY];  // point de contact à l'écran

  /* Main droite tenant le bord gauche du téléphone, repère local : bord du téléphone x=0, prise y=0.
   * Retourne { back, thumb } : le dos de la main + doigts (sous le téléphone) et le pouce (au-dessus). */
  function hand(k) {
    const fingers = [
      // [x, y, w, h] — de l'auriculaire (dessous) vers l'index (dessus)
      [-50, 44, 96, 36],
      [-58, 4, 104, 42],
      [-64, -38, 112, 44],
      [-70, -82, 122, 46],
    ];
    const fing = fingers.map(([x, y, w, h], i) => `
      <rect x="${x}" y="${y + 7}" width="${w}" height="${h}" rx="${h / 2}" fill="${k.sd}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${k.sk}"/>
      <path d="M${x + 12} ${y + h * 0.36} q${h * 0.22} ${-h * 0.22} ${h * 0.5} ${-h * 0.2}" stroke="${k.sl}" stroke-width="${i === 3 ? 6 : 5}" stroke-linecap="round" fill="none"/>
      <path d="M${x + w * 0.42} ${y + 9} v${h - 18}" stroke="${k.sd}" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>`).join('');
    const back = `
      <path d="M-188 -40 C-150 -74 -100 -92 -46 -90 L40 -86 L40 92 C-8 112 -76 130 -136 130 C-166 130 -186 120 -192 104 Z" fill="${k.sk}"/>
      <path d="M-190 66 C-136 88 -56 92 40 70 L40 92 C-8 112 -76 130 -136 130 C-166 130 -186 120 -192 104 Z" fill="${k.sd}"/>
      <path d="M-170 -28 C-140 -52 -104 -64 -70 -66" stroke="${k.sl}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".8"/>
      ${fing}
      <!-- manche wax -->
      <path d="M-166 -104 C-158 -20 -150 80 -132 178 L-620 700 L-640 -40 C-480 -60 -300 -96 -166 -104 Z" fill="url(#${k.pat})"/>
      <path d="M-160 40 C-150 110 -142 150 -132 178 L-620 700 L-640 300 C-480 220 -300 120 -160 40 Z" fill="#0B1210" opacity=".2"/>
      <path d="M-300 -70 C-330 40 -360 180 -420 340" stroke="#0B1210" stroke-width="5" opacity=".18" fill="none" stroke-linecap="round"/>
      <path d="M-166 -104 C-158 -20 -150 80 -132 178" stroke="${k.cuff}" stroke-width="36" fill="none" stroke-linecap="round"/>
      <path d="M-188 -100 C-180 -18 -172 82 -154 182" stroke="${k.cuff2}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M-160 -98 C-152 -18 -144 80 -127 172" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".35"/>`;
    // Pouce : dessiné autour de sa base (0,0), pointe vers +x.
    const thumb = `
      <ellipse cx="-14" cy="12" rx="56" ry="40" fill="${k.sk}"/>
      <path d="M-50 34 C-30 50 6 50 30 34" stroke="${k.sd}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>
      <rect x="-24" y="-27" width="196" height="54" rx="27" fill="${k.sk}"/>
      <path d="M-10 18 H150 a20 20 0 0 1 -10 9 H-10 Z" fill="${k.sd}" opacity=".45"/>
      <rect x="-4" y="-18" width="120" height="9" rx="4.5" fill="${k.sl}" opacity=".9"/>
      <path d="M86 -14 q-7 14 0 28" stroke="${k.sd}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M96 -12 q-5 12 0 24" stroke="${k.sd}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>
      <rect x="126" y="-19" width="40" height="38" rx="15" fill="${k.nail}"/>
      <rect x="132" y="-13" width="18" height="10" rx="5" fill="#fff" opacity=".45"/>`;
    return { back, thumb };
  }

  const WAX = `
    <pattern id="s5-waxA" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="64" height="64" fill="${C.green}"/>
      <circle cx="32" cy="32" r="17" fill="none" stroke="${C.yellow}" stroke-width="7"/>
      <circle cx="32" cy="32" r="6" fill="${C.red}"/>
      <path d="M0 0H10L0 10Z M64 0H54L64 10Z M0 64H10L0 54Z M64 64H54L64 54Z" fill="${C.yellow}"/>
      <path d="M0 32h7 M57 32h7 M32 0v7 M32 57v7" stroke="#0B1210" stroke-width="4"/>
    </pattern>
    <pattern id="s5-waxB" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
      <rect width="56" height="56" fill="${C.dusk}"/>
      <path d="M-2 16 L12 4 L26 16 L40 4 L54 16 L68 4" fill="none" stroke="${C.sunset}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M-2 44 L12 32 L26 44 L40 32 L54 44 L68 32" fill="none" stroke="${C.yellow}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="12" cy="24" r="3.5" fill="${C.sand}"/><circle cx="40" cy="24" r="3.5" fill="${C.sand}"/>
    </pattern>`;

  const GIVER = { sk: '#5E3722', sd: '#432616', sl: '#80503A', nail: '#C9947A', cuff: C.yellow, cuff2: C.red, pat: 's5-waxA' };
  const RECV = { sk: '#C98D60', sd: '#A56C43', sl: '#E3AE83', nail: '#F2D2BC', cuff: C.sunset, cuff2: C.yellow, pat: 's5-waxB' };

  const HEART = 'M0 24C-30 4 -42 -10 -42 -24C-42 -38 -30 -46 -19 -46C-9 -46 -3 -40 0 -33C3 -40 9 -46 19 -46C30 -46 42 -38 42 -24C42 -10 30 4 0 24Z';
  const STAR4 = 'M0 -34C3 -8 8 -3 34 0C8 3 3 8 0 34C-3 8 -8 3 -34 0C-8 -3 -3 -8 0 -34Z';

  FEKK.scene({
    id: 's5',
    start: 15.5,
    end: 20.0,
    onFrame(t) { if (frame) frame(t); },
    build(root, tl) {
      const q = (s) => root.querySelector(s);
      const qa = (s) => Array.from(root.querySelectorAll(s));
      const rng = FEKK.rng(5505);

      /* ================= STYLES ================= */
      const css = `
.s5-full{position:absolute;left:0;top:0;width:1080px;height:1920px}
.s5-svg{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible}
.s5-sand{background:${C.sand}}
.s5-sc1{transform-origin:${T2[0]}px ${T2[1]}px}
.s5-rig{transform-origin:${TOUCH[0]}px ${TOUCH[1]}px;transform:translateY(${RIG_DY}px) scale(${RIG_S})}
.s5-shL,.s5-shR,.s5-shP{filter:drop-shadow(14px 18px 0 rgba(11,18,16,.24))}
.s5-mirror{transform:scaleX(-1);transform-origin:540px 0}
.s5-phone{position:absolute;left:${PL}px;top:${PT}px;width:${PW}px;height:${PH}px}
.s5-phone svg{position:absolute;left:0;top:0;width:100%;height:100%}
.s5-thumb{position:absolute;left:${TB[0] - 80}px;top:${TB[1] - 80}px;width:360px;height:160px;transform-origin:80px 80px}
.s5-thumb svg{position:absolute;left:0;top:0;width:360px;height:160px;overflow:visible}
.s5-bub{position:absolute;left:86px;top:292px;width:908px;height:392px;transform-origin:704px 380px}
.s5-bub svg{position:absolute;left:0;top:0;width:908px;height:392px;overflow:visible}
.s5-jj{position:absolute;left:24px;right:24px;top:58px;height:220px;display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-weight:800;font-size:200px;line-height:1;letter-spacing:-.012em;color:${C.green};
  text-shadow:5px 7px 0 ${C.ink};white-space:nowrap}
.s5-jj .s5-ch{display:inline-block}
.s5-conf{position:absolute;left:0;top:0;width:1080px;height:1920px}
/* --- Carton final --- */
.s5-card{visibility:hidden}
.s5-cardbg{background:${C.green}}
.s5-cardin{position:absolute;inset:0;transform-origin:540px 900px}
.s5-ping{position:absolute;left:${540 - 160}px;top:${560 - 160}px;width:320px;height:320px;border-radius:50%;border:3px solid rgba(255,255,255,.55);opacity:0}
.s5-tile{position:absolute;left:${540 - 150}px;top:${560 - 150}px;width:300px;height:300px;border-radius:78px;background:${C.sand};
  box-shadow:12px 16px 0 rgba(11,18,16,.32), inset 0 -10px 0 rgba(200,100,59,.12)}
.s5-tile .asset-logo{position:absolute;left:${150 - 78}px;top:${150 - 108}px;width:156px;height:208px;overflow:visible}
.s5-word{position:absolute;left:0;right:0;top:732px;text-align:center;font-family:var(--display);font-weight:800;font-size:250px;line-height:.92;
  letter-spacing:-.045em;color:#fff;text-shadow:9px 11px 0 rgba(11,18,16,.32);white-space:nowrap}
.s5-word .s5-ch{display:inline-block}
.s5-rule{position:absolute;left:${540 - 36}px;top:1004px;width:72px;height:7px;border-radius:4px;background:${C.yellow};transform-origin:50% 50%}
.s5-def{position:absolute;left:0;right:0;top:1034px;text-align:center;font-family:var(--ui);font-size:40px;line-height:1.2;color:rgba(255,255,255,.88);
  letter-spacing:.005em;white-space:nowrap}
.s5-def .s5-w{display:inline-block}
.s5-def b{font-weight:800;font-style:normal;color:#fff;letter-spacing:-.01em}
.s5-def i{font-style:italic;font-weight:400;color:rgba(255,255,255,.72)}
.s5-def .s5-dot{color:${C.yellow};font-weight:800;padding:0 .14em}
.s5-def .s5-tr{font-style:italic;font-weight:600}
.s5-tag{position:absolute;left:0;right:0;top:1128px;text-align:center;font-family:var(--display);font-weight:800;font-size:84px;line-height:.98;
  letter-spacing:-.035em;color:#fff;text-shadow:5px 7px 0 rgba(11,18,16,.28)}
.s5-tag .s5-line{display:block;white-space:nowrap}
.s5-tag .s5-l2{color:${C.yellow}}
.s5-tag .s5-w{display:inline-block}
.s5-cta{position:absolute;left:${540 - 290}px;top:1356px;width:580px;height:100px;border-radius:50px;background:${C.ink};
  box-shadow:8px 10px 0 rgba(11,18,16,.28);display:flex;align-items:center;justify-content:center;gap:18px;
  font-family:var(--ui);font-weight:650;font-size:35px;letter-spacing:-.005em;color:#fff;white-space:nowrap;transform-origin:50% 50%}
.s5-cta-dot{position:relative;width:16px;height:16px;border-radius:8px;background:${C.mint};flex:none}
.s5-cta-dot i{position:absolute;inset:0;border-radius:8px;border:3px solid ${C.mint}}
.s5-cta-txt .s5-ch{display:inline-block}
.s5-cta-ring{position:absolute;left:${540 - 290}px;top:1356px;width:580px;height:100px;border-radius:50px;border:4px solid ${C.yellow};opacity:0}
`;
      root.appendChild(FEKK.el(`<style>${css}</style>`));

      /* ================= SCÈNE 1 : LES MAINS ================= */
      const sc1 = FEKK.el('<div class="s5-full s5-sc1"></div>');
      root.appendChild(FEKK.el('<div class="s5-full s5-sand"></div>'));
      root.appendChild(sc1);

      // --- Fond : soleil, rayons, anneaux, formes wax (parallaxe) ---
      let rays = '';
      for (let i = 0; i < 20; i++) {
        const a0 = (i / 20) * Math.PI * 2, a1 = a0 + Math.PI / 20;
        const R = 1500;
        rays += `<path d="M0 0L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)}L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)}Z"/>`;
      }
      const bg = FEKK.el(`<svg class="s5-svg" viewBox="0 0 1080 1920">
        <g transform="translate(${T2[0]} ${T2[1]})">
          <g class="s5-rays" fill="${C.sand2}" opacity=".42">${rays}</g>
          <circle class="s5-disc" r="410" fill="${C.sand2}"/>
          <circle class="s5-disc2" r="300" fill="#EBD6B0"/>
          <circle class="s5-ring1" r="470" fill="none" stroke="${C.clay}" stroke-width="5" stroke-dasharray="1 22" stroke-linecap="round" opacity=".55"/>
          <circle class="s5-ring2" r="505" fill="none" stroke="${C.clay}" stroke-width="2.5" opacity=".28"/>
        </g>
        <g class="s5-deco">
          <g class="s5-d" transform="translate(150 1460)"><g class="s5-di"><path d="M-70 0A70 70 0 0 1 70 0Z" fill="#0B1210" opacity=".18" transform="translate(9 11)"/><path d="M-70 0A70 70 0 0 1 70 0Z" fill="${C.yellow}"/><path d="M-44 0A44 44 0 0 1 44 0" fill="none" stroke="${C.clay}" stroke-width="6"/></g></g>
          <g class="s5-d" transform="translate(930 1430)"><g class="s5-di"><path d="M-80 0 L-56 -24 L-32 0 L-8 -24 L16 0 L40 -24 L64 0" fill="none" stroke="${C.green}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/></g></g>
          <g class="s5-d" transform="translate(110 760)"><g class="s5-di"><circle r="46" fill="none" stroke="${C.red}" stroke-width="9"/><circle r="18" fill="${C.red}"/></g></g>
          <g class="s5-d" transform="translate(980 790)"><g class="s5-di">${[0, 1, 2].map((i) => `<path d="M${i * 26 - 26} 18 L${i * 26 - 13} -8 L${i * 26} 18Z" fill="${C.clay}"/>`).join('')}</g></g>
          <g class="s5-d" transform="translate(84 1100)"><g class="s5-di">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<circle cx="${c * 22 - 22}" cy="${r * 22 - 22}" r="5.5" fill="${C.green}"/>`).join('')).join('')}</g></g>
          <g class="s5-d" transform="translate(1000 1120)"><g class="s5-di"><circle r="34" fill="${C.mint}"/><circle r="34" fill="none" stroke="#0B1210" stroke-width="5" stroke-dasharray="4 9" transform="scale(1.4)"/></g></g>
        </g>
      </svg>`);
      sc1.appendChild(bg);

      // --- Lueur derrière le téléphone (allumage) ---
      const glow = FEKK.el(`<svg class="s5-svg" viewBox="0 0 1080 1920">
        <g transform="translate(540 ${PT + PH / 2})">
          <circle class="s5-glow" opacity="0" r="300" fill="none" stroke="${C.yellow}" stroke-width="22"/>
          <g class="s5-zing" stroke="${C.ink}" stroke-width="9" stroke-linecap="round" fill="none">
            <path d="M-170 -200 L-210 -250"/><path d="M-190 -120 L-250 -138"/><path d="M-120 -265 L-130 -320"/>
            <path d="M170 -200 L210 -250"/><path d="M190 -120 L250 -138"/><path d="M120 -265 L130 -320"/>
          </g>
        </g>
      </svg>`);
      const rig = FEKK.el('<div class="s5-full s5-rig"></div>');
      sc1.appendChild(rig);
      rig.appendChild(glow);

      const G = hand(GIVER), R = hand(RECV);
      const tr = `translate(${PL} ${GY})`;
      // Couches : dos des mains → téléphone → pouces
      const shL = FEKK.el(`<div class="s5-full s5-shL"><div class="s5-full s5-gv"><svg class="s5-svg" viewBox="0 0 1080 1920"><defs>${WAX}</defs><g transform="${tr}">${G.back}</g></svg></div></div>`);
      const shR = FEKK.el(`<div class="s5-full s5-shR"><div class="s5-full s5-mirror"><div class="s5-full s5-rv"><svg class="s5-svg" viewBox="0 0 1080 1920"><g transform="${tr}">${R.back}</g></svg></div></div></div>`);
      const phoneSvg = FEKK.ASSETS.phoneFront.replace(/asset-pfScreen/g, 's5-pfScreen');
      const shP = FEKK.el(`<div class="s5-full s5-shP"><div class="s5-full s5-ph"><div class="s5-phone">${phoneSvg}
        <svg viewBox="0 0 200 400" class="s5-scrfx">
          <defs><clipPath id="s5-scrclip"><rect x="16" y="16" width="168" height="368" rx="22"/></clipPath></defs>
          <g clip-path="url(#s5-scrclip)">
            <g class="s5-notif">
              <rect x="24" y="160" width="152" height="44" rx="13" fill="#fff" opacity=".94"/>
              <rect x="31" y="167" width="30" height="30" rx="9" fill="${C.green}"/>
              <path d="M46 172c-5 0-8.5 3.6-8.5 8.4 0 6.2 8.5 13.6 8.5 13.6s8.5-7.4 8.5-13.6c0-4.8-3.5-8.4-8.5-8.4z" fill="#fff"/>
              <circle cx="46" cy="180" r="3.4" fill="${C.green}"/>
              <text x="68" y="179" font-family="Inter Variable, sans-serif" font-weight="800" font-size="10" fill="${C.ink}">Fekk</text>
              <text x="68" y="192" font-family="Inter Variable, sans-serif" font-weight="600" font-size="9" fill="#3A433E">Objet récupéré ✓</text>
            </g>
            <rect class="s5-off" x="0" y="0" width="200" height="400" fill="#07090D"/>
            <rect class="s5-flash" x="0" y="0" width="200" height="400" fill="#fff" opacity="0"/>
            <path class="s5-glare" d="M-40 0 L40 0 L-60 400 L-140 400Z" fill="#fff" opacity=".14"/>
          </g>
        </svg></div></div></div>`);
      const thumbSvg = (k) => `<svg viewBox="-80 -80 360 160">${k.thumb}</svg>`;
      const shLT = FEKK.el(`<div class="s5-full s5-shL"><div class="s5-full s5-gvT"><div class="s5-thumb s5-gthumb">${thumbSvg(G)}</div></div></div>`);
      const shRT = FEKK.el(`<div class="s5-full s5-shR"><div class="s5-full s5-mirror"><div class="s5-full s5-rvT"><div class="s5-thumb s5-rthumb">${thumbSvg(R)}</div></div></div></div>`);
      [shL, shR, shP, shLT, shRT].forEach((e) => rig.appendChild(e));

      // --- Étincelle au contact + cœur ---
      const fx = FEKK.el(`<svg class="s5-svg" viewBox="0 0 1080 1920">
        <g transform="translate(${TOUCH[0]} ${TOUCH[1]})">
          <g class="s5-spark"><path d="${STAR4}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/></g>
          <g class="s5-sparkring" opacity="0"><circle r="40" fill="none" stroke="#fff" stroke-width="6"/></g>
        </g>
        <g transform="translate(${TOUCH[0]} ${TOUCH[1]})"><g class="s5-heartpos">
          <g class="s5-heart">
            <path d="${HEART}" fill="${C.ink}" opacity=".9" transform="translate(7 9)"/>
            <path d="${HEART}" fill="${C.red}"/>
            <path d="M-30 -26 C-30 -34 -24 -38 -18 -38" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/>
          </g>
        </g></g>
        <g transform="translate(${TOUCH[0]} ${TOUCH[1]})"><g class="s5-hpos2"><g class="s5-h2"><path d="${HEART}" fill="${C.sunset}" transform="scale(.42)"/></g></g></g>
        <g transform="translate(${TOUCH[0]} ${TOUCH[1]})"><g class="s5-hpos3"><g class="s5-h3"><path d="${HEART}" fill="${C.red}" transform="scale(.3)"/></g></g></g>
      </svg>`);
      rig.appendChild(fx);

      // --- Bulle « Jërëjëf ! » ---
      // Rayons d'explosion autour de la bulle (DrawSVG)
      let burst = '';
      const BC = [540, 462];
      const bcols = [C.green, C.red, C.ink, C.yellow, C.clay];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + 0.12;
        const rx = 470, ry = 215;
        const x0 = BC[0] + Math.cos(a) * rx, y0 = BC[1] + Math.sin(a) * ry;
        const len = 46 + (i % 3) * 22;
        const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len * 0.8;
        burst += `<path class="s5-ray" d="M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${bcols[i % bcols.length]}" stroke-width="${i % 2 ? 10 : 14}" stroke-linecap="round"/>`;
      }
      sc1.appendChild(FEKK.el(`<svg class="s5-svg s5-burst" viewBox="0 0 1080 1920">${burst}</svg>`));

      const BUB = 'M168 28 H740 A140 140 0 0 1 740 308 H712 L742 382 L622 308 H168 A140 140 0 0 1 168 28 Z';
      const bub = FEKK.el(`<div class="s5-bub">
        <svg viewBox="0 0 908 392">
          <path d="${BUB}" fill="${C.ink}" transform="translate(14 16)"/>
          <path d="${BUB}" fill="#fff" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>
          <path d="M120 70 A112 112 0 0 0 62 150" stroke="${C.sand2}" stroke-width="12" stroke-linecap="round" fill="none"/>
          <circle cx="86" cy="206" r="7" fill="${C.sand2}"/>
        </svg>
        <div class="s5-jj">Jërëjëf !</div>
      </div>`);
      sc1.appendChild(bub);

      // --- Confettis (canvas, onFrame pur) ---
      const canvas = FEKK.el('<canvas class="s5-conf" width="1080" height="1920"></canvas>');
      sc1.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      /* ================= WIPE ================= */
      const wipe = FEKK.el(`<svg class="s5-svg s5-wipe" viewBox="0 0 1080 1920">
        <circle class="s5-w1" cx="${T2[0]}" cy="${T2[1]}" r="0" fill="${C.red}"/>
        <circle class="s5-w2" cx="${T2[0]}" cy="${T2[1]}" r="0" fill="${C.yellow}"/>
        <circle class="s5-w3" cx="${T2[0]}" cy="${T2[1]}" r="0" fill="${C.green}"/>
      </svg>`);
      root.appendChild(wipe);

      /* ================= CARTON FINAL ================= */
      const card = FEKK.el(`<div class="s5-full s5-card">
        <div class="s5-full s5-cardbg"></div>
        <svg class="s5-svg" viewBox="0 0 1080 1920">
          <g transform="translate(540 560)"><g class="s5-crings">
            ${[250, 380, 520, 680, 860].map((r, i) => `<circle class="s5-cr" r="${r}" fill="none" stroke="#fff" stroke-width="${i === 1 ? 3 : 2}" ${i === 2 ? 'stroke-dasharray="2 18" stroke-linecap="round" stroke-width="5"' : ''} opacity="${i === 2 ? 0.16 : 0.08}"/>`).join('')}
          </g></g>
          <g class="s5-cdeco">
            <g class="s5-cd" transform="translate(130 300)"><g class="s5-cdi"><path d="M-60 0A60 60 0 0 1 60 0Z" fill="#006E34"/></g></g>
            <g class="s5-cd" transform="translate(950 1650)"><g class="s5-cdi"><path d="M-70 0 L-48 -22 L-26 0 L-4 -22 L18 0 L40 -22 L62 0" fill="none" stroke="#006E34" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/></g></g>
            <g class="s5-cd" transform="translate(960 330)"><g class="s5-cdi">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<circle cx="${c * 22 - 22}" cy="${r * 22 - 22}" r="5.5" fill="${C.yellow}" opacity=".85"/>`).join('')).join('')}</g></g>
            <g class="s5-cd" transform="translate(120 1640)"><g class="s5-cdi"><circle r="44" fill="none" stroke="#006E34" stroke-width="10"/><circle r="16" fill="${C.mint}" opacity=".9"/></g></g>
          </g>
        </svg>
        <div class="s5-cardin">
          <div class="s5-ping"></div><div class="s5-ping"></div><div class="s5-ping"></div>
          <div class="s5-tile">${FEKK.ASSETS.logoMark}</div>
          <div class="s5-word">fekk</div>
          <div class="s5-rule"></div>
          <div class="s5-def"><span class="s5-w"><b>fekk</b></span> <span class="s5-w"><i>(wolof)</i></span> <span class="s5-w s5-dot">·</span> <span class="s5-w s5-tr">trouver</span></div>
          <div class="s5-tag"><span class="s5-line s5-l1">Ce qui se perd,</span><span class="s5-line s5-l2">se retrouve.</span></div>
          <div class="s5-cta-ring"></div>
          <div class="s5-cta"><span class="s5-cta-dot"><i></i></span><span class="s5-cta-txt">Bientôt sur Android &amp; iOS</span></div>
        </div>
      </div>`);
      root.appendChild(card);

      /* ================= SPLITS ================= */
      const jjChars = new SplitText(q('.s5-jj'), { type: 'chars', charsClass: 's5-ch' }).chars;
      const wordChars = new SplitText(q('.s5-word'), { type: 'chars', charsClass: 's5-ch' }).chars;
      const tagWords = new SplitText(qa('.s5-tag .s5-line'), { type: 'words', wordsClass: 's5-w' }).words;
      const ctaChars = new SplitText(q('.s5-cta-txt'), { type: 'chars', charsClass: 's5-ch' }).chars;

      /* ================= TIMELINE ================= */
      const gv = q('.s5-gv'), rv = q('.s5-rv'), ph = q('.s5-ph'), gvT = q('.s5-gvT'), rvT = q('.s5-rvT');
      const gth = q('.s5-gthumb'), rth = q('.s5-rthumb');
      const WO = `${WRIST[0]}px ${WRIST[1]}px`;
      // Le bras du receveur est dans un repère miroir : même origine locale.
      gsap.set([gv, gvT, ph, rv, rvT], { transformOrigin: WO });

      // Origines fixées une fois pour toutes (évite la compensation smoothOrigin de GSAP sur SVG).
      gsap.set(['.s5-rays', '.s5-disc', '.s5-disc2', '.s5-ring1', '.s5-ring2', '.s5-glow', '.s5-spark', '.s5-sparkring',
        '.s5-heart', '.s5-h2', '.s5-h3', '.s5-crings'].map((s) => q(s)), { transformOrigin: '50% 50%' });
      gsap.set([q('.s5-tile .logo-dot'), q('.s5-tile .logo-ring')], { transformOrigin: '50% 50%' });
      // -- Fond : apparition (cadre 0 = sand pur) + dérive lente --
      tl.fromTo('.s5-rays', { scale: 0, rotation: -20, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.8, ease: 'power3.out' }, 0.02);
      tl.to('.s5-rays', { rotation: 14, duration: 1.2, ease: 'none' }, 0.82);
      tl.fromTo('.s5-disc', { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(1.6)', transformOrigin: '50% 50%' }, 0.0);
      tl.fromTo('.s5-disc2', { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(1.8)', transformOrigin: '50% 50%' }, 0.08);
      tl.fromTo('.s5-ring1', { scale: 0.6, opacity: 0, rotation: 0 }, { scale: 1, opacity: 0.55, rotation: 50, duration: 2.0, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.1);
      tl.fromTo('.s5-ring2', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 0.28, duration: 0.7, ease: 'power3.out', transformOrigin: '50% 50%' }, 0.16);
      const decos = qa('.s5-d .s5-di');
      decos.forEach((d, i) => {
        const r = FEKK.rng(77 + i);
        tl.fromTo(d, { scale: 0, rotation: -60 + r() * 30, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.4)' }, 0.12 + i * 0.06);
        tl.to(d, { rotation: (r() - 0.5) * 30, y: (r() - 0.5) * 30, duration: 1.4, ease: 'sine.inOut' }, 0.62 + i * 0.06);
      });
      tl.fromTo('.s5-deco', { y: 30 }, { y: -40, duration: 2.0, ease: 'none' }, 0); // parallaxe arrière
      // Caméra : lente poussée vers le point de contact
      tl.fromTo(sc1, { scale: 1.0 }, { scale: 1.045, duration: 2.0, ease: 'power1.inOut' }, 0);

      // -- Entrées des mains (overlap : le receveur suit) --
      const gvAll = [gv, gvT, ph];
      tl.fromTo(gvAll, { x: -720, y: 470, rotation: -16 }, { x: 0, y: 0, rotation: 4, duration: 0.5, ease: 'power3.out' }, 0.04);
      tl.to(gvAll, { rotation: 0, duration: 0.35, ease: 'back.out(2.5)' }, 0.54);
      const rvAll = [rv, rvT];
      tl.fromTo(rvAll, { x: -720, y: 500, rotation: -16 }, { x: 0, y: 0, rotation: 4, duration: 0.5, ease: 'power3.out' }, 0.14);
      tl.to(rvAll, { rotation: 0, duration: 0.35, ease: 'back.out(2.5)' }, 0.64);
      // Pouces : le donneur appuie (traîne), le receveur arrive pouce levé
      tl.fromTo(gth, { rotation: -26 }, { rotation: -12, duration: 0.36, ease: 'back.out(3)' }, 0.3);
      tl.set(rth, { rotation: -52 }, 0);
      tl.to(rth, { rotation: -60, duration: 0.25, ease: 'power2.out' }, 0.42); // anticipation

      // -- L'écran s'allume --
      tl.to('.s5-off', { opacity: 0, duration: 0.08, ease: 'none' }, 0.5);
      tl.fromTo('.s5-flash', { opacity: 0.6 }, { opacity: 0, duration: 0.24, ease: 'power2.out', immediateRender: false }, 0.5);
      tl.fromTo('.s5-glare', { x: 0 }, { x: 260, duration: 0.5, ease: 'power2.inOut' }, 0.52);
      tl.set('.s5-glow', { opacity: 0 }, 0);
      tl.fromTo('.s5-glow', { scale: 0.7, opacity: 1, transformOrigin: '50% 50%' }, { scale: 1.25, opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, 0.5);
      tl.fromTo('.s5-zing path', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.14, ease: 'power2.out', stagger: 0.02 }, 0.5);
      tl.to('.s5-zing path', { drawSVG: '100% 100%', duration: 0.16, ease: 'power2.in', stagger: 0.02 }, 0.66);
      tl.fromTo('.s5-notif', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, 0.62);
      tl.fromTo(ph, { scale: 1 }, { scale: 1.035, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, 0.5);

      // -- Prise : le receveur referme le pouce, les deux mains se serrent --
      tl.to(rth, { rotation: -12, duration: 0.18, ease: 'back.out(2.2)' }, 0.66);
      tl.to(rvAll, { x: 10, duration: 0.08, ease: 'power2.out' }, 0.72);
      tl.to(rvAll, { x: 0, duration: 0.2, ease: 'power2.out' }, 0.8);
      tl.to([gv, gvT, ph], { x: 8, duration: 0.08, ease: 'power2.out' }, 0.74);
      tl.to([gv, gvT, ph], { x: 0, duration: 0.2, ease: 'power2.out' }, 0.82);
      // Les pouces glissent l'un vers l'autre et se touchent
      tl.to([gth, rth], { x: 26, duration: 0.16, ease: 'power3.inOut' }, 0.74);
      tl.fromTo('.s5-spark', { scale: 0, rotation: -45, transformOrigin: '50% 50%' }, { scale: 1.25, rotation: 0, duration: 0.16, ease: 'back.out(3)' }, 0.86);
      tl.to('.s5-spark', { scale: 0, rotation: 45, duration: 0.2, ease: 'power2.in' }, 1.02);
      tl.fromTo('.s5-sparkring', { scale: 0.3, opacity: 1, transformOrigin: '50% 50%' }, { scale: 2.6, opacity: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, 0.86);

      // -- Cœur --
      tl.fromTo('.s5-heart', { scale: 0, rotation: -20, transformOrigin: '50% 50%' }, { scale: 1.2, rotation: 8, duration: 0.24, ease: 'back.out(3)' }, 0.9);
      tl.to('.s5-heart', { scale: 1, rotation: -6, duration: 0.3, ease: 'sine.inOut' }, 1.14);
      tl.to('.s5-heart', { rotation: 6, duration: 0.3, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 1.44);
      tl.fromTo('.s5-heartpos', { x: 0, y: 0 }, { x: -265, y: -270, duration: 1.1, ease: 'power2.out' }, 0.9);
      tl.fromTo('.s5-h2', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 1.0);
      tl.fromTo('.s5-hpos2', { x: 0, y: 0 }, { x: 250, y: -230, duration: 1.0, ease: 'power2.out' }, 1.0);
      tl.fromTo('.s5-h3', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 1.06);
      tl.fromTo('.s5-hpos3', { x: 0, y: 0 }, { x: -150, y: -360, duration: 1.0, ease: 'power2.out' }, 1.06);

      // -- Passage de relais : le donneur relâche, le receveur garde le téléphone --
      tl.to(gth, { rotation: -46, x: 0, duration: 0.24, ease: 'back.out(1.8)' }, 1.0);
      tl.to([gv, gvT], { x: -70, y: 34, rotation: -5, duration: 0.5, ease: 'power2.inOut' }, 1.06);
      tl.to(ph, { x: 22, rotation: 3, duration: 0.5, ease: 'power2.inOut' }, 1.06);
      tl.to(rvAll, { x: -22, rotation: -3, duration: 0.5, ease: 'power2.inOut' }, 1.06);
      tl.to(rth, { x: 10, duration: 0.4, ease: 'power2.inOut' }, 1.06);
      // Respiration
      tl.to([gv, gvT], { y: 24, duration: 0.5, ease: 'sine.inOut' }, 1.56);
      tl.to([ph, rv, rvT], { y: -10, duration: 0.5, ease: 'sine.inOut' }, 1.56);

      // -- « Jërëjëf ! » explose (≈16.45) --
      const JT = 0.92;
      tl.fromTo(bub, { scale: 0.15, rotation: 10 }, { scale: 1, rotation: -3, duration: 0.42, ease: 'back.out(2.6)' }, JT);
      tl.fromTo(bub, { scaleY: 1 }, { scaleY: 0.94, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out', immediateRender: false }, JT + 0.3);
      tl.to(bub, { rotation: -1.5, y: -8, duration: 0.6, ease: 'sine.inOut' }, JT + 0.6);
      tl.fromTo(jjChars, { y: 90, scale: 0.2, rotation: (i) => (i % 2 ? 24 : -24), opacity: 0 },
        { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.4, ease: 'back.out(3.2)', stagger: 0.028 }, JT);
      tl.to(jjChars, { y: -10, duration: 0.2, ease: 'sine.out', stagger: { each: 0.04, yoyo: true, repeat: 1 } }, JT + 0.55);
      tl.fromTo('.s5-ray', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.16, ease: 'power2.out', stagger: 0.008 }, JT + 0.02);
      tl.to('.s5-ray', { drawSVG: '100% 100%', duration: 0.22, ease: 'power2.in', stagger: 0.008 }, JT + 0.2);
      // Coup de caméra à l'impact
      tl.to(sc1, { y: 10, duration: 0.05, ease: 'power2.out' }, JT);
      tl.to(sc1, { y: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' }, JT + 0.05);

      // -- Wipe drapeau (17.08 → 17.52) --
      tl.fromTo('.s5-w1', { attr: { r: 0 } }, { attr: { r: 1350 }, duration: 0.36, ease: 'power2.in' }, 1.6);
      tl.fromTo('.s5-w2', { attr: { r: 0 } }, { attr: { r: 1350 }, duration: 0.34, ease: 'power2.in' }, 1.62);
      tl.fromTo('.s5-w3', { attr: { r: 0 } }, { attr: { r: 1350 }, duration: 0.32, ease: 'power2.in' }, 1.66);
      tl.set(card, { visibility: 'visible' }, 2.02);
      tl.set([sc1, wipe], { visibility: 'hidden' }, 2.02);

      // ================= CARTON FINAL =================
      const lp = q('.s5-tile .logo-pin'), lr = q('.s5-tile .logo-ring'), lh = q('.s5-tile .logo-handle'), ld = q('.s5-tile .logo-dot');
      const logo = q('.s5-tile .asset-logo');
      // La tuile naît du vert (elle traverse le wipe : visible dès 1.92 grâce au calque card)
      tl.set(card, { visibility: 'visible' }, 1.9);
      tl.set('.s5-cardbg', { opacity: 0 }, 0);
      tl.set('.s5-cardbg', { opacity: 1 }, 2.02);
      tl.set([qa('.s5-crings'), qa('.s5-cdeco')], { opacity: 0 }, 0);
      tl.set([qa('.s5-crings'), qa('.s5-cdeco')], { opacity: 1 }, 2.02);
      tl.fromTo('.s5-tile', { scale: 0, rotation: -24 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.9)' }, 1.92);
      tl.fromTo(logo, { y: -380, scaleX: 0.8, scaleY: 1.25, transformOrigin: '50% 100%' }, { y: 0, scaleX: 1, scaleY: 1, duration: 0.42, ease: 'fekk.land' }, 2.06);
      tl.to(logo, { scaleX: 1.14, scaleY: 0.84, duration: 0.07, ease: 'power2.out' }, 2.2);
      tl.to(logo, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.4)' }, 2.27);
      tl.set([lr, lh], { drawSVG: '0%' }, 0);
      tl.set(ld, { scale: 0, transformOrigin: '50% 50%' }, 0);
      tl.fromTo(lr, { drawSVG: '0%', rotation: -90, transformOrigin: '50% 50%' }, { drawSVG: '100%', rotation: -90, duration: 0.36, ease: 'power2.inOut' }, 2.26);
      tl.fromTo(lh, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.14, ease: 'power2.out' }, 2.52);
      tl.fromTo(ld, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(4)' }, 2.58);
      // Pings radar depuis l'icône
      qa('.s5-ping').forEach((p, i) => {
        tl.fromTo(p, { scale: 0.9, opacity: 0.6 }, { scale: 3.4, opacity: 0, duration: 1.3, ease: 'power2.out', immediateRender: false }, 2.28 + i * 0.68);
      });
      // Anneaux et formes de fond
      tl.fromTo('.s5-crings', { scale: 0.7, rotation: 0, transformOrigin: '50% 50%' }, { scale: 1, rotation: 30, duration: 2.5, ease: 'power2.out' }, 2.0);
      qa('.s5-cd .s5-cdi').forEach((d, i) => {
        tl.fromTo(d, { scale: 0, rotation: -40, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, 2.1 + i * 0.07);
        tl.to(d, { y: i % 2 ? -14 : 14, rotation: i % 2 ? 10 : -10, duration: 1.9, ease: 'sine.inOut' }, 2.6 + i * 0.07);
      });

      // Wordmark
      tl.fromTo(wordChars, { y: 150, rotation: (i) => [-14, 10, -8, 12][i % 4], scaleY: 1.35, scaleX: 0.8, opacity: 0, transformOrigin: '50% 100%' },
        { y: 0, rotation: 0, scaleY: 1, scaleX: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.06 }, 2.4);
      tl.to(wordChars, { opacity: 1, duration: 0.01 }, 2.95);
      // Définition
      tl.fromTo('.s5-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'fekk.snap' }, 2.78);
      tl.fromTo('.s5-def .s5-w', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'fekk.snap', stagger: 0.06 }, 2.82);
      // Tagline
      tl.fromTo(tagWords, { y: 70, rotation: 6, opacity: 0, transformOrigin: '0% 100%' }, { y: 0, rotation: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.8)', stagger: 0.05 }, 2.98);
      // CTA
      tl.fromTo('.s5-cta', { scaleX: 0.2, scaleY: 0.4, opacity: 0 }, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' }, 3.28);
      tl.fromTo(ctaChars, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'fekk.snap', stagger: 0.012 }, 3.36);
      tl.fromTo('.s5-cta-dot', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(4)' }, 3.4);
      tl.set('.s5-cta-dot i', { opacity: 0 }, 0);
      tl.fromTo('.s5-cta-dot i', { scale: 1, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, 3.62);
      tl.fromTo('.s5-cta-dot i', { scale: 1, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, 4.1);
      tl.fromTo('.s5-cta-ring', { scale: 1, opacity: 0.9 }, { scale: 1.12, opacity: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, 3.62);
      // Respiration finale (1 → 1.02), sans fondu
      tl.fromTo('.s5-cardin', { scale: 1 }, { scale: 1.02, duration: 1.5, ease: 'sine.inOut' }, 3.0);

      /* ================= CONFETTIS (fonction pure du temps) ================= */
      const COLS = [C.green, C.yellow, C.red, C.green, C.yellow, C.red, C.mint, C.ink];
      const parts = [];
      const add = (n, t0, ox, oy, sx, sy, aMin, aMax, vMin, vMax) => {
        for (let i = 0; i < n; i++) {
          const a = aMin + rng() * (aMax - aMin), v = vMin + rng() * (vMax - vMin);
          parts.push({
            t0: t0 + rng() * 0.06, x0: ox + (rng() - 0.5) * sx, y0: oy + (rng() - 0.5) * sy,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: COLS[Math.floor(rng() * COLS.length)],
            kind: Math.floor(rng() * 4), s: 10 + rng() * 14, r0: rng() * 6.28, spin: (rng() - 0.5) * 16,
            flip: 6 + rng() * 10, ph: rng() * 6.28, wob: 20 + rng() * 40,
          });
        }
      };
      add(70, JT + 0.02, 540, 470, 620, 160, -Math.PI, Math.PI, 700, 1900);           // explosion de la bulle
      add(34, JT + 0.06, -20, 1560, 40, 80, -1.35, -0.85, 1900, 2900);               // canon gauche
      add(34, JT + 0.06, 1100, 1560, 40, 80, -Math.PI + 0.85, -Math.PI + 1.35, 1900, 2900); // canon droit
      const K = 2.8, GR = 1150;
      let drawn = true;
      frame = (t) => {
        if (t < JT || t > 2.05) {
          if (drawn) { ctx.clearRect(0, 0, 1080, 1920); drawn = false; }
          return;
        }
        ctx.clearRect(0, 0, 1080, 1920);
        drawn = true;
        for (const p of parts) {
          const u = t - p.t0;
          if (u <= 0) continue;
          const e = 1 - Math.exp(-K * u);
          const x = p.x0 + (p.vx / K) * e + Math.sin(u * 5 + p.ph) * p.wob * e;
          const y = p.y0 + ((p.vy + GR / K) / K) * e - (GR / K) * u;
          if (y > 2000 || x < -60 || x > 1140) continue;
          const sc = Math.min(1, u / 0.08);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.r0 + p.spin * u);
          ctx.scale(sc, sc * Math.cos(p.flip * u + p.ph));
          ctx.fillStyle = p.col;
          ctx.strokeStyle = p.col;
          const s = p.s;
          if (p.kind === 0) ctx.fillRect(-s / 2, -s / 4, s, s / 2);
          else if (p.kind === 1) { ctx.beginPath(); ctx.arc(0, 0, s / 2.6, 0, 6.2832); ctx.fill(); }
          else if (p.kind === 2) { ctx.beginPath(); ctx.moveTo(0, -s / 1.8); ctx.lineTo(s / 1.8, s / 2.6); ctx.lineTo(-s / 1.8, s / 2.6); ctx.closePath(); ctx.fill(); }
          else { ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.7, 0); ctx.quadraticCurveTo(-s * 0.35, -s * 0.5, 0, 0); ctx.quadraticCurveTo(s * 0.35, s * 0.5, s * 0.7, 0); ctx.stroke(); }
          ctx.restore();
        }
      };
    },
  });
})();
