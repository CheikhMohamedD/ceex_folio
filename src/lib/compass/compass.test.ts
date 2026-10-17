import { describe, expect, it } from "vitest";
import { byPriority, priority, valueChainFrom } from "./compass";

const project = (title: string, feasibilityScore: number, impactScore: number, day: number) => ({
  title,
  feasibilityScore,
  impactScore,
  createdAt: new Date(2026, 9, day),
});

describe("priority", () => {
  it("multiplie faisabilité et impact", () => {
    expect(priority({ feasibilityScore: 1, impactScore: 1 })).toBe(1);
    expect(priority({ feasibilityScore: 4, impactScore: 5 })).toBe(20);
  });
});

describe("byPriority", () => {
  it("met les projets les plus prioritaires en tête, sans modifier la liste reçue", () => {
    const projects = [
      project("Facile, sans effet", 5, 1, 1),
      project("Atelier", 4, 5, 2),
      project("Seetalma v2", 5, 4, 3),
      project("Ancien à égalité", 4, 5, 1),
    ];
    expect(byPriority(projects).map(({ title }) => title)).toEqual([
      "Ancien à égalité",
      "Atelier",
      "Seetalma v2",
      "Facile, sans effet",
    ]);
    expect(projects[0]?.title).toBe("Facile, sans effet");
  });
});

describe("valueChainFrom", () => {
  it("ne garde que les activités ITIL 4 connues, dans l'ordre de la chaîne", () => {
    expect(valueChainFrom(["deliver-support", "plan", "plan", "marketing", 3])).toEqual([
      "plan",
      "deliver-support",
    ]);
    expect(valueChainFrom([])).toEqual([]);
  });
});
