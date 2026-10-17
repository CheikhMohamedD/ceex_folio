import { describe, expect, it } from "vitest";
import { leadingNumber } from "./numbers";

describe("leadingNumber", () => {
  it("lit le nombre et garde le reste du texte", () => {
    expect(leadingNumber("7 modules")).toEqual({ value: 7, rest: " modules" });
    expect(leadingNumber("250 participants")).toEqual({ value: 250, rest: " participants" });
  });

  it("comprend les milliers séparés par une espace, insécable ou fine", () => {
    expect(leadingNumber("1 000 poules")).toEqual({ value: 1000, rest: " poules" });
    expect(leadingNumber("1 000 poules")?.value).toBe(1000);
    expect(leadingNumber("12 500 visites")?.value).toBe(12500);
  });

  it("ne compte ni un texte sans nombre, ni 0 ou 1", () => {
    expect(leadingNumber("Multi-pays")).toBeNull();
    expect(leadingNumber("1 détail secret")).toBeNull();
  });
});
