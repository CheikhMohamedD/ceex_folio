import type { jsPDF as JsPdf } from "jspdf";
import { FRAMING_FIELDS, type FramingField, type FramingValues } from "@/lib/cheikh/framing";
import { GATE_QUESTIONS, reached, type GateAnswer, type Verdict } from "@/lib/cheikh/gate";
import { toWinAnsi } from "./brief";

/**
 * Le dossier de cadrage de Cheikh 2.0, repris de l'outil d'origine : sept pages
 * (couverture, carte de la demande, parcours, sas, contexte, plan, prompt), dessinées
 * avec jsPDF dans le navigateur. Même moteur que le brief client (brief.ts), aux
 * couleurs du design system « Dossier ». L'outil n'existe qu'en français : les textes
 * fixes du dossier sont ici, ceux de la page arrivent par les messages.
 */
export type FramingPdfData = {
  values: FramingValues;
  gateName: string | null;
  answers: readonly GateAnswer[];
  verdict: Verdict;
  prompt: string;
  /** Date d'export, déjà écrite (« 17 octobre 2026 »). */
  date: string;
  tasks: ReadonlyArray<{ label: string; done: boolean }>;
  copy: {
    /** Nom court de chaque champ (Quoi, Pourquoi…). */
    fields: Record<FramingField, string>;
    questions: readonly string[];
    /** Titre et consigne de chaque verdict du sas. */
    verdicts: Record<Verdict, { title: string; text: string }>;
    weeks: readonly string[];
  };
};

type Rgb = string;
const C = {
  accent: "#a8401f",
  accentSoft: "#f3e3da",
  accentPale: "#f0c9b8",
  ink: "#1a1a1a",
  muted: "#5a544a",
  line: "#d8d0c2",
  bg: "#f2eee6",
  white: "#fbf9f5",
  crit: "#b3261e",
  critSoft: "#f6dedc",
  warn: "#7a4f12",
  warnSoft: "#efe5d3",
  ok: "#2e6b4e",
  okSoft: "#dfece4",
} as const;

const P = { W: 210, H: 297, M: 16 } as const;

type TextOptions = {
  size?: number;
  style?: "normal" | "bold";
  face?: "helvetica" | "courier";
  color?: Rgb;
  align?: "left" | "right" | "center";
  w?: number;
};
type FitOptions = TextOptions & { min?: number; valign?: "top" | "middle" };

const VERDICT_COLORS: Record<Verdict, [Rgb, Rgb]> = {
  GO: [C.ok, C.okSoft],
  PARK: [C.warn, C.warnSoft],
  VALIDATE: [C.crit, C.critSoft],
  CUT: [C.crit, C.critSoft],
  NONE: [C.muted, C.bg],
};
/** L'issue de chaque « non », dans l'ordre des questions. */
const EXITS: readonly Verdict[] = ["PARK", "VALIDATE", "VALIDATE", "CUT"];

