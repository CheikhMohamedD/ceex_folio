// @vitest-environment node
import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { DEFAULT_ROADMAP } from "@/lib/cheikh/roadmap";
import { buildFramingPdf, type FramingPdfData } from "./framing";

const data: FramingPdfData = {
  values: {
    goal: "L'écran de saisie de la ponte quotidienne, par bâtiment",
    problem: "Tout est noté sur papier",
    audience: "Le gérant de la Ferme Jambar",
    context: "Au poulailler, sur Android, souvent sans réseau",
    constraints: "React Native + Expo, hors ligne, saisie en moins de 30 secondes",
    successCriterion: "Le gérant l'utilise seul pendant 7 jours de suite",
  },
  gateName: "Saisie de la ponte",
  answers: [true, true, false, null],
  verdict: "VALIDATE",
  prompt: "OBJECTIF : L'écran de saisie\n\nÀ la fin, dis-moi ce que je n'ai pas vu.",
  date: "17 octobre 2026",
  tasks: DEFAULT_ROADMAP.map((task, index) => ({ label: task.label, done: index < 2 })),
  copy: {
    fields: {
      goal: "Quoi",
      problem: "Pourquoi",
      audience: "Pour qui",
      context: "Où et contexte",
      constraints: "Contraintes",
      successCriterion: "C'est réussi si",
    },
    questions: ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"],
    verdicts: {
      NONE: { title: "En attente", text: "Réponds aux quatre questions." },
      PARK: { title: "Parking", text: "Note l'idée dans la Boussole." },
      VALIDATE: { title: "Valider d'abord", text: "Parle à 5 utilisateurs potentiels." },
      CUT: { title: "Réduire", text: "Coupe jusqu'à deux semaines." },
      GO: { title: "Go", text: "Construis la plus petite version." },
    },
    weeks: [
      "Semaine 1 · Hygiène",
      "Semaine 2 · Focus",
      "Semaine 3 · Livrer",
      "Semaine 4 · Apprendre",
    ],
  },
};

describe("buildFramingPdf", () => {
  it("dessine les sept pages du dossier d'origine", () => {
    const doc = buildFramingPdf(data, jsPDF);
    expect(doc.getNumberOfPages()).toBe(7);
  });

  it("ajoute des pages quand le prompt ne tient pas sur une seule", () => {
    const prompt = Array.from({ length: 160 }, (_, line) => `Ligne ${line + 1}`).join("\n");
    const doc = buildFramingPdf({ ...data, prompt }, jsPDF);
    expect(doc.getNumberOfPages()).toBeGreaterThan(7);
  });

  it("supporte une fiche sans verdict ni nom d'idée", () => {
    const doc = buildFramingPdf(
      { ...data, gateName: null, answers: [null, null, null, null], verdict: "NONE" },
      jsPDF,
    );
    const text = doc.output();
    expect(text).toContain("En attente");
    expect(text).toContain("Valider d'abord");
  });
});
