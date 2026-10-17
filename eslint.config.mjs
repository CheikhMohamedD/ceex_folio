import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Règles d'accessibilité plus strictes que celles de Next.js. Le plugin jsx-a11y
// est déjà chargé par eslint-config-next : on ne fait que relever le niveau.
const a11yRules = Object.fromEntries(
  [
    "alt-text",
    "anchor-has-content",
    "anchor-is-valid",
    "aria-activedescendant-has-tabindex",
    "aria-props",
    "aria-proptypes",
    "aria-role",
    "aria-unsupported-elements",
    "click-events-have-key-events",
    "heading-has-content",
    "html-has-lang",
    "iframe-has-title",
    "img-redundant-alt",
    "interactive-supports-focus",
    "label-has-associated-control",
    "media-has-caption",
    "mouse-events-have-key-events",
    "no-access-key",
    "no-autofocus",
    "no-distracting-elements",
    "no-interactive-element-to-noninteractive-role",
    "no-noninteractive-element-interactions",
    "no-noninteractive-element-to-interactive-role",
    "no-noninteractive-tabindex",
    "no-redundant-roles",
    "no-static-element-interactions",
    "role-has-required-aria-props",
    "role-supports-aria-props",
    "scope",
    "tabindex-no-positive",
  ].map((rule) => [`jsx-a11y/${rule}`, "error"]),
);

// Le motif « tabs » de l'APG donne tabindex="0" au panneau quand il ne contient
// rien de focalisable : seul ce rôle garde le droit à un tabIndex.
// Le tableau garde des rôles explicites : il change d'affichage CSS sous 768 px, et
// certains navigateurs retirent alors la sémantique implicite de <table>.
a11yRules["jsx-a11y/no-redundant-roles"] = [
  "error",
  {
    nav: ["navigation"],
    table: ["table"],
    thead: ["rowgroup"],
    tbody: ["rowgroup"],
    tr: ["row"],
    th: ["columnheader", "rowheader"],
    td: ["cell"],
  },
];

// jsx-a11y prend <td> pour une cellule de grille interactive : role="cell" est voulu.
a11yRules["jsx-a11y/no-interactive-element-to-noninteractive-role"] = [
  "error",
  { tr: ["none", "presentation"], canvas: ["img"], td: ["cell"] },
];

a11yRules["jsx-a11y/no-noninteractive-tabindex"] = [
  "error",
  { tags: [], roles: ["tabpanel"], allowExpressionValues: true },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{jsx,tsx}"],
    rules: a11yRules,
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "src/generated/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".lighthouseci/**",
    "next-env.d.ts",
    "src/i18n/messages/*.d.json.ts",
    // Projets voisins dans le même dépôt, hors du site :
    "motion/**",
    "Portfolio wireframe directions/**",
  ]),
]);