export function buildFramingPdf(data: FramingPdfData, JsPdfClass: typeof JsPdf): JsPdf {
  const doc = new JsPdfClass({ unit: "mm", format: "a4" });
  doc.setLineHeightFactor(1.3);
  const f = data.values;
  const names = data.copy.fields;
  const V = data.copy.verdicts;
  const score = FRAMING_FIELDS.filter((field) => f[field].trim() !== "").length;
  const quoi = f.goal || "Demande sans titre";

  const fill = (c: Rgb) => doc.setFillColor(c);
  const stroke = (c: Rgb) => doc.setDrawColor(c);
  const color = (c: Rgb) => doc.setTextColor(c);
  const font = (size: number, style: TextOptions["style"] = "normal", face = "helvetica") => {
    doc.setFont(face, style);
    doc.setFontSize(size);
  };
  const lh = (size: number) => size * 0.3528 * 1.3;

  function txt(s: string, x: number, y: number, o: TextOptions = {}): number {
    font(o.size ?? 10, o.style, o.face);
    color(o.color ?? C.ink);
    const lines: string[] = o.w
      ? (doc.splitTextToSize(toWinAnsi(s), o.w) as string[])
      : [toWinAnsi(s)];
    doc.text(lines, x, y, { align: o.align ?? "left", baseline: "top" });
    return lines.length * lh(o.size ?? 10);
  }

  /** Texte qui rétrécit jusqu'à tenir dans sa boîte, puis se coupe en « ... ». */
  function fit(s: string, x: number, y: number, w: number, h: number, o: FitOptions = {}): number {
    let size = o.size ?? 10;
    const min = o.min ?? 6.5;
    let lines: string[];
    for (;;) {
      font(size, o.style, o.face);
      lines = doc.splitTextToSize(toWinAnsi(s), w) as string[];
      if (lines.length * lh(size) <= h || size <= min) break;
      size -= 0.5;
    }
    const maxLines = Math.max(1, Math.floor(h / lh(size)));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = `${(lines[maxLines - 1] ?? "").replace(/\s*\S*$/, "")}...`;
    }
    const height = lines.length * lh(size);
    const top = o.valign === "middle" ? y + (h - height) / 2 : y;
    color(o.color ?? C.ink);
    doc.text(lines, o.align === "center" ? x + w / 2 : x, top, {
      align: o.align ?? "left",
      baseline: "top",
    });
    return height;
  }

  function rbox(x: number, y: number, w: number, h: number, fc?: Rgb, sc?: Rgb, r = 2.5, lw = 0.3) {
    doc.setLineWidth(lw);
    if (fc) fill(fc);
    if (sc) stroke(sc);
    doc.roundedRect(x, y, w, h, r, r, fc && sc ? "FD" : fc ? "F" : "S");
  }

  function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: Rgb = C.line,
    lw = 0.4,
    dash?: number[],
  ) {
    stroke(c);
    doc.setLineWidth(lw);
    if (dash) doc.setLineDashPattern(dash, 0);
    doc.line(x1, y1, x2, y2);
    if (dash) doc.setLineDashPattern([], 0);
  }

  function arrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: Rgb = C.line,
    lw = 0.4,
    dash?: number[],
  ) {
    line(x1, y1, x2, y2, c, lw, dash);
    const a = Math.atan2(y2 - y1, x2 - x1);
    const L = 2.6;
    const s = 0.42;
    fill(c);
    doc.triangle(
      x2,
      y2,
      x2 - L * Math.cos(a - s),
      y2 - L * Math.sin(a - s),
      x2 - L * Math.cos(a + s),
      y2 - L * Math.sin(a + s),
      "F",
    );
  }

  function diamond(cx: number, cy: number, w: number, h: number, fc?: Rgb, sc?: Rgb, lw = 0.4) {
    if (fc) fill(fc);
    if (sc) stroke(sc);
    doc.setLineWidth(lw);
    doc.lines(
      [
        [w / 2, h / 2],
        [w / 2, -h / 2],
        [-w / 2, -h / 2],
        [-w / 2, h / 2],
      ],
      cx - w / 2,
      cy,
      [1, 1],
      fc && sc ? "FD" : fc ? "F" : "S",
      true,
    );
  }

  function center(s: string, x: number, y: number, o: TextOptions = {}) {
    font(o.size ?? 10, o.style, o.face);
    color(o.color ?? C.ink);
    doc.text(toWinAnsi(s), x, y, { align: "center", baseline: "middle" });
  }

  function header(eyebrow: string, title: string, intro?: string): number {
    fill(C.accent);
    doc.rect(0, 0, P.W, 4, "F");
    txt(eyebrow.toUpperCase(), P.M, 12, { size: 8, style: "bold", color: C.accent });
    txt(title, P.M, 17, { size: 19, style: "bold" });
    const h = intro ? txt(intro, P.M, 27.5, { size: 9.5, color: C.muted, w: P.W - 2 * P.M }) : 0;
    return 27.5 + h + 5;
  }

  function short(s: string, n: number): string {
    const clean = toWinAnsi(s);
    return clean.length > n ? `${clean.slice(0, n - 1).replace(/\s+\S*$/, "")}...` : clean;
  }

  // ── 1. Couverture ─────────────────────────────────────────────────────────────
  fill(C.accent);
  doc.rect(0, 0, P.W, 92, "F");
  txt("CHEIKH 2.0  ·  FICHE DE CADRAGE", P.M, 16, {
    size: 8.5,
    style: "bold",
    color: C.accentPale,
  });
  fit(quoi, P.M, 26, P.W - 2 * P.M, 42, { size: 25, min: 14, style: "bold", color: C.white });
  txt(`Dossier généré le ${data.date}`, P.M, 76, { size: 9.5, color: C.accentSoft });
  let y = 104;
  txt("Clarté de la demande", P.M, y, { size: 12, style: "bold" });
  txt(`${score} / 6 champs renseignés`, P.W - P.M, y + 0.8, {
    size: 9.5,
    color: score === 6 ? C.ok : C.crit,
    align: "right",
  });
  y += 9;
  const segW = (P.W - 2 * P.M - 10) / 6;
  FRAMING_FIELDS.forEach((field, i) => {
    const x = P.M + i * (segW + 2);
    const ok = f[field].trim() !== "";
    rbox(x, y, segW, 6, ok ? C.accent : C.bg, ok ? undefined : C.line, 1.5);
    fit(names[field], x, y + 8, segW, 8, {
      size: 7.5,
      color: ok ? C.ink : C.muted,
      align: "center",
    });
  });
  y += 24;
  txt("Verdict du sas des projets", P.M, y, { size: 12, style: "bold" });
  y += 8;
  const [verdictInk, verdictWash] = VERDICT_COLORS[data.verdict];
  rbox(P.M, y, P.W - 2 * P.M, 24, verdictWash, undefined, 3);
  txt(V[data.verdict].title, P.M + 6, y + 5, { size: 16, style: "bold", color: verdictInk });
  if (data.gateName) txt(short(data.gateName, 30), P.M + 6, y + 14, { size: 8.5, color: C.muted });
  fit(
    data.verdict === "NONE"
      ? "Le sas n'a pas été passé avant l'export. Réponds aux 4 questions sur la page pour inclure le verdict dans ce dossier."
      : V[data.verdict].text,
    P.M + 64,
    y + 5,
    P.W - 2 * P.M - 70,
    15,
    { size: 9.5 },
  );
  y += 34;
  txt("En un coup d'œil", P.M, y, { size: 12, style: "bold" });
  y += 8;
  const cw = (P.W - 2 * P.M - 8) / 3;
  (["audience", "context", "successCriterion"] as const).forEach((field, i) => {
    const x = P.M + i * (cw + 4);
    rbox(x, y, cw, 40, C.white, C.line, 2.5);
    txt(names[field].toUpperCase(), x + 4, y + 4, { size: 7, style: "bold", color: C.accent });
    fit(f[field] || "Non renseigné", x + 4, y + 10, cw - 8, 27, {
      size: 10,
      color: f[field] ? C.ink : C.muted,
    });
  });
  y += 50;
  txt("Dans ce dossier", P.M, y, { size: 12, style: "bold" });
  y += 9;
  const toc = [
    "Carte de la demande",
    "Le parcours de la demande",
    "Le sas des projets",
    "Contexte et vigilance",
    "Plan de livraison",
    "Le prompt à coller",
  ];
  const colW = (P.W - 2 * P.M - 8) / 2;
  toc.forEach((title, i) => {
    const x = P.M + (i < 3 ? 0 : 1) * (colW + 8);
    const yy = y + (i % 3) * 9;
    txt(String(i + 2).padStart(2, "0"), x, yy, {
      size: 9,
      face: "courier",
      style: "bold",
      color: C.accent,
    });
    txt(title, x + 9, yy, { size: 10 });
    line(x, yy + 6.3, x + colW, yy + 6.3, C.line, 0.2);
  });

  // ── 2. Carte de la demande ───────────────────────────────────────────────────
  doc.addPage();
  let top = header(
    "Carte de la demande",
    "Tout part du livrable",
    "Chaque branche est une information que Claude n'aura pas à deviner. Une branche vide deviendra une supposition.",
  );
  const cx = 105;
  const cy = 150;
  const sw = 78;
  const sh = 40;
  const satellites: Array<[FramingField, number, number]> = [
    ["problem", P.M, top + 6],
    ["audience", P.W - P.M - sw, top + 6],
    ["context", P.M, cy + 44],
    ["constraints", P.W - P.M - sw, cy + 44],
    ["successCriterion", cx - sw / 2, cy + 92],
  ];
  for (const [, sx, sy] of satellites)
    line(cx, cy, sx + sw / 2, sy + sh / 2, C.accent, 0.6, [1.6, 1.2]);
  for (const [field, sx, sy] of satellites) {
    const ok = f[field].trim() !== "";
    rbox(sx, sy, sw, sh, C.white, ok ? C.accent : C.crit, 2.5, 0.5);
    fill(ok ? C.accentSoft : C.critSoft);
    doc.roundedRect(sx + 0.25, sy + 0.25, sw - 0.5, 8, 2.3, 2.3, "F");
    doc.rect(sx + 0.25, sy + 5, sw - 0.5, 3.2, "F");
    txt(names[field].toUpperCase(), sx + 4, sy + 2.4, {
      size: 7.5,
      style: "bold",
      color: ok ? C.accent : C.crit,
    });
    txt(ok ? "RENSEIGNÉ" : "À PRÉCISER", sx + sw - 4, sy + 2.6, {
      size: 6,
      style: "bold",
      color: ok ? C.ok : C.crit,
      align: "right",
    });
    fit(f[field] || "Vide : Claude devra le supposer.", sx + 4, sy + 11, sw - 8, sh - 14, {
      size: 10,
      color: ok ? C.ink : C.muted,
    });
  }
  rbox(cx - 44, cy - 21, 88, 42, C.accent, undefined, 3);
  txt("LIVRABLE", cx, cy - 17, { size: 7, style: "bold", color: C.accentPale, align: "center" });
  fit(quoi, cx - 40, cy - 11, 80, 29, {
    size: 12,
    min: 8,
    style: "bold",
    color: C.white,
    align: "center",
    valign: "middle",
  });

  // ── 3. Parcours ──────────────────────────────────────────────────────────────
  doc.addPage();
  top = header(
    "Le parcours de la demande",
    "De l'idée au vrai utilisateur",
    "La boucle du bâtisseur appliquée à cette demande. Les étapes pleines sont franchies ; les autres restent à faire.",
  );
  type Step = [
    title: string,
    text: string,
    note: string,
    done: boolean,
    kind?: "decision" | "loop",
  ];
  const steps: Step[] = [
    [
      "Une idée ou un besoin arrive",
      "Notée tout de suite, sans être démarrée.",
      `Idée : ${quoi}`,
      true,
    ],
    [
      "Sert-elle mon projet actif ?",
      "Passage par le sas des projets (4 questions).",
      `Verdict : ${V[data.verdict].title}`,
      data.verdict !== "NONE",
      "decision",
    ],
    [
      "Cadrer la demande",
      "Quoi, pourquoi, pour qui, où, contraintes, réussite.",
      `${score} / 6 champs renseignés`,
      score === 6,
    ],
    [
      "Demander à Claude",
      "Une conversation dédiée, avec le prompt complet.",
      "Prompt prêt : dernière page du dossier",
      score === 6,
    ],
    [
      "Répondre à ses questions",
      "Même par « passe ». Sans retour, pas de correction.",
      "À faire pendant l'échange",
      false,
    ],
    [
      "Livrer la plus petite version",
      "Ce qui tient en deux semaines, pas la vision complète.",
      `Cible : ${f.successCriterion || "à définir"}`,
      false,
    ],
    [
      "La mettre entre de vraies mains",
      "Observer l'utilisateur sans l'aider.",
      `Avec : ${f.audience || "à définir"}`,
      false,
    ],
    [
      "Écouter, puis itérer",
      "Le retour devient la prochaine demande.",
      "Retour à l'étape 3 avec ce qu'on a appris",
      false,
      "loop",
    ],
  ];
  const y0 = top + 4;
  const gap = (P.H - 22 - y0) / steps.length;
  const nx = 36;
  const yc = (i: number) => y0 + i * gap + gap / 2 - 2;
  for (let i = 0; i < steps.length - 1; i += 1) {
    const next = steps[i + 1]?.[3] ?? false;
    arrow(nx, yc(i) + 6, nx, yc(i + 1) - 6.6, next ? C.accent : C.line, next ? 0.8 : 0.5);
  }
  const ly = yc(7);
  const ty = yc(2);
  line(nx - 6, ly, 20, ly, C.accent, 0.6, [1.4, 1.1]);
  line(20, ly, 20, ty, C.accent, 0.6, [1.4, 1.1]);
  arrow(20, ty, nx - 6.4, ty, C.accent, 0.6, [1.4, 1.1]);
  font(6.5, "bold");
  color(C.accent);
  doc.text("BOUCLE", 18.6, (ly + ty) / 2 + 5, { angle: 90 });
  steps.forEach(([title, text, note, done, kind], i) => {
    const c = yc(i);
    if (kind === "decision") diamond(nx, c, 13, 13, done ? C.accent : C.white, C.accent, 0.6);
    else {
      fill(done ? C.accent : C.white);
      stroke(C.accent);
      doc.setLineWidth(0.6);
      doc.circle(nx, c, 5.5, "FD");
    }
    center(String(i + 1), nx, c + 0.2, {
      size: 9,
      style: "bold",
      color: done ? C.white : C.accent,
    });
    const bh = gap - 7;
    const by = c - bh / 2;
    rbox(47, by, 80, bh, done ? C.accentSoft : C.white, done ? undefined : C.line, 2.5);
    txt(title, 51, by + 3, { size: 9.5, style: "bold", w: 72 });
    fit(text, 51, by + 8.6, 72, bh - 10, { size: 8, color: C.muted });
    line(127, c, 132, c, C.line, 0.3, [0.8, 0.8]);
    rbox(132, by, 62, bh, undefined, done ? C.accent : C.line, 2.5, 0.3);
    fit(note, 135, by + 3, 56, bh - 5, {
      size: 8,
      color: done ? C.ink : C.muted,
      valign: "middle",
    });
  });

  // ── 4. Sas ───────────────────────────────────────────────────────────────────
  doc.addPage();
  top = header(
    "Le sas des projets",
    "Faut-il construire maintenant ?",
    `${data.gateName ? `Idée évaluée : ${data.gateName}. ` : ""}Le chemin en couleur suit tes réponses. Un « non » fait sortir l'idée vers l'issue de droite.`,
  );
  const qx = 36;
  const qs = top + 16;
  const qg = 48;
  for (let i = 0; i < GATE_QUESTIONS; i += 1) {
    const qy = qs + i * qg;
    const isReached = reached(data.answers, i);
    const answer = data.answers[i] ?? null;
    const noOn = isReached && answer === false;
    const yesOn = isReached && answer === true;
    const exit = EXITS[i] ?? "PARK";
    const [exitInk, exitWash] = VERDICT_COLORS[exit];
    const nextY = i < 3 ? qs + (i + 1) * qg : qs + 4 * qg - 4;
    arrow(
      qx,
      qy + 10,
      qx,
      nextY - (i < 3 ? 10.6 : 0.6),
      yesOn ? C.accent : C.line,
      yesOn ? 0.9 : 0.45,
    );
    txt("OUI", qx + 2.5, qy + (nextY - qy) / 2 - 1, {
      size: 6.5,
      style: "bold",
      color: yesOn ? C.accent : C.muted,
    });
    arrow(qx + 13, qy, 133.4, qy, noOn ? exitInk : C.line, noOn ? 0.9 : 0.45);
    txt("NON", 118, qy + 1.4, { size: 6.5, style: "bold", color: noOn ? exitInk : C.muted });
    diamond(qx, qy, 26, 20, isReached ? C.accent : C.white, isReached ? C.accent : C.line, 0.6);
    center(`Q${i + 1}`, qx, qy + 0.2, {
      size: 10,
      style: "bold",
      color: isReached ? C.white : C.muted,
    });
    fit(data.copy.questions[i] ?? "", 52, qy - 15, 78, 13, {
      size: 8.5,
      color: isReached ? C.ink : C.muted,
      valign: "middle",
    });
    txt(
      `Ta réponse : ${answer === true ? "Oui" : answer === false ? "Non" : "non renseignée"}`,
      52,
      qy + 1.6,
      {
        size: 7.5,
        style: "bold",
        color: answer === true ? C.ok : answer === false ? C.crit : C.muted,
      },
    );
    rbox(
      134,
      qy - 12,
      60,
      24,
      noOn ? exitWash : C.white,
      noOn ? exitInk : C.line,
      2.5,
      noOn ? 0.8 : 0.3,
    );
    txt(V[exit].title, 138, qy - 9, { size: 10, style: "bold", color: noOn ? exitInk : C.muted });
    fit(V[exit].text, 138, qy - 3.5, 53, 14, { size: 6.8, color: noOn ? C.ink : C.muted });
  }
  const gy = qs + 4 * qg - 4;
  const goOn = reached(data.answers, GATE_QUESTIONS);
  rbox(qx - 20, gy, 40, 18, goOn ? C.okSoft : C.white, goOn ? C.ok : C.line, 2.5, goOn ? 0.8 : 0.3);
  center("GO", qx, gy + 9, { size: 14, style: "bold", color: goOn ? C.ok : C.muted });
  fit(V.GO.text, 62, gy + 1, 132, 16, { size: 9, color: goOn ? C.ink : C.muted, valign: "middle" });

  // ── 5. Contexte et vigilance ─────────────────────────────────────────────────
  doc.addPage();
  top = header(
    "Contexte et vigilance",
    "Pour qui, où, avec quelles limites",
    "Ce que Claude doit savoir de l'utilisateur et de son environnement, puis les questions à anticiper avant de construire.",
  );
  y = top + 2;
  const pw = 86;
  rbox(P.M, y, pw, 74, C.white, C.line, 3);
  fill(C.accentSoft);
  doc.circle(P.M + 14, y + 14, 8, "F");
  fill(C.accent);
  doc.circle(P.M + 14, y + 11.5, 3, "F");
  doc.roundedRect(P.M + 8.5, y + 15.5, 11, 5, 2.5, 2.5, "F");
  txt("UTILISATEUR", P.M + 26, y + 8, { size: 7, style: "bold", color: C.accent });
  fit(f.audience || "Non renseigné", P.M + 26, y + 13, pw - 30, 12, { size: 10.5, style: "bold" });
  line(P.M + 6, y + 28, P.M + pw - 6, y + 28, C.line, 0.2);
  txt("ENVIRONNEMENT", P.M + 6, y + 32, { size: 7, style: "bold", color: C.accent });
  fit(f.context || "Non renseigné", P.M + 6, y + 38, pw - 12, 32, { size: 9.5 });
  const rx = P.M + pw + 6;
  const rw = P.W - P.M - rx;
  rbox(rx, y, rw, 40, C.white, C.line, 3);
  txt("CONTRAINTES", rx + 5, y + 5, { size: 7, style: "bold", color: C.accent });
  let chips = toWinAnsi(f.constraints)
    .split(/\s*(?:,|;|\+|\bet\b)\s*/)
    .filter(Boolean);
  if (chips.length === 0) chips = ["Non renseignées"];
  let chx = rx + 5;
  let chy = y + 11;
  font(8);
  for (const chip of chips) {
    const label = short(chip, 40);
    const w = doc.getTextWidth(label) + 6;
    if (chx + w > rx + rw - 4) {
      chx = rx + 5;
      chy += 8;
    }
    if (chy > y + 32) break;
    rbox(chx, chy, w, 6, C.bg, C.line, 3, 0.2);
    txt(label, chx + 3, chy + 1.3, { size: 8 });
    chx += w + 2;
  }
  rbox(rx, y + 44, rw, 30, C.okSoft, undefined, 3);
  [6, 4, 2].forEach((r, i) => {
    fill(i === 1 ? C.okSoft : C.ok);
    doc.circle(rx + 12, y + 59, r, "F");
  });
  txt("C'EST RÉUSSI SI", rx + 22, y + 48, { size: 7, style: "bold", color: C.ok });
  fit(f.successCriterion || "Non renseigné", rx + 22, y + 53, rw - 26, 19, {
    size: 9.5,
    style: "bold",
  });
  y += 84;
  txt("Questions à anticiper", P.M, y, { size: 12, style: "bold" });
  txt(
    "Les réponses que Claude pourrait te demander. Prépare-les avant d'envoyer le prompt.",
    P.M,
    y + 6,
    {
      size: 8.5,
      color: C.muted,
    },
  );
  y += 14;
  const anticipate: Array<[FramingField, string]> = [
    [
      "goal",
      "Quelle est la plus petite partie du livrable qui apporte déjà de la valeur ? Que laisse-t-on volontairement de côté ?",
    ],
    [
      "problem",
      "Que se passe-t-il aujourd'hui sans cette solution ? Combien cela coûte-t-il en temps ou en argent ?",
    ],
    [
      "audience",
      "Qui d'autre l'utilisera ou sera touché ? Quel est son niveau d'aisance avec le numérique ?",
    ],
    [
      "context",
      "Que se passe-t-il sans réseau, en plein soleil, d'une seule main ? Sur quel écran et quel appareil ?",
    ],
    [
      "constraints",
      "Quelle contrainte est non négociable ? Laquelle peut sauter si le délai l'exige ?",
    ],
    [
      "successCriterion",
      "Comment mesurer le critère sans demander l'avis de l'utilisateur ? Qui le vérifie, et quand ?",
    ],
  ];
  const qw = (P.W - 2 * P.M - 6) / 2;
  const qh = (P.H - 24 - y - 8) / 3;
  anticipate.forEach(([field, question], i) => {
    const x = P.M + (i % 2) * (qw + 6);
    const yy = y + Math.floor(i / 2) * (qh + 4);
    const ok = f[field].trim() !== "";
    rbox(x, yy, qw, qh, C.white, C.line, 2.5);
    fill(ok ? C.ok : C.crit);
    doc.circle(x + 6, yy + 6.2, 1.4, "F");
    txt(names[field].toUpperCase(), x + 10, yy + 4.4, { size: 7, style: "bold", color: C.accent });
    fit(question, x + 5, yy + 11, qw - 10, qh - 14, { size: 9 });
  });

  // ── 6. Plan de livraison ─────────────────────────────────────────────────────
  doc.addPage();
  top = header(
    "Plan de livraison",
    "14 jours jusqu'au premier vrai test",
    "Un découpage indicatif pour livrer la plus petite version testable. Ajuste les durées à ton périmètre réel.",
  );
  const who = short(f.audience || "l'utilisateur", 34);
  const gantt: Array<[string, number, number, Rgb]> = [
    ["Cadrer et passer le sas", 1, 1, C.accent],
    ["Échanger avec Claude", 1, 2, C.accent],
    ["Construire la version minimale", 3, 9, C.accent],
    [`Tester avec ${who}`, 10, 11, C.ok],
    ["Corriger l'essentiel", 12, 13, C.warn],
    ["Décider la suite", 14, 14, C.crit],
  ];
  const gx = 82;
  const gw = P.W - P.M - gx;
  const dw = gw / 14;
  const gyy = top + 4;
  const rh = 13;
  txt("SEMAINE 1", gx, gyy, { size: 7, style: "bold", color: C.accent });
  txt("SEMAINE 2", gx + 7 * dw, gyy, { size: 7, style: "bold", color: C.accent });
  for (let day = 0; day < 14; day += 1)
    center(`J${day + 1}`, gx + day * dw + dw / 2, gyy + 8, { size: 7, color: C.muted });
  const gTop = gyy + 12;
  const gBot = gTop + gantt.length * rh;
  for (let day = 0; day <= 14; day += 1) {
    line(
      gx + day * dw,
      gTop,
      gx + day * dw,
      gBot,
      day === 7 ? C.accent : C.line,
      day === 7 ? 0.5 : 0.15,
      day === 7 ? undefined : [0.6, 0.8],
    );
  }
  gantt.forEach(([label, from, to, c], i) => {
    const yy = gTop + i * rh;
    if (i % 2 === 0) {
      fill(C.bg);
      doc.rect(P.M, yy, gx - P.M, rh, "F");
    }
    fit(label, P.M + 2, yy + 1.5, gx - P.M - 4, rh - 3, { size: 8.5, valign: "middle" });
    rbox(
      gx + (from - 1) * dw + 0.8,
      yy + 3.3,
      (to - from + 1) * dw - 1.6,
      rh - 6.6,
      c,
      undefined,
      2,
    );
    center(
      `${to - from + 1} j`,
      gx + (from - 1) * dw + ((to - from + 1) * dw) / 2,
      yy + rh / 2 + 0.2,
      {
        size: 7,
        style: "bold",
        color: C.white,
      },
    );
  });
  line(P.M, gBot, P.W - P.M, gBot, C.line, 0.3);
  for (const [day, label, c] of [
    [11, "Test réel", C.ok],
    [14, "Critère vérifié", C.crit],
  ] as const) {
    const mx = gx + day * dw;
    diamond(mx, gBot + 5, 6, 6, c);
    center(label, mx - (day === 14 ? 8 : 0), gBot + 11, { size: 7, style: "bold", color: c });
  }
  y = gBot + 18;
  rbox(P.M, y, P.W - 2 * P.M, 20, C.okSoft, undefined, 3);
  txt("JOUR 14 : LE CRITÈRE À VÉRIFIER", P.M + 6, y + 4, { size: 7, style: "bold", color: C.ok });
  fit(
    f.successCriterion || "Critère non renseigné : définis-le avant de commencer.",
    P.M + 6,
    y + 9,
    P.W - 2 * P.M - 12,
    9,
    {
      size: 10,
      style: "bold",
    },
  );
  y += 30;
  const done = data.tasks.filter((task) => task.done).length;
  txt("Feuille de route Cheikh 2.0 sur 30 jours", P.M, y, { size: 12, style: "bold" });
  txt(`${done} / ${data.tasks.length} tâches cochées`, P.W - P.M, y + 0.8, {
    size: 9.5,
    color: C.muted,
    align: "right",
  });
  y += 10;
  data.copy.weeks.forEach((week, i) => {
    const ofWeek = data.tasks.slice(i * 3, i * 3 + 3);
    const n = ofWeek.filter((task) => task.done).length;
    const yy = y + i * 11;
    const barW = P.W - P.M - 76 - 18;
    txt(week, P.M, yy + 0.6, { size: 9 });
    rbox(76, yy, barW, 5, C.bg, undefined, 2.5);
    if (n) rbox(76, yy, (barW * n) / 3, 5, C.accent, undefined, 2.5);
    txt(`${n} / 3`, P.W - P.M, yy + 0.4, {
      size: 8.5,
      face: "courier",
      style: "bold",
      color: C.accent,
      align: "right",
    });
  });
  y += 48;
  const next = data.tasks.filter((task) => !task.done).slice(0, 3);
  txt(next.length ? "Prochaines tâches" : "Feuille de route terminée", P.M, y, {
    size: 12,
    style: "bold",
  });
  y += 9;
  for (const task of next) {
    stroke(C.accent);
    doc.setLineWidth(0.4);
    doc.rect(P.M, y, 3.6, 3.6, "S");
    txt(task.label, P.M + 7, y - 0.3, { size: 9.5, w: P.W - 2 * P.M - 8 });
    y += 8;
  }

  // ── 7. Le prompt ─────────────────────────────────────────────────────────────
  doc.addPage();
  top = header(
    "Le prompt",
    "À coller dans une nouvelle conversation",
    "Copie ce texte tel quel. Claude te posera ses questions avant de commencer : réponds à chacune.",
  );
  font(9.5, "normal", "courier");
  const promptLines = doc.splitTextToSize(toWinAnsi(data.prompt), P.W - 2 * P.M - 12) as string[];
  const plh = lh(9.5);
  let yp = top + 2;
  let k = 0;
  while (k < promptLines.length) {
    const n = Math.max(1, Math.floor((P.H - 30 - yp - 12) / plh));
    const chunk = promptLines.slice(k, k + n);
    const bh = chunk.length * plh + 12;
    rbox(P.M, yp, P.W - 2 * P.M, bh, C.bg, C.line, 2.5);
    font(9.5, "normal", "courier");
    color(C.ink);
    doc.text(chunk, P.M + 6, yp + 6, { baseline: "top" });
    k += n;
    if (k < promptLines.length) {
      doc.addPage();
      yp = 20;
    } else yp += bh;
  }
  if (yp + 52 < P.H - 24) {
    yp += 10;
    txt("Après l'envoi", P.M, yp, { size: 12, style: "bold" });
    yp += 9;
    [
      "Répondre à chaque question de Claude, même par « passe ».",
      "Relire les hypothèses que Claude annonce et corriger celles qui sont fausses.",
      "Revenir sur cette fiche après le test utilisateur pour la prochaine itération.",
    ].forEach((item, i) => {
      fill(C.accent);
      doc.circle(P.M + 3, yp + 2.2, 3, "F");
      center(String(i + 1), P.M + 3, yp + 2.4, { size: 7.5, style: "bold", color: C.white });
      txt(item, P.M + 10, yp, { size: 9.5, w: P.W - 2 * P.M - 12 });
      yp += 9;
    });
  }

  // ── Pieds de page ────────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    line(P.M, P.H - 14, P.W - P.M, P.H - 14, C.line, 0.2);
    txt(`Cheikh 2.0  ·  Fiche de cadrage  ·  ${short(quoi, 60)}`, P.M, P.H - 11, {
      size: 7.5,
      color: C.muted,
    });
    txt(`${page} / ${pages}`, P.W - P.M, P.H - 11, { size: 7.5, color: C.muted, align: "right" });
  }
  return doc;
}

/** jsPDF n'est chargé qu'au clic sur l'export. */
export async function downloadFramingPdf(data: FramingPdfData, fileName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  buildFramingPdf(data, jsPDF).save(fileName);
}
