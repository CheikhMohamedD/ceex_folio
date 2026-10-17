// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AA, contrastRatio, formatRatio, hexToRgb, relativeLuminance } from "./contrast";

describe("contraste WCAG", () => {
  it("lit les couleurs hexadécimales", () => {
    expect(hexToRgb("#a8401f")).toEqual([168, 64, 31]);
    expect(hexToRgb("#FFFFFF")).toEqual([255, 255, 255]);
  });

  it("refuse une couleur invalide", () => {
    expect(() => hexToRgb("#fff")).toThrow("Couleur invalide");
    expect(() => hexToRgb("rouge")).toThrow("Couleur invalide");
  });

  it("calcule la luminance relative", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("donne 21:1 entre le noir et le blanc, dans les deux sens", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 10);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("arrondit vers le bas pour ne jamais surestimer un contraste", () => {
    expect(formatRatio(4.49)).toBe("4,4:1");
    expect(formatRatio(3.999)).toBe("3,9:1");
    expect(formatRatio(21)).toBe("21,0:1");
  });

  it("garde les seuils AA de WCAG 2.2", () => {
    expect(AA).toEqual({ text: 4.5, largeText: 3, nonText: 3 });
  });
});
