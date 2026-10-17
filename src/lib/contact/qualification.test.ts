import { describe, expect, it } from "vitest";
import { qualify } from "./qualification";

describe("qualify", () => {
  it("donne 4 à une demande complète", () => {
    const result = qualify({
      goal: "Une boutique en ligne pour vendre nos tissus wax à Dakar et livrer à domicile.",
      budgetRange: "500k-2m",
      deadline: "quarter",
      successCriterion: "Vingt commandes par mois après trois mois.",
    });
    expect(result.score).toBe(4);
    expect(result.met).toEqual({ goal: true, budget: true, deadline: true, success: true });
  });

  it("ne compte ni « Je ne sais pas encore » ni un objectif trop court", () => {
    const result = qualify({
      goal: "Un site.",
      budgetRange: "unknown",
      deadline: "unknown",
      successCriterion: "  ",
    });
    expect(result.score).toBe(0);
  });

  it("compte chaque critère à part", () => {
    expect(qualify({ budgetRange: "gt5m" }).met).toEqual({
      goal: false,
      budget: true,
      deadline: false,
      success: false,
    });
    expect(
      qualify({ deadline: "month", successCriterion: "Les clients réservent seuls." }).score,
    ).toBe(2);
  });

  it("ignore les espaces autour du texte", () => {
    expect(qualify({ goal: `   ${"a".repeat(39)}   ` }).met.goal).toBe(false);
    expect(qualify({ goal: "a".repeat(40) }).met.goal).toBe(true);
  });
});
