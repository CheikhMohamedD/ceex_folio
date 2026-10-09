/* S3 + S4 — « L'app » + « Le match » · 7.00 → 15.50 (8,5 s)
 * Maquette de téléphone en continuité : splash → Déclarer → carte de Dakar (la communauté
 * cherche) → notification + match 94 % → itinéraire vers le point relais → sortie vers sand.
 * Commence sur plein cadre green, finit sur plein cadre sand.
 * Les états textuels (frappe, compteurs, horloge, caméra de la carte, jauge) sont des fonctions
 * pures du temps, calculées dans onFrame(tLocal). Tout le reste vit dans la timeline `tl`. */
(function () {
  const C = FEKK.C;
  let frame = null; // assigné dans build, appelé par onFrame

  /* ---------- Géographie : presqu'île du Cap-Vert (lon/lat → px carte, zoom 1) ---------- */
  const KX = 3364.7, KY = 3465, LON0 = -17.545, LAT0 = 14.8746;
  const P = (lon, lat) => [(lon - LON0) * KX, (LAT0 - lat) * KY];
  const r1 = (n) => Math.round(n * 10) / 10;

  function smooth(ll, closed) {
    const p = ll.map(([a, b]) => P(a, b));
    const n = p.length;
    const at = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }

  const COAST = [
    // Pointe des Almadies → côte nord (Ngor, Yoff, Cambérène) vers l'est
    [-17.532, 14.745], [-17.525, 14.751], [-17.516, 14.753], [-17.509, 14.749], [-17.501, 14.752],
    [-17.490, 14.757], [-17.478, 14.761], [-17.466, 14.765], [-17.452, 14.769], [-17.438, 14.774],
    [-17.422, 14.780], [-17.405, 14.786], [-17.385, 14.792], [-17.360, 14.799], [-17.330, 14.806],
    [-17.290, 14.814], [-17.230, 14.822], [-17.200, 14.760], [-17.230, 14.737],
    // Côte sud du continent, baie de Hann, port, Plateau, cap Manuel
    [-17.300, 14.738], [-17.335, 14.737], [-17.360, 14.734], [-17.380, 14.729], [-17.395, 14.722],
    [-17.405, 14.714], [-17.412, 14.706], [-17.418, 14.697], [-17.421, 14.688], [-17.424, 14.679],
    [-17.426, 14.670], [-17.427, 14.662], [-17.431, 14.655], [-17.437, 14.652], [-17.444, 14.655],
    // Corniche ouest : Soumbédioune, Fann, Mermoz, Ouakam, Mamelles, retour Almadies
    [-17.450, 14.661], [-17.457, 14.668], [-17.465, 14.676], [-17.474, 14.684], [-17.483, 14.692],
    [-17.492, 14.701], [-17.500, 14.709], [-17.506, 14.716], [-17.512, 14.724], [-17.519, 14.730],
    [-17.527, 14.736],
  ];
  const ROADS_MAIN = [
    // Autoroute
    [[-17.434, 14.676], [-17.441, 14.688], [-17.443, 14.700], [-17.436, 14.712], [-17.425, 14.722], [-17.405, 14.733], [-17.380, 14.742], [-17.340, 14.752], [-17.290, 14.760]],
    // VDN
    [[-17.466, 14.690], [-17.462, 14.705], [-17.457, 14.720], [-17.450, 14.738], [-17.441, 14.752], [-17.430, 14.767]],
  ];
  const ROADS = [
    [[-17.446, 14.659], [-17.457, 14.670], [-17.470, 14.682], [-17.485, 14.696], [-17.500, 14.711], [-17.511, 14.725], [-17.520, 14.738]],
    [[-17.466, 14.700], [-17.480, 14.712], [-17.494, 14.722], [-17.500, 14.735], [-17.492, 14.749], [-17.475, 14.757]],
    [[-17.424, 14.690], [-17.410, 14.708], [-17.395, 14.722], [-17.370, 14.733], [-17.330, 14.737]],
    [[-17.440, 14.668], [-17.448, 14.680], [-17.455, 14.693], [-17.460, 14.712]],
    [[-17.447, 14.700], [-17.465, 14.716], [-17.483, 14.735]],
    [[-17.441, 14.752], [-17.465, 14.755], [-17.490, 14.751]],
    [[-17.443, 14.700], [-17.430, 14.700], [-17.418, 14.697]],
  ];

  /* ---------- Icônes maison (24×24, trait) ---------- */
  const ICONS = {
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.5 18.5h3"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><circle cx="8" cy="11.5" r="2.2"/><path d="M5 16.2c.6-1.4 1.7-2 3-2s2.4.6 3 2M13.5 10h5M13.5 13.5h3.5"/>',
    key: '<circle cx="8" cy="15.5" r="4.2"/><path d="M11 12.5 20 3.5M16.8 6.7l2.6 2.6M14.5 9l1.8 1.8"/>',
    wallet: '<rect x="3" y="6.5" width="18" height="13" rx="3"/><path d="M3.5 9.5h13.5c2 0 3.5-1 3.5-3M15.5 13.5h2.5"/>',
    bag: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    pin: '<path d="M12 21.5s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9.5" r="2.6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15" r=".6"/>',
    users: '<circle cx="9" cy="8" r="3.3"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><circle cx="17.2" cy="9" r="2.5"/><path d="M16.5 14c2.8 0 4.7 2.2 4.7 5"/>',
    send: '<path d="M21 3 3.5 10.2l7.2 2.9 2.9 7.4z"/><path d="M21 3 10.7 13.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    store: '<path d="M4 9.5 5.6 4h12.8L20 9.5"/><path d="M4 9.5c0 1.6 1.3 2.8 2.7 2.8s2.6-1.2 2.6-2.8c0 1.6 1.2 2.8 2.7 2.8s2.7-1.2 2.7-2.8c0 1.6 1.2 2.8 2.6 2.8S20 11.1 20 9.5"/><path d="M5.5 12v8.5h13V12M10 20.5v-5h4v5"/>',
    shield: '<path d="M12 2.8 19.5 6v5.6c0 4.6-3.1 8.3-7.5 9.8-4.4-1.5-7.5-5.2-7.5-9.8V6z"/><path d="m8.7 12 2.3 2.3 4.4-4.5"/>',
    back: '<path d="M15 4.5 7.5 12l7.5 7.5"/>',
    arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
    person: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.6-3.6 3.4-5.8 7-5.8s6.4 2.2 7 5.8"/>',
  };
  const ico = (name, size, color, sw = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  const icoG = (name, x, y, s, color, sw = 2.2) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;

  /* Avatars de la communauté (tons de peau variés, foulard wax pour certains). */
  const SKINS = ['#5C3A24', '#8D5A3B', '#3E2618', '#B07850', '#6E4630'];
  const AV_BG = [C.yellow, C.mint, '#FFC9A8', '#BFD3FF', C.sand2];
  function avatar(i, size) {
    const s = SKINS[i % 5], bg = AV_BG[i % 5];
    const wrap = i % 2 === 0
      ? `<path d="M10 17c0-8 6-12 10-12s10 4 10 12c-3-3-6-4-10-4s-7 1-10 4z" fill="${[C.red, C.green, C.blue][i % 3]}"/>`
      : `<path d="M12.5 14c1-4.5 4-6.5 7.5-6.5s6.5 2 7.5 6.5c-2-1.5-4.5-2.2-7.5-2.2s-5.5.7-7.5 2.2z" fill="#1A1210"/>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="${bg}" stroke="#fff" stroke-width="2.5"/>
      <clipPath id="s3-avc${i}"><circle cx="20" cy="20" r="17.5"/></clipPath>
      <g clip-path="url(#s3-avc${i})"><path d="M6 40c1-8 7-12 14-12s13 4 14 12z" fill="${s}"/><path d="M6 40c1-8 7-12 14-12s13 4 14 12z" fill="#0B1210" opacity=".18" transform="translate(0 3)"/>
      <circle cx="20" cy="18" r="7.5" fill="${s}"/>${wrap}</g></svg>`;
  }

  const PIN_D = 'M0 0C-3 -8 -17 -17 -17 -31A17 17 0 1 1 17 -31C17 -17 3 -8 0 0Z';

  FEKK.scene({
    id: 's3',
    start: 7.0,
    end: 15.5,
    onFrame(t) { if (frame) frame(t); },
    build(root, tl) {
      const q = (s) => root.querySelector(s);
      const qa = (s) => Array.from(root.querySelectorAll(s));
      const E = (n) => gsap.parseEase(n);
      const seg = (t, a, b, ease) => {
        const p = Math.max(0, Math.min(1, (t - a) / (b - a)));
        return ease ? E(ease)(p) : p;
      };
      const lerp = (a, b, p) => a + (b - a) * p;

      /* ================= STYLES ================= */
      const css = `
.s3-bg{position:absolute;inset:0;background:${C.green}}
.s3-svgfull{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible}
.s3-titles{position:absolute;left:40px;right:40px;top:180px;height:262px}
.s3-title{position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:var(--display);font-weight:800;font-size:112px;line-height:.92;letter-spacing:-.035em;color:#fff;text-shadow:0 8px 0 rgba(11,18,16,.42)}
.s3-title .s3-num{color:${C.yellow}}
.s3-steps{position:absolute;left:0;right:0;top:0;display:flex;justify-content:center;gap:12px}
.s3-step{width:46px;height:10px;border-radius:5px;background:rgba(255,255,255,.28);overflow:hidden;position:relative}
.s3-step i{position:absolute;inset:0;background:${C.yellow};transform-origin:0 50%;transform:scaleX(0)}
.s3-phone-exit{position:absolute;left:240px;top:470px;width:600px;height:1220px}
.s3-phone-cam,.s3-phone-enter,.s3-phone-shake,.s3-phone-tilt{position:absolute;inset:0}
.s3-phone-cam{transform-origin:0 0}
.s3-titles{transform-origin:50% 100%}
.s3-phone-shadow{position:absolute;inset:0;border-radius:90px;background:rgba(11,18,16,.3);transform:translate(30px,38px)}
.s3-phone-body{position:absolute;inset:0;border-radius:90px;background:#0D0F12;box-shadow:inset 0 0 0 3px #30343C,inset 0 0 0 7px #0D0F12,inset 0 0 0 8px #1C1F25}
.s3-sbtn{position:absolute;width:7px;background:#23262D;border-radius:4px}
.s3-screen{position:absolute;left:14px;top:14px;width:572px;height:1192px;border-radius:76px;overflow:hidden;background:#FBF8F2;font-family:var(--ui);color:#14201B;isolation:isolate}
.s3-scr{position:absolute;left:0;top:0;width:572px;height:1192px}
.s3-glare{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.07) 30.5%,rgba(255,255,255,.07) 44%,rgba(255,255,255,0) 44.5%);z-index:50}
.s3-island{position:absolute;left:224px;top:16px;width:124px;height:36px;border-radius:18px;background:#050608;z-index:60}
.s3-status{position:absolute;left:0;right:0;top:0;height:64px;z-index:55;font-weight:650;font-size:22px;letter-spacing:-.01em}
.s3-clock{position:absolute;left:62px;top:20px;font-variant-numeric:tabular-nums}
.s3-sicons{position:absolute;right:46px;top:24px;display:flex;gap:8px;align-items:center}
.s3-home{position:absolute;left:216px;bottom:14px;width:140px;height:6px;border-radius:3px;background:#14201B;z-index:55}
/* --- Déclarer --- */
.s3-declare{background:#FBF8F2;filter:brightness(1)}
.s3-backbtn{position:absolute;left:26px;top:82px;width:52px;height:52px;border-radius:26px;background:#fff;border:2px solid #ECE3D3;display:flex;align-items:center;justify-content:center}
.s3-h1{position:absolute;left:94px;top:86px;font-weight:800;font-size:31px;letter-spacing:-.02em}
.s3-draft{position:absolute;right:26px;top:92px;font-size:15px;font-weight:700;color:${C.green};background:#E3F5EA;padding:7px 12px;border-radius:14px}
.s3-sub{position:absolute;left:28px;top:154px;font-size:19px;color:#7C766B;font-weight:500}
.s3-lbl{position:absolute;left:30px;font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#958E80}
.s3-chips{position:absolute;left:28px;top:240px;display:flex;gap:10px;white-space:nowrap}
.s3-chip svg{flex:none}
.s3-chip{height:56px;border-radius:28px;padding:0 20px 0 16px;display:flex;align-items:center;gap:9px;background:#fff;border:2px solid #ECE3D3;font-size:20px;font-weight:600;color:#3A433E;position:relative}
.s3-chip-sel{position:absolute;inset:-2px;border-radius:28px;background:${C.green};display:flex;align-items:center;gap:9px;padding:0 20px 0 16px;color:#fff;font-size:20px;font-weight:700;transform:scale(0)}
.s3-field{position:absolute;left:28px;width:516px;background:#fff;border:2px solid #ECE3D3;border-radius:22px;box-shadow:0 4px 0 #EFE6D6;display:flex;align-items:center;padding:0 18px;gap:14px;font-size:23px;font-weight:550}
.s3-ftxt{flex:1;white-space:nowrap;display:flex;align-items:center;position:relative;height:34px}
.s3-ph{position:absolute;left:0;top:3px;color:#B5AE9F;font-weight:450}
.s3-caret{display:inline-block;width:3px;height:28px;background:${C.green};border-radius:2px;margin-left:2px;opacity:0}
.s3-ficon{width:44px;height:44px;border-radius:14px;background:#F3EEE4;display:flex;align-items:center;justify-content:center;flex:none}
.s3-photo{width:76px;height:76px;border-radius:16px;background:${C.sand};flex:none;overflow:hidden;position:relative;transform:scale(0)}
.s3-photo svg{position:absolute;left:24px;top:8px;width:30px;height:60px;transform:rotate(-12deg)}
.s3-photo b{position:absolute;right:5px;bottom:5px;width:22px;height:22px;border-radius:11px;background:${C.green};display:flex;align-items:center;justify-content:center}
.s3-focus{position:absolute;left:24px;width:524px;border:3px solid ${C.green};border-radius:25px;box-shadow:0 0 0 6px rgba(43,214,123,.22);opacity:0}
.s3-togrow{position:absolute;left:28px;top:762px;width:516px;height:74px;border-radius:22px;background:#EEF7F1;display:flex;align-items:center;padding:0 16px;gap:14px;font-size:20px;font-weight:650;color:#1E3B2C}
.s3-togrow small{display:block;font-size:15px;font-weight:500;color:#5E7A69;margin-top:2px}
.s3-tog{margin-left:auto;width:66px;height:40px;border-radius:20px;background:#CFC8BA;position:relative}
.s3-tog i{position:absolute;left:4px;top:4px;width:32px;height:32px;border-radius:16px;background:#fff;box-shadow:0 2px 0 rgba(11,18,16,.15)}
.s3-pub{position:absolute;left:28px;top:862px;width:516px;height:92px;border-radius:46px;background:${C.green};box-shadow:0 7px 0 #006631;overflow:hidden}
.s3-pub-lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;font-weight:750;font-size:29px;letter-spacing:-.01em}
.s3-ripple{position:absolute;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:40px;background:rgba(255,255,255,.45);transform:scale(0)}
.s3-pub-check{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px}
.s3-legal{position:absolute;left:0;right:0;top:978px;text-align:center;font-size:16px;color:#968F82;font-weight:500}
/* --- Carte --- */
.s3-map{background:#BFE1EE;box-shadow:-16px 0 0 rgba(11,18,16,.16)}
.s3-mapsvg{position:absolute;left:0;top:0;width:572px;height:1192px}
.s3-search{position:absolute;left:22px;right:22px;top:76px;height:66px;border-radius:33px;background:#fff;box-shadow:0 5px 0 rgba(11,18,16,.08);display:flex;align-items:center;padding:0 10px 0 22px;gap:12px;font-size:20px;color:#8B8476;font-weight:500}
.s3-search .s3-av{margin-left:auto}
.s3-fchips{position:absolute;left:22px;top:156px;display:flex;gap:8px}
.s3-fchip{height:40px;border-radius:20px;padding:0 16px;background:#fff;font-size:16px;font-weight:650;color:#3A433E;display:flex;align-items:center;box-shadow:0 3px 0 rgba(11,18,16,.07)}
.s3-fchip.on{background:#14201B;color:#fff}
.s3-sheet{position:absolute;left:0;top:0;width:572px;height:1192px;background:#fff;border-radius:36px 36px 0 0;box-shadow:0 -5px 0 rgba(11,18,16,.07)}
.s3-handle{position:absolute;left:256px;top:12px;width:60px;height:6px;border-radius:3px;background:#E3DDD1}
.s3-blk{position:absolute;left:0;top:0;width:572px}
.s3-row{position:absolute;left:28px;right:28px;display:flex;align-items:center;gap:14px}
.s3-ic56{width:58px;height:58px;border-radius:18px;display:flex;align-items:center;justify-content:center;flex:none}
.s3-t1{font-size:23px;font-weight:750;letter-spacing:-.015em;color:#14201B}
.s3-t2{font-size:18px;font-weight:550;color:#7C766B;margin-top:3px}
.s3-pill{margin-left:auto;height:38px;border-radius:19px;padding:0 14px;display:flex;align-items:center;gap:7px;font-size:16px;font-weight:700;white-space:nowrap}
.s3-dot3{width:7px;height:7px;border-radius:4px;background:${C.green}}
.s3-avs{display:flex}
.s3-avs > div{margin-left:-12px;transform:scale(0)}
.s3-avs > div:first-child{margin-left:0}
.s3-count{font-size:21px;font-weight:750;color:#14201B;font-variant-numeric:tabular-nums}
.s3-count small{display:block;font-size:17px;font-weight:550;color:#7C766B;margin-top:2px}
.s3-thumb{position:absolute;top:100px;width:178px;height:236px;border-radius:24px;overflow:hidden}
.s3-thumb svg{position:absolute}
.s3-thumb-tag{position:absolute;left:10px;bottom:10px;height:30px;border-radius:15px;padding:0 10px;font-size:17px;font-weight:750;display:flex;align-items:center;background:#fff;color:#14201B}
.s3-gauge{position:absolute;left:206px;top:138px;width:160px;height:160px;border-radius:80px;background:#fff;box-shadow:0 0 0 8px #fff}
.s3-gauge-txt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.s3-gauge-txt b{font-family:var(--display);font-weight:800;font-size:48px;white-space:nowrap;letter-spacing:-.04em;line-height:1;color:#14201B;font-variant-numeric:tabular-nums}
.s3-gauge-txt b small{font-size:30px;letter-spacing:0}
.s3-gauge-txt > span{font-size:16px;font-weight:750;color:#3E6A52;margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
.s3-gglow{position:absolute;inset:-8px;border-radius:50%;border:7px solid ${C.mint};opacity:0}
.s3-mchips{position:absolute;left:28px;right:28px;top:368px;display:flex;gap:8px;flex-wrap:nowrap}
.s3-mchip{height:42px;border-radius:21px;padding:0 13px 0 9px;display:flex;align-items:center;gap:6px;background:#EEF7F1;color:#1E5A3A;font-size:17.5px;font-weight:700;white-space:nowrap}
.s3-badge{position:absolute;left:28px;right:28px;height:58px;border-radius:18px;background:#E6F9EE;border:2px dashed #8EDDB0;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:19.5px;font-weight:650;color:#1E5A3A;white-space:nowrap}
.s3-badge b{font-weight:800;letter-spacing:.12em;color:#0B1210;background:#fff;border-radius:8px;padding:2px 8px;margin-left:2px}
.s3-cta{position:absolute;left:28px;width:516px;height:88px;border-radius:44px;background:${C.green};box-shadow:0 7px 0 #006631;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;font-size:27px;font-weight:750;letter-spacing:-.01em}
.s3-cta-ring{position:absolute;left:28px;width:516px;height:88px;border-radius:44px;border:4px solid ${C.mint};opacity:0}
/* --- Notification --- */
.s3-notif{position:absolute;left:16px;right:16px;top:62px;height:176px;border-radius:32px;background:#fff;box-shadow:0 6px 0 rgba(11,18,16,.14),0 0 0 1.5px rgba(11,18,16,.05);z-index:58;padding:18px 22px;transform:translateY(-300px);height:auto;min-height:176px}
.s3-nhead{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;color:#8B8476;letter-spacing:.04em;text-transform:uppercase}
.s3-nicon{width:34px;height:34px;border-radius:10px;background:${C.green};display:flex;align-items:center;justify-content:center}
.s3-nicon svg{width:20px;height:26px}
.s3-nhead span:last-child{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:550}
.s3-ntitle{font-size:26px;font-weight:800;margin-top:12px;letter-spacing:-.015em;color:#14201B}
.s3-nbody{font-size:21.5px;font-weight:550;margin-top:5px;line-height:1.26;color:#3A433E}
/* --- Splash --- */
.s3-splash{position:absolute;left:0;top:0;width:572px;height:1192px;z-index:40}
.s3-sword{position:absolute;left:0;right:0;top:700px;text-align:center;font-family:var(--display);font-weight:800;font-size:104px;letter-spacing:-.045em;color:${C.green};z-index:41;line-height:1}
.s3-sword span{display:inline-block}
.s3-hand{position:absolute;left:0;top:0;width:300px;height:560px}
.s3-wipe{position:absolute;left:0;top:0;width:1080px;height:2400px}
.s3-sandfull{position:absolute;inset:0;background:${C.sand};opacity:0}
`;
      root.appendChild(FEKK.el(`<style>${css}</style>`));

      /* ================= FOND : vert + anneaux wax + formes ================= */
      root.appendChild(FEKK.el('<div class="s3-bg"></div>'));

      const ringsSvg = FEKK.el(`<svg class="s3-svgfull s3-rings" viewBox="0 0 1080 1920">
        <g class="s3-ringA" ><circle cx="540" cy="1080" r="380" fill="none" stroke="#00793A" stroke-width="40"/></g>
        <g class="s3-ringB"><circle cx="540" cy="1080" r="520" fill="none" stroke="#00793A" stroke-width="20" stroke-linecap="round" stroke-dasharray="0.1 44"/></g>
        <g class="s3-ringC"><circle cx="540" cy="1080" r="660" fill="none" stroke="#00793A" stroke-width="26" stroke-dasharray="70 34"/></g>
        <g class="s3-ringD"><circle cx="540" cy="1080" r="820" fill="none" stroke="#00793A" stroke-width="18" stroke-linecap="round" stroke-dasharray="0.1 52"/></g>
      </svg>`);
      root.appendChild(ringsSvg);

      // Formes wax arrière (ombres dures vert sombre)
      const SH = '#005F2D';
      const zig = (n, w, h) => { let d = 'M0 0'; for (let i = 1; i <= n; i++) d += ` L${(i * w) / n} ${i % 2 ? h : 0}`; return d; };
      const decoBack = FEKK.el(`<svg class="s3-svgfull s3-decoB" viewBox="0 0 1080 1920">
        <g class="s3-d s3-d1" transform="translate(150 820)"><g class="s3-dd">
          <path d="M0 -160A160 160 0 0 0 0 160Z" fill="${SH}" transform="translate(14 16)"/>
          <path d="M0 -160A160 160 0 0 0 0 160Z" fill="${C.yellow}"/>
          <path d="M-30 -110A120 120 0 0 0 -30 110" fill="none" stroke="${C.sunset}" stroke-width="12" stroke-dasharray="2 22" stroke-linecap="round"/>
          <path d="M-80 -60A80 80 0 0 0 -80 60" fill="none" stroke="#E2C900" stroke-width="16"/></g></g>
        <g class="s3-d s3-d2" transform="translate(965 610)"><g class="s3-dd">
          <circle r="82" fill="none" stroke="${SH}" stroke-width="32" transform="translate(12 14)"/>
          <circle r="82" fill="none" stroke="${C.mint}" stroke-width="32"/>
          <circle r="82" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-dasharray="8 16"/></g></g>
        <g class="s3-d s3-d3" transform="translate(940 1290)"><g class="s3-dd" transform="rotate(-72)">
          <path d="${zig(7, 300, 56)}" fill="none" stroke="${SH}" stroke-width="24" stroke-linejoin="round" stroke-linecap="round" transform="translate(-150 -28) translate(12 14)"/>
          <path d="${zig(7, 300, 56)}" fill="none" stroke="${C.sand}" stroke-width="24" stroke-linejoin="round" stroke-linecap="round" transform="translate(-150 -28)"/></g></g>
        <g class="s3-d s3-d4" transform="translate(150 1240)"><g class="s3-dd">
          ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${c * 34 - 51}" cy="${r * 34 - 34}" r="9" fill="${C.yellow}"/>`).join('')).join('')}</g></g>
        <g class="s3-d s3-d5" transform="translate(70 1830)"><g class="s3-dd">
          <circle r="250" fill="none" stroke="${C.sand}" stroke-width="28"/>
          <circle r="190" fill="none" stroke="${C.yellow}" stroke-width="28"/>
          <circle r="130" fill="none" stroke="${C.mint}" stroke-width="28"/>
          <circle r="70" fill="${C.sand}"/></g></g>
        <g class="s3-d s3-d6" transform="translate(178 540)"><g class="s3-dd">
          <path d="M0 -38 L36 26 L-36 26Z" fill="${SH}" transform="translate(9 10)"/>
          <path d="M0 -38 L36 26 L-36 26Z" fill="${C.red}"/></g></g>
        <g class="s3-d s3-d7" transform="translate(1010 1640)"><g class="s3-dd">
          <path d="M0 -120A120 120 0 0 0 0 120Z" fill="${SH}" transform="translate(12 14)"/>
          <path d="M0 -120A120 120 0 0 0 0 120Z" fill="${C.mint}"/>
          <path d="M-20 -80A80 80 0 0 0 -20 80" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="10" stroke-dasharray="3 18" stroke-linecap="round"/></g></g>
        <g class="s3-d s3-d8" transform="translate(1008 905)"><g class="s3-dd">
          <circle r="16" fill="${C.yellow}"/></g></g>
      </svg>`);
      root.appendChild(decoBack);

      /* ================= TITRES EXTERNES ================= */
      const titles = FEKK.el(`<div class="s3-titles">
        <div class="s3-title s3-ti1"><span class="s3-num">1.</span> Déclare</div>
        <div class="s3-title s3-ti2"><span class="s3-num">2.</span> La communauté cherche</div>
        <div class="s3-title s3-ti3"><span class="s3-num">3.</span> Fekk trouve</div>
      </div>`);
      root.appendChild(titles);

      /* ================= VAGUE DE SORTIE (sous le téléphone) ================= */
      const wave = (y0, amp, n) => {
        let d = `M0 0H1080V${y0}`;
        const w = 1080 / n;
        for (let i = 0; i < n; i++) {
          const x1 = 1080 - i * w, x2 = x1 - w;
          d += ` Q${x1 - w / 2} ${y0 + (i % 2 ? -amp : amp)} ${x2} ${y0}`;
        }
        return d + 'Z';
      };
      const wipe = FEKK.el(`<svg class="s3-wipe" viewBox="0 0 1080 2400">
        <path class="s3-wipe-y" d="${wave(2250, 60, 4)}" fill="${C.yellow}"/>
        <path class="s3-wipe-s" d="${wave(2150, 70, 3)}" fill="${C.sand}"/>
      </svg>`);
      root.appendChild(wipe);

      /* ================= TÉLÉPHONE ================= */
      const phone = FEKK.el(`<div class="s3-phone-exit"><div class="s3-phone-cam"><div class="s3-phone-enter"><div class="s3-phone-shake"><div class="s3-phone-tilt">
        <div class="s3-phone-shadow"></div>
        <div class="s3-sbtn" style="left:-5px;top:250px;height:70px"></div>
        <div class="s3-sbtn" style="left:-5px;top:340px;height:110px"></div>
        <div class="s3-sbtn" style="left:-5px;top:470px;height:110px"></div>
        <div class="s3-sbtn" style="right:-5px;top:360px;height:150px"></div>
        <div class="s3-phone-body"></div>
        <div class="s3-screen"></div>
        <svg class="s3-vib" viewBox="0 0 600 1220" style="position:absolute;left:0;top:0;width:600px;height:1220px;overflow:visible">
          <g class="s3-vibL" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0">
            <path d="M-26 470 q-18 40 0 80"/><path d="M-52 450 q-28 60 0 120"/></g>
          <g class="s3-vibR" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0">
            <path d="M626 470 q18 40 0 80"/><path d="M652 450 q28 60 0 120"/></g>
        </svg>
      </div></div></div></div></div>`);
      root.appendChild(phone);
      const screen = phone.querySelector('.s3-screen');

      /* ---------- Écran 1 : Déclarer une perte ---------- */
      const chips = [
        ['phone', 'Téléphone'], ['card', 'Papiers'], ['key', 'Clés'], ['wallet', 'Portefeuille'],
      ];
      const declare = FEKK.el(`<div class="s3-scr s3-declare">
        <div class="s3-backbtn">${ico('back', 26, '#14201B', 2.6)}</div>
        <div class="s3-h1">Déclarer une perte</div>
        <div class="s3-draft">Brouillon</div>
        <div class="s3-sub">Plus c’est précis, plus vite on le retrouve.</div>
        <div class="s3-lbl" style="top:210px">Catégorie</div>
        <div class="s3-chips">${chips.map(([ic, l], i) => `<div class="s3-chip s3-chip${i}">${ico(ic, 24, '#3A433E')}${l}${i === 0 ? `<div class="s3-chip-sel">${ico(ic, 24, '#fff', 2.2)}${l}</div>` : ''}</div>`).join('')}</div>
        <div class="s3-lbl" style="top:322px">Description</div>
        <div class="s3-field s3-f0" style="top:352px;height:100px">
          <div class="s3-ftxt"><span class="s3-ph">Marque, couleur, signes…</span><span class="s3-typed"></span><span class="s3-caret"></span></div>
          <div class="s3-photo">${FEKK.ASSETS.phoneBack}<b>${ico('check', 15, '#fff', 3.4)}</b></div>
        </div>
        <div class="s3-lbl" style="top:476px">Lieu</div>
        <div class="s3-field s3-f1" style="top:506px;height:80px">
          <div class="s3-ficon">${ico('pin', 24, C.green, 2.2)}</div>
          <div class="s3-ftxt"><span class="s3-ph">Où l’avez-vous perdu ?</span><span class="s3-typed"></span><span class="s3-caret"></span></div>
        </div>
        <div class="s3-lbl" style="top:610px">Date et heure</div>
        <div class="s3-field s3-f2" style="top:640px;height:80px">
          <div class="s3-ficon">${ico('cal', 24, C.green, 2.2)}</div>
          <div class="s3-ftxt"><span class="s3-ph">Quand ?</span><span class="s3-typed"></span><span class="s3-caret"></span></div>
        </div>
        <div class="s3-togrow"><div class="s3-ficon" style="background:#fff">${ico('users', 24, C.green, 2.2)}</div>
          <div>Alerter la communauté<small>Les voisins autour de vous</small></div><div class="s3-tog"><i></i></div></div>
        <div class="s3-pub"><div class="s3-ripple"></div>
          <div class="s3-pub-lbl"><span>Publier</span>${ico('send', 28, '#fff', 2.4)}</div>
          <svg class="s3-pub-check" viewBox="0 0 24 24" fill="none" stroke="#0B1210" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path class="s3-pub-ck" d="m5 12.5 4.5 4.5L19 7"/></svg>
        </div>
        <div class="s3-legal">Gratuit · Votre numéro reste privé</div>
        <div class="s3-focus"></div>
      </div>`);
      screen.appendChild(declare);
      
      /* ---------- Écran 2 : Carte de Dakar ---------- */
      const landD = smooth(COAST, true);
      const roadD = (pts) => smooth(pts, false);
      const ellipse = (lon, lat, rx, ry, rot, fill) => { const [x, y] = P(lon, lat); return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${r1(x)} ${r1(y)})" fill="${fill}"/>`; };
      const [ax, ay] = P(-17.490, 14.7405);
      const [gx, gy] = P(-17.3985, 14.6672);
      const [nx, ny] = P(-17.5145, 14.7575);
      const [cx0, cy0] = P(-17.448, 14.6935);   // Colobane (propriétaire)
      const [sx0, sy0] = P(-17.4378, 14.6720);  // Sandaga (point relais)
      // Môles du port
      const jet = [[-17.4215, 14.683, -60], [-17.4195, 14.690, -60], [-17.418, 14.697, -55]].map(([lo, la, r]) => { const [x, y] = P(lo, la); return `<rect x="${r1(x - 2)}" y="${r1(y - 4)}" width="22" height="7" rx="2" transform="rotate(${r + 60} ${r1(x)} ${r1(y)})" fill="#F7F0E1"/>`; }).join('');

      const mapScr = FEKK.el(`<div class="s3-scr s3-map">
        <svg class="s3-mapsvg" viewBox="0 0 572 1192">
          <defs>
            <pattern id="s3-waves" width="44" height="26" patternUnits="userSpaceOnUse"><path d="M2 14q9 -7 18 0t18 0" fill="none" stroke="#D3ECF4" stroke-width="2" stroke-linecap="round"/></pattern>
            <pattern id="s3-streets" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><path d="M0 0H14M0 0V14" stroke="#EDE2CB" stroke-width="1.6"/></pattern>
            <mask id="s3-route-mask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000"><path class="s3-route-rev" d="" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/></mask>
          </defs>
          <g class="s3-cam">
            <rect x="-900" y="-900" width="2600" height="3200" fill="#BFE1EE"/>
            <rect x="-900" y="-900" width="2600" height="3200" fill="url(#s3-waves)"/>
            <path d="${landD}" fill="none" stroke="#D6EDF5" stroke-width="22" stroke-linejoin="round"/>
            <path d="${landD}" fill="#A9D3E2" transform="translate(0 5)"/>
            <path d="${landD}" fill="#F7F0E1"/>
            <path d="${landD}" fill="url(#s3-streets)" opacity=".9"/>
            ${jet}
            <circle cx="${r1(gx)}" cy="${r1(gy)}" r="6" fill="#A9D3E2" transform="translate(0 3)"/><circle cx="${r1(gx)}" cy="${r1(gy)}" r="6" fill="#F7F0E1"/>
            <circle cx="${r1(nx)}" cy="${r1(ny)}" r="4" fill="#F7F0E1"/>
            ${ellipse(-17.423, 14.722, 22, 13, -20, '#CDE7C2')}
            ${ellipse(-17.430, 14.746, 30, 10, -25, '#CFE6D8')}
            ${ellipse(-17.505, 14.7255, 13, 9, 0, '#EADFC6')}
            ${ellipse(-17.461, 14.693, 10, 7, 20, '#CDE7C2')}
            <rect x="${r1(ax - 58)}" y="${r1(ay - 5)}" width="116" height="10" rx="5" transform="rotate(-62 ${r1(ax)} ${r1(ay)})" fill="#DDD3C0"/>
            <rect x="${r1(ax - 30)}" y="${r1(ay + 10)}" width="60" height="6" rx="3" transform="rotate(-62 ${r1(ax)} ${r1(ay)})" fill="#E6DDCB"/>
            ${ROADS.map((r) => `<path d="${roadD(r)}" fill="none" stroke="#E6D9BF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
            ${ROADS.map((r) => `<path d="${roadD(r)}" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
            ${ROADS_MAIN.map((r) => `<path d="${roadD(r)}" fill="none" stroke="#E2B44C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
            ${ROADS_MAIN.map((r) => `<path d="${roadD(r)}" fill="none" stroke="#FFD978" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
            <g class="s3-radar">${[0, 1, 2, 3].map((i) => `<circle class="s3-rad s3-rad${i}" cx="${r1(cx0)}" cy="${r1(cy0)}" r="1" fill="rgba(43,214,123,.14)" stroke="${C.green}" stroke-width="2.4"/>`).join('')}</g>
            <path class="s3-route-bg" d="" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" mask="url(#s3-route-mask)"/>
            <path class="s3-route" d="" fill="none" stroke="${C.green}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 5.5" mask="url(#s3-route-mask)"/>
          </g>
          <g class="s3-ovl"></g>
        </svg>
        <div class="s3-search">${ico('search', 26, '#14201B', 2.4)}<span>Rechercher un objet, un lieu…</span><div class="s3-av">${avatar(1, 46)}</div></div>
        <div class="s3-fchips"><div class="s3-fchip on">Tout</div><div class="s3-fchip">Téléphones</div><div class="s3-fchip">Papiers</div><div class="s3-fchip">Clés</div><div class="s3-fchip">Sacs</div></div>
        <div class="s3-sheet">
          <div class="s3-handle"></div>
          <div class="s3-blk s3-blk-search">
            <div class="s3-row" style="top:34px">
              <div class="s3-ic56" style="background:#E3F5EA">${ico('phone', 30, C.green, 2.3)}</div>
              <div><div class="s3-t2" style="margin:0 0 3px">Votre déclaration</div><div class="s3-t1">Samsung noir, coque bleue</div></div>
            </div>
            <div class="s3-row" style="top:118px">
              <div class="s3-avs">${[0, 1, 2, 3, 4].map((i) => `<div>${avatar(i + 2, 46)}</div>`).join('')}</div>
              <div class="s3-count"><span class="s3-cnt">0</span> voisins alertés<small>Recherche en cours autour de Colobane</small></div>
            </div>
            <div class="s3-pill s3-spill" style="position:absolute;right:28px;top:44px;background:#E3F5EA;color:${C.green}"><i class="s3-dot3"></i><i class="s3-dot3"></i><i class="s3-dot3"></i></div>
          </div>
          <div class="s3-blk s3-blk-match">
            <div class="s3-row" style="top:34px">
              <div><div class="s3-t1" style="font-size:26px">Correspondance trouvée</div><div class="s3-t2">Analyse photo, lieu et description</div></div>
              <div class="s3-pill" style="background:${C.mint};color:#0B1210">${ico('check', 18, '#0B1210', 3)}Très probable</div>
            </div>
            <div class="s3-thumb s3-thumbL" style="left:28px;background:${C.sand}">
              <svg viewBox="0 0 200 400" style="left:50px;top:24px;width:80px;height:160px;transform:rotate(-8deg)">${FEKK.ASSETS.phoneBack.replace(/^\s*<svg[^>]*>|<\/svg>\s*$/g, '')}</svg>
              <div class="s3-thumb-tag">Déclaré</div></div>
            <div class="s3-thumb s3-thumbR" style="left:366px;background:#D6EEF7">
              <svg viewBox="0 0 200 400" style="left:50px;top:26px;width:80px;height:160px;transform:rotate(10deg)">${FEKK.ASSETS.phoneBack.replace(/^\s*<svg[^>]*>|<\/svg>\s*$/g, '')}
                <path d="M186 300 l-22 18 l8 10 l-26 22 l6 8 l-20 18" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" opacity=".9"/></svg>
              <div class="s3-thumb-tag" style="background:${C.green};color:#fff">Trouvé · Sandaga</div></div>
            <div class="s3-gauge"><svg viewBox="0 0 160 160" style="position:absolute;inset:0">
                <circle cx="80" cy="80" r="66" fill="none" stroke="#E6F4EC" stroke-width="14"/>
                <circle class="s3-garc" cx="80" cy="80" r="66" fill="none" stroke="${C.mint}" stroke-width="14" stroke-linecap="round" transform="rotate(-90 80 80)" stroke-dasharray="0 1000"/>
              </svg><div class="s3-gglow"></div><div class="s3-gauge-txt"><b><span class="s3-gnum">0</span><small> %</small></b><span>Fiabilité</span></div></div>
            <div class="s3-mchips">
              <div class="s3-mchip">${ico('check', 18, C.green, 3)}Coque bleue</div>
              <div class="s3-mchip">${ico('check', 18, C.green, 3)}Samsung noir</div>
              <div class="s3-mchip">${ico('check', 18, C.green, 3)}À 2,1 km</div>
            </div>
          </div>
          <div class="s3-blk s3-blk-relay">
            <div class="s3-row" style="top:36px">
              <div class="s3-ic56" style="background:${C.green}">${ico('store', 30, '#fff', 2.2)}</div>
              <div><div class="s3-t1">Point relais Sandaga</div><div class="s3-t2">Ouvert jusqu’à 21h · 2,1 km · 12 min</div></div>
            </div>
            <div class="s3-badge" style="top:122px">${ico('shield', 26, C.green, 2.2)}Remise en main propre · code <b>4821</b></div>
            <div class="s3-cta-ring" style="top:210px"></div>
            <div class="s3-cta" style="top:210px">Récupérer mon objet${ico('arrow', 28, '#fff', 2.6)}</div>
          </div>
        </div>
      </div>`);
      screen.appendChild(mapScr);

      /* ---------- Splash (masque « zoom-through » de l'épingle) ---------- */
      const PINPATH = 'M60 4C30.2 4 8 26.6 8 56.5 8 95 60 154 60 154S112 95 112 56.5C112 26.6 89.8 4 60 4Z';
      const splash = FEKK.el(`<svg class="s3-splash" viewBox="0 0 572 1192">
        <defs><mask id="s3-splash-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="572" height="1192">
          <rect width="572" height="1192" fill="#fff"/>
          <g class="s3-hole"><path d="${PINPATH}" fill="#000"/></g>
        </mask></defs>
        <g mask="url(#s3-splash-mask)">
          <rect width="572" height="1192" fill="${C.sand}"/>
          <g opacity=".55">${[150, 230, 310, 390].map((r, i) => `<circle cx="286" cy="520" r="${r}" fill="none" stroke="${C.sand2}" stroke-width="${i % 2 ? 10 : 22}" ${i % 2 ? 'stroke-dasharray="1 26" stroke-linecap="round"' : ''}/>`).join('')}</g>
        </g>
        <g class="s3-slogo">
          <path d="${PINPATH}" fill="#0B1210" opacity=".18" transform="translate(5 7)"/>
          <path class="s3-slogo-pin" d="${PINPATH}" fill="${C.green}"/>
          <circle class="s3-slogo-ring" cx="56" cy="52" r="20" fill="none" stroke="#fff" stroke-width="9"/>
          <path class="s3-slogo-handle" d="M70.5 66.5 L84 80" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
          <circle class="s3-slogo-dot" cx="56" cy="52" r="6" fill="${C.yellow}"/>
        </g>
      </svg>`);
      screen.appendChild(splash);
      const sword = FEKK.el(`<div class="s3-sword">${'fekk'.split('').map((c) => `<span>${c}</span>`).join('')}</div>`);
      screen.appendChild(sword);

      /* ---------- Chrome commun : barre d'état, îlot, notif, reflet ---------- */
      const sicons = `<svg width="28" height="18" viewBox="0 0 28 18"><rect x="0" y="12" width="5" height="6" rx="1.5" fill="#14201B"/><rect x="7.5" y="8" width="5" height="10" rx="1.5" fill="#14201B"/><rect x="15" y="4" width="5" height="14" rx="1.5" fill="#14201B"/><rect x="22.5" y="0" width="5" height="18" rx="1.5" fill="#14201B" opacity=".3"/></svg>
        <svg width="26" height="18" viewBox="0 0 26 18"><path d="M13 17.5 9.2 13.3a5.6 5.6 0 0 1 7.6 0zM5.6 9.7a10.8 10.8 0 0 1 14.8 0l-2.3 2.4a7.6 7.6 0 0 0-10.2 0zM2 6.1a16 16 0 0 1 22 0l-2.3 2.4a12.8 12.8 0 0 0-17.4 0z" fill="#14201B"/></svg>
        <svg width="40" height="20" viewBox="0 0 40 20"><rect x="1" y="1" width="33" height="18" rx="5.5" fill="none" stroke="#14201B" stroke-opacity=".4" stroke-width="2"/><rect x="4" y="4" width="22" height="12" rx="3" fill="#14201B"/><rect x="36" y="7" width="3" height="6" rx="1.5" fill="#14201B" fill-opacity=".4"/></svg>`;
      screen.appendChild(FEKK.el(`<div class="s3-status"><div class="s3-clock">18:52</div><div class="s3-sicons">${sicons}</div></div>`));
      screen.appendChild(FEKK.el('<div class="s3-island"></div>'));
      const notif = FEKK.el(`<div class="s3-notif">
        <div class="s3-nhead"><span class="s3-nicon"><svg viewBox="0 0 120 160"><path d="${PINPATH}" fill="#fff"/><circle cx="56" cy="52" r="20" fill="none" stroke="${C.green}" stroke-width="10"/><path d="M70.5 66.5 L84 80" stroke="${C.green}" stroke-width="11" stroke-linecap="round"/></svg></span><span>Fekk</span><span>maintenant</span></div>
        <div class="s3-ntitle">🎉 Correspondance trouvée !</div>
        <div class="s3-nbody">Un téléphone bleu a été déposé au point relais de Sandaga.</div>
      </div>`);
      screen.appendChild(notif);
      screen.appendChild(FEKK.el('<div class="s3-home"></div>'));
      screen.appendChild(FEKK.el('<div class="s3-glare"></div>'));

      /* ---------- Overlay carte : libellés + épingles (positions calculées par la caméra) ---------- */
      const ovl = mapScr.querySelector('.s3-ovl');
      const NS = 'http://www.w3.org/2000/svg';
      const svgEl = (html) => { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; return g; };
      const overlay = [];
      const addOvl = (lon, lat, html, cls) => {
        const [x, y] = P(lon, lat);
        const g = svgEl(`<g class="s3-ovl-in ${cls || ''}">${html}</g>`);
        ovl.appendChild(g);
        overlay.push({ x, y, el: g });
        return g.firstElementChild;
      };
      const label = (text, opts = {}) => {
        const { size = 15, w = 650, fill = '#4D5650', anchor = 'middle', dy = 0, dx = 0, italic = false, ls = 0 } = opts;
        const lines = text.split('\n');
        return lines.map((l, i) => `<text x="${dx}" y="${dy + i * size * 1.1}" text-anchor="${anchor}" font-family="Inter Variable, sans-serif" font-size="${size}" font-weight="${w}" ${italic ? 'font-style="italic"' : ''} letter-spacing="${ls}" fill="${fill}" stroke="#F7F0E1" stroke-width="4" stroke-linejoin="round" paint-order="stroke">${l}</text>`).join('');
      };
      const waterLabel = (text, opts = {}) => label(text, Object.assign({ fill: '#5E9AB2', italic: true, w: 600, size: 14, ls: 1.5 }, opts)).replace(/stroke="#F7F0E1"/g, 'stroke="#BFE1EE"');
      const LABELS = [
        [-17.5205, 14.7405, 'Almadies', { size: 14, w: 600, fill: '#7A7468' }],
        [-17.462, 14.7525, 'Yoff', {}],
        [-17.4345, 14.7555, 'Parcelles\nAssainies', {}],
        [-17.5005, 14.7235, 'Ouakam', {}],
        [-17.4755, 14.6985, 'Fann', {}],
        [-17.4555, 14.6830, 'Médina', {}],
        [-17.4310, 14.6610, 'Plateau', {}],
        [-17.448, 14.6935, 'Colobane', { anchor: 'start', w: 750, fill: '#14201B', size: 16, dx: 22, dy: -30 }],
        [-17.4378, 14.6720, 'Sandaga', { anchor: 'start', w: 750, fill: '#14201B', size: 16, dx: 20, dy: -24 }],
      ];
      const labelEls = LABELS.map(([lo, la, t, o]) => addOvl(lo, la, label(t, o), 's3-lab'));
      const wl1 = addOvl(-17.388, 14.7075, waterLabel('Baie de\nHann', { anchor: 'middle' }), 's3-lab');
      const wl2 = addOvl(-17.513, 14.668, waterLabel('Océan\nAtlantique'), 's3-lab');
      const wl3 = addOvl(-17.3985, 14.6625, label('Gorée', { size: 12, w: 600, fill: '#7A7468', dy: 12 }), 's3-lab');

      const pinHtml = (color, icon) => `<g class="s3-pin-in">
          <path d="${PIN_D}" fill="#0B1210" opacity=".22" transform="translate(2.5 3.5)"/>
          <path d="${PIN_D}" fill="#fff"/>
          <circle cx="0" cy="-31" r="13" fill="${color}"/>
          ${icoG(icon, -8, -39, 0.667, '#fff', 2.6)}</g>`;
      const FOUND = [
        [-17.4725, 14.7505, '#E8A317', 'key'],
        [-17.4275, 14.7615, C.clay, 'wallet'],
        [-17.4905, 14.7095, C.red, 'card'],
        [-17.5070, 14.7460, '#7A4FD0', 'bag'],
        [-17.4665, 14.6855, C.red, 'card'],
        [-17.4175, 14.7275, '#E8A317', 'key'],
        [-17.4555, 14.7245, C.clay, 'wallet'],
        [-17.4400, 14.7380, '#7A4FD0', 'bag'],
      ];
      const foundPins = FOUND.map(([lo, la, col, ic]) => addOvl(lo, la, pinHtml(col, ic), 's3-fpin'));
      // Le téléphone trouvé à Sandaga (le match)
      const relayPin = addOvl(-17.4378, 14.6720, `<g class="s3-pin-in">
          <circle class="s3-relay-halo" cx="0" cy="-31" r="22" fill="${C.yellow}" opacity="0"/>
          <path d="${PIN_D}" fill="#0B1210" opacity=".22" transform="translate(2.5 3.5)"/>
          <path class="s3-relay-body" d="${PIN_D}" fill="#fff"/>
          <circle cx="0" cy="-31" r="13" fill="${C.blue}"/>
          ${icoG('phone', -8, -39, 0.667, '#fff', 2.6)}</g>`, 's3-rpin');
      const relayTag = addOvl(-17.4378, 14.6720, `<g class="s3-rtag"><rect x="22" y="-58" width="178" height="40" rx="20" fill="${C.green}"/><rect x="22" y="-58" width="178" height="40" rx="20" fill="none" stroke="#0B1210" stroke-opacity=".12" stroke-width="2" transform="translate(0 3)"/>
          <text x="111" y="-32" text-anchor="middle" font-family="Inter Variable, sans-serif" font-size="16" font-weight="750" fill="#fff">Point relais Sandaga</text></g>`, 's3-rtagw');
      // Propriétaire à Colobane
      const ownerPin = addOvl(-17.448, 14.6935, `<g class="s3-pin-in">
          <path d="${PIN_D}" fill="#0B1210" opacity=".25" transform="translate(2.5 3.5) scale(1.15)"/>
          <path d="${PIN_D}" fill="${C.green}" transform="scale(1.15)"/>
          <circle cx="0" cy="-35.6" r="14" fill="#fff"/>
          ${icoG('person', -10, -46, 0.833, C.green, 2.6)}</g>`, 's3-opin');
      // Point qui suit l'itinéraire
      const walker = addOvl(-17.448, 14.6935, `<g class="s3-walk"><circle r="13" fill="${C.green}" opacity=".25"/><circle r="8" fill="#fff"/><circle r="5.5" fill="${C.green}"/></g>`, 's3-walkw');

      /* Itinéraire Colobane → Sandaga (avenue Blaise-Diagne, en coordonnées carte) */
      const routeD = `M${r1(cx0)} ${r1(cy0)} C${r1(cx0 + 10)} ${r1(cy0 + 14)} ${r1(cx0 + 3)} ${r1(cy0 + 30)} ${r1(cx0 + 16)} ${r1(cy0 + 44)} S${r1(sx0 - 6)} ${r1(sy0 - 18)} ${r1(sx0)} ${r1(sy0)}`;
      const routeEls = qa('.s3-route, .s3-route-bg, .s3-route-rev');
      routeEls.forEach((p) => p.setAttribute('d', routeD));
      const routeRev = q('.s3-route-rev');
      const routeLen = routeRev.getTotalLength();

      /* ---------- Caméra de la carte (fonction pure du temps) ---------- */
      const camG = q('.s3-cam');
      const CAM0 = { z: 0.98, fx: 300, fy: 512, sx: 286, sy: 472 };
      const CAM1 = { z: 1.16, fx: 312, fy: 520, sx: 286, sy: 466 };
      const CAM2 = { z: 2.5, fx: (cx0 + sx0) / 2 - 6, fy: (cy0 + sy0) / 2, sx: 286, sy: 318 };
      const CAM3 = { z: 2.85, fx: (cx0 + sx0) / 2 - 4, fy: (cy0 + sy0) / 2, sx: 286, sy: 415 };
      const CAM4 = { z: 3.0, fx: (cx0 + sx0) / 2 - 2, fy: (cy0 + sy0) / 2 + 2, sx: 286, sy: 415 };
      const camAt = (t) => {
        const a = seg(t, 2.8, 5.0, 'sine.inOut');
        let c = {};
        for (const k in CAM0) c[k] = lerp(CAM0[k], CAM1[k], a);
        const b = seg(t, 5.0, 5.85, 'fekk.swift');
        for (const k in CAM0) c[k] = lerp(c[k], CAM2[k], b);
        const d = seg(t, 6.78, 7.3, 'fekk.swift');
        for (const k in CAM0) c[k] = lerp(c[k], CAM3[k], d);
        const e = seg(t, 7.3, 8.0, 'sine.inOut');
        for (const k in CAM0) c[k] = lerp(c[k], CAM4[k], e);
        return c;
      };
      const applyCam = (c) => {
        camG.setAttribute('transform', `translate(${(c.sx - c.fx * c.z).toFixed(2)} ${(c.sy - c.fy * c.z).toFixed(2)}) scale(${c.z.toFixed(4)})`);
        for (const o of overlay) {
          const x = c.sx + (o.x - c.fx) * c.z, y = c.sy + (o.y - c.fy) * c.z;
          o.el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        }
      };

      /* ================= ÉLÉMENTS AVANT-PLAN ================= */
      const decoFront = FEKK.el(`<svg class="s3-svgfull s3-decoF" viewBox="0 0 1080 1920">
        <g class="s3-d s3-f1" transform="translate(214 1420)"><g class="s3-dd"><circle r="38" fill="#0B1210" opacity=".25" transform="translate(8 10)"/><circle r="38" fill="${C.yellow}"/><circle r="38" fill="none" stroke="${C.sunset}" stroke-width="6" stroke-dasharray="1 13" stroke-linecap="round" transform="scale(.62)"/></g></g>
        <g class="s3-d s3-f2" transform="translate(878 1060)"><g class="s3-dd" transform="rotate(-20)"><path d="${zig(4, 110, 30)}" transform="translate(-55 -15) translate(7 9)" fill="none" stroke="#0B1210" stroke-opacity=".25" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="${zig(4, 110, 30)}" transform="translate(-55 -15)" fill="none" stroke="${C.sand}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g></g>
        <g class="s3-d s3-f3" transform="translate(196 1420)"><g class="s3-dd"><path d="M-10 -34h20v24h24v20h-24v24h-20v-24h-24v-20h24z" fill="#0B1210" opacity=".25" transform="translate(7 9)"/><path d="M-10 -34h20v24h24v20h-24v24h-20v-24h-24v-20h24z" fill="${C.mint}"/></g></g>
      </svg>`);
      root.appendChild(decoFront);

      // Gerbe de confettis au moment du match
      const rng = FEKK.rng(3812);
      const burstCols = [C.yellow, C.mint, C.red, '#fff', C.sand];
      let burstHtml = '';
      const parts = [];
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (rng() - 0.5) * Math.PI * 1.35;
        const d = 260 + rng() * 300;
        const kind = i % 3;
        const s = 10 + rng() * 14;
        const col = burstCols[i % burstCols.length];
        const shape = kind === 0 ? `<circle r="${s / 2}" fill="${col}"/>` : kind === 1 ? `<rect x="${-s / 2}" y="${-s / 4}" width="${s}" height="${s / 2}" rx="2" fill="${col}"/>` : `<path d="M0 ${-s / 1.6}L${s / 1.6} ${s / 2.4}H${-s / 1.6}Z" fill="${col}"/>`;
        burstHtml += `<g class="s3-bp" transform="translate(540 560)"><g class="s3-bpi">${shape}</g></g>`;
        parts.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.8, rot: (rng() - 0.5) * 720, delay: rng() * 0.08 });
      }
      const burst = FEKK.el(`<svg class="s3-svgfull s3-burst" viewBox="0 0 1080 1920">${burstHtml}</svg>`);
      root.appendChild(burst);

      /* Main stylisée (peau foncée, manche wax) — pointe de l'index en (62,12) */
      const SK = '#8A5634', SKD = '#6E3F24', SKL = '#A9714A';
      const hand = FEKK.el(`<svg class="s3-hand" viewBox="0 0 300 560" style="overflow:visible">
        <defs>
          <pattern id="s3-waxcloth" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <rect width="44" height="44" fill="${C.yellow}"/><path d="M0 22 L11 0 L22 22Z M22 44 L33 22 L44 44Z" fill="${C.green}"/><circle cx="33" cy="9" r="5" fill="${C.red}"/><circle cx="11" cy="33" r="5" fill="#0B1210"/>
          </pattern>
          <filter id="s3-sil" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="#0B1210" flood-opacity=".3"/><feComposite in2="SourceAlpha" operator="in"/></filter>
        </defs>
        <use href="#s3-hand-art" filter="url(#s3-sil)" transform="translate(22 26)"/>
        <g id="s3-hand-art">
          <path d="M70 438 L262 404 L300 600 L40 600 Z" fill="url(#s3-waxcloth)"/>
          <path d="M66 434 L262 400 L268 430 L72 464 Z" fill="${C.green}"/>
          <path d="M84 330 L226 318 L250 412 L74 444 Z" fill="${SKD}"/>
          <rect x="34" y="168" width="216" height="214" rx="74" fill="${SK}"/>
          <path d="M210 196 Q250 210 250 260 L250 312 Q248 360 212 376 Z" fill="${SKD}" opacity=".55"/>
          <rect x="86" y="132" width="56" height="94" rx="28" fill="${SK}"/>
          <rect x="136" y="146" width="54" height="88" rx="27" fill="${SK}"/>
          <rect x="184" y="166" width="50" height="78" rx="25" fill="${SK}"/>
          <path d="M139 162 v54 M187 182 v48" stroke="${SKD}" stroke-width="4" stroke-linecap="round"/>
          <path d="M98 146 q16 -8 32 0 M148 160 q15 -7 30 0 M195 180 q13 -6 27 0" stroke="${SKL}" stroke-width="5" stroke-linecap="round" fill="none"/>
          <rect x="36" y="6" width="56" height="236" rx="28" fill="${SK}"/>
          <rect x="44" y="34" width="10" height="170" rx="5" fill="${SKL}"/>
          <rect x="48" y="14" width="32" height="40" rx="15" fill="#D9A98C"/>
          <rect x="53" y="18" width="10" height="20" rx="5" fill="#EBC6AE"/>
          <path d="M50 112 q14 7 28 0 M50 168 q14 7 28 0" stroke="${SKD}" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M42 262 C10 252 0 214 22 196 C42 180 74 200 102 228 C116 244 98 266 80 266 Z" fill="${SKD}"/>
          <path d="M30 206 C46 200 66 212 84 228" stroke="${SKL}" stroke-width="5" stroke-linecap="round" fill="none"/>
        </g>
      </svg>`);
      phone.querySelector('.s3-phone-cam').appendChild(hand);

      const sandFull = FEKK.el('<div class="s3-sandfull"></div>');
      root.appendChild(sandFull);

      /* ================= TIMELINE ================= */
      const pExit = q('.s3-phone-exit'), pEnter = q('.s3-phone-enter'), pShake = q('.s3-phone-shake'), pTilt = q('.s3-phone-tilt');
      tl.set({}, {}, 8.5);

      // ---- 0.00–0.80 : entrée du téléphone ----
      gsap.set(pTilt, { transformPerspective: 2600, transformOrigin: '50% 50%' });
      tl.fromTo(pEnter, { y: 1560, rotation: 9 }, { y: 0, duration: 0.78, ease: 'back.out(1.25)' }, 0.0);
      tl.to(pEnter, { rotation: 0, duration: 0.95, ease: 'elastic.out(1, 0.55)' }, 0.18);
      tl.fromTo(pTilt, { rotationX: 34, rotationY: 16 }, { rotationX: 4, rotationY: -7, duration: 1.0, ease: 'fekk.snap' }, 0.05);
      // respiration / dérive continue
      tl.to(pTilt, { rotationX: 2, rotationY: -3, duration: 2.0, ease: 'sine.inOut' }, 1.05);
      tl.to(pTilt, { rotationX: 3.5, rotationY: 5, duration: 2.2, ease: 'sine.inOut' }, 3.05);
      tl.to(pTilt, { rotationX: 1.5, rotationY: -4, duration: 2.75, ease: 'sine.inOut' }, 5.25);
      tl.fromTo(pShake, { y: 0 }, { y: -10, duration: 1.1, ease: 'sine.inOut', repeat: 6, yoyo: true }, 0.9);

      // Anneaux de fond + formes wax
      tl.fromTo('.s3-rings', { scale: 0.6, opacity: 0, transformOrigin: '540px 1080px' }, { scale: 1, opacity: 1, duration: 0.9, ease: 'fekk.snap' }, 0.0);
      tl.fromTo('.s3-ringB', { rotation: 0, svgOrigin: '540 1080' }, { rotation: 40, duration: 8.5, ease: 'none' }, 0);
      tl.fromTo('.s3-ringC', { rotation: 0, svgOrigin: '540 1080' }, { rotation: -22, duration: 8.5, ease: 'none' }, 0);
      tl.fromTo('.s3-ringD', { rotation: 0, svgOrigin: '540 1080' }, { rotation: 18, duration: 8.5, ease: 'none' }, 0);
      const backD = qa('.s3-decoB .s3-dd'), frontD = qa('.s3-decoF .s3-dd');
      [...backD, ...frontD].forEach((d, i) => {
        tl.fromTo(d, { scale: 0, rotation: -90 + (i % 3) * 60, transformOrigin: '50% 50%' },
          { scale: 1, rotation: '+=' + (90 - (i % 3) * 60), duration: 0.7, ease: 'back.out(1.8)' }, 0.12 + i * 0.045);
      });
      // Parallaxe : dérive verticale, plus rapide pour l'avant-plan
      qa('.s3-decoB .s3-d').forEach((d, i) => tl.to(d, { y: '-=' + (60 + (i % 3) * 25), x: (i % 2 ? '+=12' : '-=12'), duration: 8.0, ease: 'none' }, 0.2));
      qa('.s3-decoF .s3-d').forEach((d, i) => tl.to(d, { y: '-=' + (150 + i * 30), x: (i % 2 ? '-=20' : '+=20'), duration: 8.0, ease: 'none' }, 0.2));
      qa('.s3-decoB .s3-dd, .s3-decoF .s3-dd').forEach((d, i) => tl.to(d, { rotation: '+=' + (i % 2 ? 24 : -24), duration: 7.2, ease: 'sine.inOut' }, 0.85));

      // ---- Splash ----
      const sp = { s: 0, ls: 0, y: 0, rot: -14, fade: 1 };
      const hole = q('.s3-hole'), slogo = q('.s3-slogo'), slogoArt = qa('.s3-slogo > *');
      const spApply = () => {
        const tr = (k) => `translate(286 ${(500 + sp.y).toFixed(2)}) rotate(${sp.rot.toFixed(2)}) scale(${k.toFixed(4)}) translate(-56 -52)`;
        hole.setAttribute('transform', tr(sp.s * 0.97));
        slogo.setAttribute('transform', tr(Math.max(sp.ls, 0.0001)));
        slogo.setAttribute('opacity', sp.fade.toFixed(3));
      };
      spApply();
      tl.fromTo(sp, { ls: 0, s: 0, rot: -14 }, { ls: 1.45, s: 1.45, rot: 0, duration: 0.42, ease: 'fekk.land', onUpdate: spApply, immediateRender: false }, 0.12);
      gsap.set('.s3-slogo-ring', { drawSVG: '0%' });
      tl.fromTo('.s3-slogo-ring', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, 0.26);
      tl.fromTo('.s3-slogo-dot', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 0.42);
      tl.fromTo('.s3-slogo-handle', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.3);
      const swc = qa('.s3-sword span');
      tl.fromTo(swc, { yPercent: 80, opacity: 0, rotation: 10 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.32, ease: 'back.out(2.2)', stagger: 0.04 }, 0.34);
      // anticipation puis zoom-through
      tl.to(swc, { yPercent: -40, opacity: 0, duration: 0.14, ease: 'power2.in', stagger: 0.02 }, 0.66);
      tl.to(sp, { ls: 1.25, s: 1.25, y: 14, duration: 0.12, ease: 'power2.out', onUpdate: spApply }, 0.68);
      tl.to(sp, { ls: 34, s: 34, y: 0, duration: 0.32, ease: 'power3.in', onUpdate: spApply }, 0.8);
      tl.to(sp, { fade: 0, duration: 0.08, ease: 'none', onUpdate: spApply }, 0.84);
      tl.set(splash, { display: 'none' }, 1.13);
      tl.fromTo(declare, { scale: 1.14, transformOrigin: '50% 44%' }, { scale: 1, duration: 0.55, ease: 'fekk.snap' }, 0.86);

      // ---- Barre d'étapes + titres ----
      const splitT = (sel) => new SplitText(q(sel), { type: 'words,chars' });
      const T1 = splitT('.s3-ti1'), T2 = splitT('.s3-ti2'), T3 = splitT('.s3-ti3');
      const titleIn = (T, at) => {
        tl.fromTo(T.chars, { yPercent: 120, rotation: 14, opacity: 0, scale: 0.7, transformOrigin: '50% 100%' },
          { yPercent: 0, rotation: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(2.2)', stagger: 0.022 }, at);
      };
      const titleOut = (T, at) => {
        tl.to(T.chars, { yPercent: -110, rotation: -10, opacity: 0, duration: 0.22, ease: 'power2.in', stagger: 0.012 }, at);
      };
      titleIn(T1, 0.86); titleOut(T1, 2.72);
      titleIn(T2, 2.92); titleOut(T2, 4.86);
      titleIn(T3, 5.2); titleOut(T3, 7.98);

      // ---- 0.80–2.80 : Déclarer ----
      const chipSel = q('.s3-chip-sel'), chip0 = q('.s3-chip0');
      tl.to(chip0, { scale: 0.9, duration: 0.07, ease: 'power2.in' }, 1.0);
      tl.fromTo(chipSel, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, 1.02);
      tl.to(chip0, { scale: 1, duration: 0.35, ease: 'elastic.out(1.2, 0.5)' }, 1.07);
      qa('.s3-chip1, .s3-chip2, .s3-chip3').forEach((c, i) => tl.to(c, { x: 8, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' }, 1.05 + i * 0.03));

      const focus = q('.s3-focus');
      const F = [[348, 108], [502, 88], [636, 88]];
      tl.fromTo(focus, { top: F[0][0], height: F[0][1], opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out' }, 1.08);
      tl.to(focus, { top: F[1][0], height: F[1][1], duration: 0.2, ease: 'fekk.swift' }, 1.56);
      tl.to(focus, { top: F[2][0], height: F[2][1], duration: 0.2, ease: 'fekk.swift' }, 1.96);
      tl.to(focus, { opacity: 0, duration: 0.15 }, 2.26);
      const photo = q('.s3-photo');
      tl.fromTo(photo, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.4)' }, 1.46);
      // Placeholders disparaissent au début de la frappe
      const fields = qa('.s3-declare .s3-field');
      const TYPE = [
        { str: 'Samsung noir, coque bleue', a: 1.12, b: 1.48, focus: [1.08, 1.56] },
        { str: 'Colobane, arrêt des cars rapides', a: 1.6, b: 1.97, focus: [1.56, 1.96] },
        { str: 'Aujourd’hui, 18h47', a: 2.02, b: 2.24, focus: [1.96, 2.3] },
      ];
      TYPE.forEach((ty, i) => {
        ty.el = fields[i].querySelector('.s3-typed');
        ty.caret = fields[i].querySelector('.s3-caret');
        ty.ph = fields[i].querySelector('.s3-ph');
        tl.to(fields[i], { scale: 1.015, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.out' }, ty.b);
      });
      // Interrupteur « Alerter la communauté »
      tl.to('.s3-tog', { backgroundColor: C.green, duration: 0.18 }, 2.08);
      tl.fromTo('.s3-tog i', { x: 0, scaleX: 1 }, { x: 26, duration: 0.24, ease: 'back.out(2)' }, 2.08);
      tl.to('.s3-tog i', { scaleX: 1.25, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 2.08);

      // Main : entrée, tap, sortie. Pointe de l'index = (62,12) du SVG.
      // Coordonnées locales au téléphone (la main vit dans le wrapper caméra) : centre de « Publier ».
      const TAPX = 330, TAPY = 922;
      gsap.set(hand, { left: TAPX - 62, top: TAPY - 12, transformOrigin: '62px 12px' });
      tl.fromTo(hand, { x: 330, y: 620, rotation: -6, scale: 1.05 }, { x: 0, y: 0, rotation: -22, duration: 0.3, ease: 'power3.out' }, 2.0);
      tl.to(hand, { scale: 0.93, y: 8, duration: 0.07, ease: 'power2.in' }, 2.28);
      tl.to(hand, { scale: 1, y: -6, duration: 0.14, ease: 'power2.out' }, 2.35);
      tl.to(hand, { x: 300, y: 700, rotation: -8, duration: 0.34, ease: 'power3.in' }, 2.47);
      const pub = q('.s3-pub'), pubLbl = q('.s3-pub-lbl'), ripple = q('.s3-ripple');
      gsap.set(ripple, { left: TAPX - 14, top: 46 });
      tl.to(pub, { scale: 0.96, duration: 0.07, ease: 'power2.in' }, 2.28);
      tl.to(pub, { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.45)' }, 2.35);
      tl.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 8, opacity: 0, duration: 0.42, ease: 'power2.out' }, 2.3);
      tl.to(pubLbl, { scale: 0.6, opacity: 0, duration: 0.14, ease: 'power2.in' }, 2.38);
      tl.to(pub, { left: 240, width: 92, backgroundColor: C.mint, boxShadow: '0 7px 0 #17A35A', duration: 0.26, ease: 'fekk.swift' }, 2.4);
      gsap.set('.s3-pub-ck', { drawSVG: '0%' });
      tl.fromTo('.s3-pub-ck', { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.18, ease: 'power2.out' }, 2.58);
      tl.to(pub, { scale: 1.12, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out' }, 2.6);
      tl.to('.s3-legal', { opacity: 0, duration: 0.15 }, 2.4);

      // ---- 2.80 : transition d'écran (slide + scale) ----
      tl.fromTo(mapScr, { xPercent: 100, scale: 1 }, { xPercent: 0, duration: 0.42, ease: 'fekk.swift' }, 2.8);
      tl.fromTo(declare, { xPercent: 0, filter: 'brightness(1)' }, { xPercent: -30, scale: 0.94, filter: 'brightness(0.86)', duration: 0.42, ease: 'fekk.swift', immediateRender: false }, 2.8);
      tl.set(declare, { display: 'none' }, 3.25);
      // Feuille, recherche, filtres
      const sheet = q('.s3-sheet');
      tl.fromTo(sheet, { y: 1192 }, { y: 1192, duration: 0.01 }, 0);
      tl.to(sheet, { y: 740, duration: 0.45, ease: 'back.out(1.3)' }, 3.0);
      tl.fromTo('.s3-search', { y: -140 }, { y: 0, duration: 0.4, ease: 'back.out(1.6)' }, 3.0);
      tl.fromTo('.s3-fchip', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.04 }, 3.1);
      tl.fromTo('.s3-blk-match, .s3-blk-relay', { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
      // libellés de quartiers en stagger
      qa('.s3-lab').forEach((l, i) => tl.fromTo(l, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 3.05 + i * 0.04));
      // Épingle propriétaire
      const pinDrop = (el, at, dur = 0.42) => tl.fromTo(el, { y: -70, scaleX: 0.6, scaleY: 1.5, opacity: 0, transformOrigin: '50% 100%' },
        { y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: dur, ease: 'fekk.land' }, at);
      pinDrop(ownerPin, 3.02);
      tl.to(ownerPin, { scaleX: 1.25, scaleY: 0.75, duration: 0.07, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, 3.3);
      // Radar : 4 pulsations depuis Colobane (r en unités carte)
      qa('.s3-rad').forEach((c, i) => {
        tl.fromTo(c, { attr: { r: 6 }, opacity: 0.95 }, { attr: { r: 210 }, opacity: 0, duration: 1.3, ease: 'power1.out' }, 3.0 + i * 0.5);
      });
      // Épingles « objet trouvé » en stagger
      foundPins.forEach((p, i) => pinDrop(p, 3.3 + i * 0.16, 0.38));
      pinDrop(relayPin, 3.3 + 3.5 * 0.16 + 0.04, 0.4);
      tl.fromTo(relayTag, { opacity: 0, scale: 0.4, transformOrigin: '0% 50%' }, { opacity: 0, scale: 0.4, duration: 0.01 }, 0);
      tl.fromTo(walker, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
      // Avatars de la communauté
      qa('.s3-avs > div').forEach((a, i) => tl.to(a, { scale: 1, duration: 0.3, ease: 'back.out(2.6)' }, 3.3 + i * 0.12));
      // points « recherche en cours »
      qa('.s3-spill .s3-dot3').forEach((d, i) => tl.fromTo(d, { y: 0 }, { y: -6, duration: 0.18, ease: 'sine.out', yoyo: true, repeat: 5, repeatDelay: 0.12 }, 3.2 + i * 0.08));
      tl.to('.s3-rings', { scale: 1.05, duration: 0.25, yoyo: true, repeat: 3, repeatDelay: 0.3, ease: 'sine.out' }, 3.0);

      // ---- 5.00 : notification + vibration + match ----
      tl.fromTo(notif, { y: -300 }, { y: 0, duration: 0.5, ease: 'fekk.land' }, 5.0);
      tl.to(pShake, { keyframes: { x: [0, -14, 13, -12, 11, -8, 7, -4, 0], rotation: [0, -1.4, 1.3, -1.1, 1, -0.7, 0.5, -0.2, 0] }, duration: 0.42, ease: 'none' }, 5.02);
      tl.fromTo('.s3-vibL, .s3-vibR', { opacity: 0, scale: 0.7, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.08, yoyo: true, repeat: 3, ease: 'none' }, 5.02);
      tl.set('.s3-vibL, .s3-vibR', { opacity: 0 }, 5.4);
      qa('.s3-bp').forEach((b, i) => {
        const pp = parts[i];
        const inner = b.firstElementChild;
        tl.fromTo(b, { x: 0, y: 0, opacity: 0 }, { x: pp.dx, y: pp.dy, opacity: 1, duration: 0.7, ease: 'power3.out' }, 5.0 + pp.delay);
        tl.to(b, { y: '+=120', opacity: 0, duration: 0.45, ease: 'power1.in' }, 5.55 + pp.delay);
        tl.fromTo(inner, { rotation: 0, scale: 0.4, transformOrigin: '50% 50%' }, { rotation: pp.rot, scale: 1, duration: 1.0, ease: 'power2.out' }, 5.0 + pp.delay);
      });
      // Point relais mis en valeur
      tl.to(relayPin, { scale: 1.45, duration: 0.4, ease: 'back.out(3)', transformOrigin: '50% 100%' }, 5.15);
      tl.to(qa('.s3-fpin'), { opacity: 0.35, duration: 0.3 }, 5.1);
      tl.to('.s3-lab', { opacity: 0.85, duration: 0.3 }, 5.1);
      [5.25, 5.85, 6.45, 7.05, 7.65].forEach((at) => tl.fromTo('.s3-relay-halo', { attr: { r: 14 }, opacity: 0.85 }, { attr: { r: 44 }, opacity: 0, duration: 0.6, ease: 'power1.out' }, at));
      // Feuille → carte de match
      tl.to(sheet, { y: 470, duration: 0.45, ease: 'back.out(1.15)' }, 5.3);
      tl.to('.s3-blk-search', { opacity: 0, y: 30, duration: 0.18 }, 5.3);
      tl.set('.s3-blk-search', { display: 'none' }, 5.5);
      tl.to('.s3-blk-match', { opacity: 1, duration: 0.15 }, 5.38);
      tl.fromTo('.s3-blk-match .s3-row', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 5.38);
      tl.fromTo('.s3-thumbL', { x: -260, rotation: -14 }, { x: 0, rotation: -3, duration: 0.5, ease: 'back.out(1.5)' }, 5.42);
      tl.fromTo('.s3-thumbR', { x: 260, rotation: 14 }, { x: 0, rotation: 3, duration: 0.5, ease: 'back.out(1.5)' }, 5.48);
      tl.fromTo('.s3-gauge', { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.42, ease: 'back.out(2)' }, 5.5);
      tl.to('.s3-gauge', { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.out' }, 5.95);
      tl.fromTo('.s3-mchip', { y: 24, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)', stagger: 0.07 }, 6.0);
      tl.to('.s3-thumbL', { y: -6, duration: 0.38, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 5.95);
      tl.to('.s3-thumbR', { y: -6, duration: 0.36, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 6.0);
      // Notification remonte
      tl.to(notif, { y: -320, duration: 0.3, ease: 'fekk.anticip' }, 6.45);

      // ---- 6.40–8.00 : itinéraire + récupération ----
      // 94 % tenu jusqu'à 6.75 ; la feuille se replie pendant que le contenu relais monte en stagger
      // (chevauchement avec la sortie : aucune frame de carte vide).
      tl.to(qa('.s3-blk-match > *'), { opacity: 0, y: -18, duration: 0.12, ease: 'power2.in', stagger: 0.015 }, 6.75);
      tl.set('.s3-blk-match', { display: 'none' }, 7.0);
      tl.to(sheet, { y: 570, duration: 0.42, ease: 'back.out(1.2)' }, 6.78);
      tl.to('.s3-blk-relay', { opacity: 1, duration: 0.01 }, 6.86);
      tl.fromTo('.s3-blk-relay .s3-row', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 6.87);
      tl.fromTo('.s3-badge', { y: 20, scale: 0.85, opacity: 0, rotation: -3 }, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.2)' }, 6.92);
      tl.fromTo('.s3-cta', { y: 20, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.36, ease: 'back.out(1.8)' }, 7.0);
      const CTA_PULSES = [7.35, 7.8];
      CTA_PULSES.forEach((at) => tl.to('.s3-cta', { scale: 1.045, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' }, at));
      tl.to(relayTag, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)' }, 5.3);
      tl.to(labelEls[8].parentNode, { opacity: 0, duration: 0.12 }, 5.15);
      tl.to(walker, { opacity: 1, duration: 0.15 }, 7.3);

      // ---- 8.00–8.50 : sortie vers sand ----
      tl.to(pExit, { y: -40, rotation: 3, duration: 0.1, ease: 'power2.out' }, 8.0);
      tl.to(pExit, { y: 1850, rotation: -30, scale: 1.3, duration: 0.32, ease: 'power2.in' }, 8.07);
      tl.to(pTilt, { rotationX: 38, rotationY: -18, duration: 0.4, ease: 'power2.in', overwrite: false }, 8.02);
      tl.fromTo(wipe, { y: -2420 }, { y: -170, duration: 0.42, ease: 'fekk.swift' }, 8.02);
      tl.to(qa('.s3-decoF .s3-d'), { y: '+=1300', duration: 0.34, ease: 'power2.in' }, 8.02);
      tl.set(sandFull, { opacity: 1 }, 8.46);

      /* ================= ÉTATS PURS DU TEMPS (onFrame) ================= */
      const clock = q('.s3-clock'), cnt = q('.s3-cnt'), gnum = q('.s3-gnum'), garc = q('.s3-garc');
      const GC = 2 * Math.PI * 66;
      const walkEl = walker;
      const pad = (n) => String(n).padStart(2, '0');
      const ctaRing = q('.s3-cta-ring'), gglow = q('.s3-gglow');
      const pCam = q('.s3-phone-cam'), titlesEl = titles;
      const decoBEl = q('.s3-decoB'), decoFEl = q('.s3-decoF');
      gsap.set([decoBEl, decoFEl], { transformOrigin: '540px 1080px' });

      /* Caméra de la maquette (fonction pure du temps). s = échelle, top = y du haut de la maquette
       * dans le cadre. La maquette reste centrée en x. Au repos : 1.12, haut à 470 (sous les titres).
       * Pendant les push-ins, les titres (calque non zoomé) montent de LIFT px et se réduisent,
       * et le haut de la maquette ne dépasse jamais 470 - lift. */
      const LIFT = 110, REST = { s: 1.12, top: 470 };
      const CAMK = [
        // [début, fin, cible, ease]
        [0.95, 1.3, { s: 1.36, top: 400 }, 'power2.inOut'],   // champs Description / Lieu / Date
        [1.3, 1.95, { s: 1.4, top: 368 }, 'sine.inOut'],      // suit le focus vers le bas
        [1.95, 2.22, { s: 1.2, top: 412 }, 'power2.inOut'],   // dézoom pour le tap sur Publier
        [2.5, 2.85, REST, 'power2.inOut'],                    // retour avant la navigation
        [3.4, 4.95, { s: 1.16, top: 462 }, 'sine.inOut'],     // lente poussée sur la carte
        [5.0, 5.35, { s: 1.38, top: 462 }, 'power3.out'],     // notification
        [5.4, 5.9, { s: 1.3, top: 352 }, 'power2.inOut'],     // glisse vers la jauge / carte de match
        [5.9, 6.75, { s: 1.32, top: 352 }, 'sine.inOut'],
        [6.75, 7.2, { s: 1.36, top: 352 }, 'power2.inOut'],   // point relais + code
        [7.2, 8.0, { s: 1.38, top: 352 }, 'sine.inOut'],      // lente dérive
      ];
      const camPhone = (t) => {
        let c = { s: REST.s, top: REST.top };
        for (const [a, b, k, ease] of CAMK) {
          const p = seg(t, a, b, ease);
          if (p <= 0) break;
          c = { s: lerp(c.s, k.s, p), top: lerp(c.top, k.top, p) };
        }
        return c;
      };
      const liftAt = (t) => LIFT * (seg(t, 0.9, 1.25, 'power2.inOut') - seg(t, 2.5, 2.85, 'power2.inOut') + seg(t, 5.2, 5.55, 'power2.inOut'));
      const pulse = (t, starts, dur) => { for (const a of starts) { if (t >= a && t < a + dur) return (t - a) / dur; } return -1; };
      frame = (t) => {
        // Caméra maquette + titres + parallaxe des formes wax
        const lift = liftAt(t);
        const cp = camPhone(t);
        const top = Math.max(cp.top, 470 - lift);
        pCam.style.transform = `translate(${(300 - 300 * cp.s).toFixed(2)}px, ${(top - 470).toFixed(2)}px) scale(${cp.s.toFixed(4)})`;
        titlesEl.style.transform = `translateY(${(-lift).toFixed(2)}px) scale(${(1 - 0.12 * lift / LIFT).toFixed(4)})`;
        const zr = cp.s / REST.s - 1;
        decoBEl.style.transform = `scale(${(1 + 0.3 * zr).toFixed(4)})`;
        decoFEl.style.transform = `scale(${(1 + 1.6 * zr).toFixed(4)})`;
        // Anneau du CTA et halo de la jauge (pulsations)
        const rp0 = pulse(t, CTA_PULSES, 0.5);
        ctaRing.style.opacity = rp0 < 0 ? 0 : (0.9 * (1 - E('power1.out')(rp0))).toFixed(3);
        ctaRing.style.transform = `scale(${rp0 < 0 ? 1 : (1 + 0.16 * E('power1.out')(rp0)).toFixed(4)})`;
        const gp = pulse(t, [5.95], 0.55);
        gglow.style.opacity = gp < 0 ? 0 : (0.95 * (1 - E('power2.out')(gp))).toFixed(3);
        gglow.style.transform = `scale(${gp < 0 ? 1 : (1 + 0.45 * E('power2.out')(gp)).toFixed(4)})`;
        // Frappe des champs + curseur
        for (const ty of TYPE) {
          const p = seg(t, ty.a, ty.b);
          const n = Math.round(p * ty.str.length);
          const s = ty.str.slice(0, n);
          if (ty.el.textContent !== s) ty.el.textContent = s;
          ty.ph.style.opacity = t >= ty.a ? 0 : 1;
          const focused = t >= ty.focus[0] && t < ty.focus[1];
          const typing = t >= ty.a && t < ty.b + 0.05;
          ty.caret.style.opacity = focused && (typing || ((t * 2.2) % 1) < 0.55) ? 1 : 0;
        }
        // Horloge de la barre d'état : le temps passe pendant la recherche
        const m0 = 18 * 60 + 52, m1 = 19 * 60 + 41;
        const m = Math.round(lerp(m0, m1, seg(t, 3.15, 4.9, 'power1.inOut')));
        clock.textContent = `${Math.floor(m / 60)}:${pad(m % 60)}`;
        // Compteur de voisins alertés
        const nb = Math.round(1248 * seg(t, 3.05, 4.75, 'power2.out'));
        cnt.textContent = nb >= 1000 ? `${Math.floor(nb / 1000)} ${String(nb % 1000).padStart(3, '0')}` : String(nb);
        // Jauge 94 %
        const g = seg(t, 5.58, 5.95, 'power3.out') * 0.94;
        gnum.textContent = String(Math.round(g * 100));
        garc.setAttribute('stroke-dasharray', `${(g * GC).toFixed(2)} 1000`);
        // Caméra + overlay
        applyCam(camAt(t));
        // Itinéraire (révélé par masque) + marcheur
        const rp = seg(t, 6.85, 7.6, 'power2.inOut');
        routeRev.setAttribute('stroke-dasharray', `${(rp * routeLen).toFixed(2)} ${routeLen + 10}`);
        q('.s3-route').setAttribute('stroke-dashoffset', (-(t * 9)).toFixed(2));
        const wp = seg(t, 7.3, 8.0, 'sine.inOut') * 0.92;
        const pt = routeRev.getPointAtLength(wp * routeLen);
        const c = camAt(t);
        const wx = c.sx + (pt.x - c.fx) * c.z, wy = c.sy + (pt.y - c.fy) * c.z;
        walkEl.parentNode.setAttribute('transform', `translate(${wx.toFixed(2)} ${wy.toFixed(2)})`);
      };
      frame(0);
    },
  });
})();
