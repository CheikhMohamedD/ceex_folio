import { describe, expect, it } from "vitest";
import { toWinAnsi } from "./brief";

describe("toWinAnsi", () => {
  it("garde le français, ses guillemets et l'euro", () => {
    const text = "Œuvre « déjà » prête, l’été : 5 000 € — c’est ça…";
    expect(toWinAnsi(text)).toBe(text.replace(/ /g, " "));
  });

  it("remplace les espaces fines et les flèches", () => {
    expect(toWinAnsi("Budget : 2 M → OK")).toBe("Budget : 2 M -> OK");
  });

  it("retire ce que les polices standard ne savent pas dessiner", () => {
    expect(toWinAnsi("Salut 👋 مرحبا ok")).toBe("Salut   ok");
  });

  it("garde les retours à la ligne", () => {
    expect(toWinAnsi("un\ndeux")).toBe("un\ndeux");
  });
});
