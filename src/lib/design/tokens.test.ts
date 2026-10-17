// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./categories";
import {
  CATEGORY_TOKENS,
  contrastAudit,
  CONTRAST_RULES,
  MINIMUM,
  parseCssTokens,
  ratio,
  TOKENS,
  WASH_OF,
} from "./tokens";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const cssTokens = parseCssTokens(css);

// Décor sans texte : les deux teintes des hachures d'image.
const DECOR_ONLY = new Set(["hatch-a", "hatch-b"]);

describe("miroir TypeScript des tokens", () => {
  it.each(Object.entries(TOKENS))("--%s a les mêmes valeurs dans globals.css", (name, values) => {
    expect(cssTokens.get(name)).toEqual(values);
  });

  it("ne laisse aucune couleur de globals.css hors du miroir", () => {
    const missing = [...cssTokens.keys()].filter(
      (name) => !(name in TOKENS) && !DECOR_ONLY.has(name),
    );
    expect(missing).toEqual([]);
  });

  it("donne une couleur et un lavis à chaque catégorie", () => {
    for (const category of CATEGORIES) {
      const token = `cat-${category}` as const;
      expect(CATEGORY_TOKENS).toContain(token);
      expect(TOKENS[WASH_OF[token]]).toBeDefined();
    }
  });
});

describe("contrastes WCAG 2.2 AA, en clair et en sombre", () => {
  const cases = CONTRAST_RULES.flatMap((rule) =>
    (["light", "dark"] as const).map((theme) => ({ ...rule, theme })),
  );

  it.each(cases)("$fg sur $bg : $kind, thème $theme", ({ fg, bg, kind, theme }) => {
    expect(ratio(fg, bg, theme)).toBeGreaterThanOrEqual(MINIMUM[kind]);
  });

  it("vérifie chaque paire dans les deux thèmes", () => {
    expect(contrastAudit()).toEqual({ total: cases.length, passing: cases.length });
  });

  it("vérifie toutes les couleurs de texte sur le papier et la feuille", () => {
    const textTokens = ["ink", "ink-soft", "stamp-strong", "success", "error", ...CATEGORY_TOKENS];
    for (const fg of textTokens) {
      for (const bg of ["paper", "sheet"]) {
        expect(CONTRAST_RULES).toContainEqual({ fg, bg, kind: "text" });
      }
    }
  });
});
