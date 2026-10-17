import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  clarity,
  clarityLevel,
  EMPTY_FRAMING,
  framingFileName,
  type PromptCopy,
} from "./framing";

const copy: PromptCopy = {
  labels: {
    goal: "OBJECTIF",
    problem: "POURQUOI",
    audience: "POUR QUI",
    context: "OÙ / CONTEXTE",
    constraints: "CONTRAINTES",
    successCriterion: "C'EST RÉUSSI SI",
  },
  missing: "[à préciser]",
  closing: ["Pose-moi tes questions.", "Dis-moi ce que je n'ai pas vu."],
};

const filled = {
  goal: "L'écran de saisie de la ponte quotidienne, par bâtiment",
  problem: "Tout est noté sur papier",
  audience: "Le gérant de la Ferme Jambar",
  context: "Au poulailler, sur Android, souvent sans réseau",
  constraints: "React Native + Expo, hors ligne",
  successCriterion: "Le gérant l'utilise seul pendant 7 jours de suite",
};

describe("clarity", () => {
  it("compte les champs remplis, espaces ignorés", () => {
    expect(clarity(EMPTY_FRAMING)).toBe(0);
    expect(clarity({ ...EMPTY_FRAMING, goal: "Un écran", problem: "   " })).toBe(1);
    expect(clarity(filled)).toBe(6);
  });

  it("classe le score comme l'outil d'origine", () => {
    expect(clarityLevel(6)).toBe("ok");
    expect(clarityLevel(5)).toBe("mid");
    expect(clarityLevel(4)).toBe("mid");
    expect(clarityLevel(3)).toBe("bad");
    expect(clarityLevel(0)).toBe("bad");
  });
});

describe("buildPrompt", () => {
  it("écrit une ligne par champ, puis les consignes", () => {
    const prompt = buildPrompt(filled, copy).split("\n");
    expect(prompt[0]).toBe(`OBJECTIF : ${filled.goal}`);
    expect(prompt[5]).toBe(`C'EST RÉUSSI SI : ${filled.successCriterion}`);
    expect(prompt.slice(6)).toEqual(["", ...copy.closing]);
  });

  it("signale chaque champ vide", () => {
    const prompt = buildPrompt({ ...filled, audience: "  " }, copy);
    expect(prompt).toContain("POUR QUI : [à préciser]");
  });
});

describe("framingFileName", () => {
  it("date le fichier et reprend les premiers mots du livrable, sans accents", () => {
    expect(framingFileName(filled.goal, new Date("2026-10-17T09:00:00Z"))).toBe(
      "cadrage-2026-10-17-l-ecran-de-saisie-de.pdf",
    );
    expect(framingFileName("  !!  ", new Date("2026-10-17T09:00:00Z"))).toBe(
      "cadrage-2026-10-17-demande.pdf",
    );
  });
});
