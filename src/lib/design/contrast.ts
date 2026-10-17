/**
 * Contraste WCAG 2.x entre deux couleurs hexadécimales (#rrggbb).
 * https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */

export type Hex = `#${string}`;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Couleur invalide : ${hex}`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** « 9,3:1 » : un chiffre après la virgule, arrondi vers le bas pour ne jamais surestimer. */
export function formatRatio(ratio: number, locale = "fr-FR"): string {
  const floored = Math.floor(ratio * 10) / 10;
  return `${floored.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}:1`;
}

/** Seuils WCAG 2.2 niveau AA. */
export const AA = {
  text: 4.5,
  largeText: 3,
  nonText: 3,
} as const;
