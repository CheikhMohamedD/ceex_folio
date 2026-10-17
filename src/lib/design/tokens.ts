import { AA, contrastRatio, type Hex } from "./contrast";

/**
 * Miroir TypeScript des couleurs déclarées dans src/app/globals.css.
 * Le CSS reste la source qui s'affiche ; ce fichier sert à calculer et à
 * documenter les contrastes. Un test vérifie que les deux disent la même chose.
 */

export const BASE_TOKENS = [
  "paper",
  "sheet",
  "kraft",
  "ink",
  "ink-soft",
  "rule",
  "stamp",
  "stamp-strong",
  "success",
  "error",
] as const;

export const CATEGORY_TOKENS = ["cat-web", "cat-mobile", "cat-design", "cat-motion"] as const;
export const WASH_TOKENS = [
  "wash",
  "wash-web",
  "wash-mobile",
  "wash-design",
  "wash-motion",
] as const;
export const ROLE_TOKENS = ["on-fill", "focus"] as const;

export type BaseToken = (typeof BASE_TOKENS)[number];
export type CategoryToken = (typeof CATEGORY_TOKENS)[number];
export type WashToken = (typeof WASH_TOKENS)[number];
export type ColorToken = BaseToken | CategoryToken | WashToken | (typeof ROLE_TOKENS)[number];
export type Theme = "light" | "dark";

export const TOKENS: Record<ColorToken, Record<Theme, Hex>> = {
  paper: { light: "#f2eee6", dark: "#14120f" },
  sheet: { light: "#fbf9f5", dark: "#1d1a16" },
  kraft: { light: "#d9c4a0", dark: "#3a3024" },
  ink: { light: "#1a1a1a", dark: "#eee7da" },
  "ink-soft": { light: "#5a544a", dark: "#a99f90" },
  rule: { light: "#d8d0c2", dark: "#2e2922" },
  stamp: { light: "#c8502d", dark: "#e2714b" },
  "stamp-strong": { light: "#a8401f", dark: "#e2714b" },
  success: { light: "#2e6b4e", dark: "#6fbf95" },
  error: { light: "#b3261e", dark: "#f08a80" },
  "cat-web": { light: "#24456e", dark: "#9db8dd" },
  "cat-mobile": { light: "#1e5546", dark: "#8cc7b0" },
  "cat-design": { light: "#6a3d63", dark: "#d0add9" },
  "cat-motion": { light: "#7a4f12", dark: "#e0b26e" },
  wash: { light: "#f0eeea", dark: "#2a2622" },
  "wash-web": { light: "#e1e3e5", dark: "#2f3032" },
  "wash-mobile": { light: "#e0e5e0", dark: "#2d322c" },
  "wash-design": { light: "#eae2e3", dark: "#362f31" },
  "wash-motion": { light: "#ece5da", dark: "#382f22" },
  "on-fill": { light: "#fbf9f5", dark: "#14120f" },
  focus: { light: "#a8401f", dark: "#e2714b" },
};

/** Lavis associé à chaque catégorie. */
export const WASH_OF: Record<CategoryToken, WashToken> = {
  "cat-web": "wash-web",
  "cat-mobile": "wash-mobile",
  "cat-design": "wash-design",
  "cat-motion": "wash-motion",
};

export type ContrastKind = "text" | "large" | "ui";

export type ContrastRule = {
  fg: ColorToken;
  bg: ColorToken;
  kind: ContrastKind;
};

export const MINIMUM: Record<ContrastKind, number> = {
  text: AA.text,
  large: AA.largeText,
  ui: AA.nonText,
};

const surfaces = ["paper", "sheet"] as const;

/**
 * Toutes les paires que le système utilise. `large` = texte de 24 px et plus,
 * `ui` = trait, pastille, anneau de focus (WCAG 1.4.11).
 */
export const CONTRAST_RULES: ContrastRule[] = [
  ...surfaces.flatMap((bg) => [
    { fg: "ink", bg, kind: "text" } as const,
    { fg: "ink-soft", bg, kind: "text" } as const,
    { fg: "stamp-strong", bg, kind: "text" } as const,
    { fg: "stamp", bg, kind: "large" } as const,
    { fg: "success", bg, kind: "text" } as const,
    { fg: "error", bg, kind: "text" } as const,
    { fg: "focus", bg, kind: "ui" } as const,
    ...CATEGORY_TOKENS.map((fg) => ({ fg, bg, kind: "text" }) as const),
  ]),
  { fg: "ink", bg: "kraft", kind: "text" },
  { fg: "focus", bg: "kraft", kind: "ui" },
  { fg: "on-fill", bg: "ink", kind: "text" },
  { fg: "on-fill", bg: "stamp-strong", kind: "text" },
  ...CATEGORY_TOKENS.map((bg) => ({ fg: "on-fill", bg, kind: "text" }) as const),
  ...WASH_TOKENS.flatMap((bg) => [
    { fg: "ink", bg, kind: "text" } as const,
    { fg: "ink-soft", bg, kind: "text" } as const,
  ]),
  { fg: "stamp-strong", bg: "wash", kind: "ui" },
  ...CATEGORY_TOKENS.map((fg) => ({ fg, bg: WASH_OF[fg], kind: "ui" }) as const),
];

export function ratio(fg: ColorToken, bg: ColorToken, theme: Theme): number {
  return contrastRatio(TOKENS[fg][theme], TOKENS[bg][theme]);
}

/** Vérifie chaque paire de CONTRAST_RULES dans les deux thèmes : total et réussites. */
export function contrastAudit(): { total: number; passing: number } {
  const checks = CONTRAST_RULES.flatMap((rule) =>
    (["light", "dark"] as const).map(
      (theme) => ratio(rule.fg, rule.bg, theme) >= MINIMUM[rule.kind],
    ),
  );
  return { total: checks.length, passing: checks.filter(Boolean).length };
}

/** Fond de référence pour afficher le contraste d'un token de texte. */
export const CONTRAST_REFERENCE: Partial<Record<ColorToken, ColorToken>> = {
  ink: "paper",
  "ink-soft": "paper",
  stamp: "paper",
  "stamp-strong": "paper",
  success: "sheet",
  error: "sheet",
  "cat-web": "paper",
  "cat-mobile": "paper",
  "cat-design": "paper",
  "cat-motion": "paper",
};

/** Lit les déclarations `--nom: light-dark(#clair, #sombre)` d'une feuille CSS. */
export function parseCssTokens(css: string): Map<string, Record<Theme, string>> {
  const tokens = new Map<string, Record<Theme, string>>();
  const pattern = /--([a-z-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi;
  for (const match of css.matchAll(pattern)) {
    const [, name, light, dark] = match;
    if (name && light && dark) {
      tokens.set(name, { light: light.toLowerCase(), dark: dark.toLowerCase() });
    }
  }
  return tokens;
}
