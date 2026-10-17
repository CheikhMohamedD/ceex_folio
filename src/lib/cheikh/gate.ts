/**
 * Le sas des nouveaux projets de Cheikh 2.0 : quatre questions, dans l'ordre.
 *
 * 1. Sert-elle mon projet actif, ou je décide sciemment de la mettre à sa place ?
 * 2. Ai-je identifié un utilisateur réel, quelqu'un que je peux nommer ?
 * 3. Sais-je qui paiera, ou quel gain mesurable elle apporte ?
 * 4. Une première version testable tient-elle en deux semaines ?
 *
 * Le premier « non » décide : parking, valider d'abord, ou réduire.
 */
export const GATE_QUESTIONS = 4;

export const VERDICTS = ["NONE", "PARK", "VALIDATE", "CUT", "GO"] as const;
export type Verdict = (typeof VERDICTS)[number];

/** true pour oui, false pour non, null tant que la question attend sa réponse. */
export type GateAnswer = boolean | null;
export type GateAnswers = readonly GateAnswer[];

export const EMPTY_GATE: GateAnswers = Array.from({ length: GATE_QUESTIONS }, () => null);

/** Le verdict, comme dans l'outil d'origine : rien tant qu'une question attend. */
export function verdictFor(answers: GateAnswers): Verdict {
  const [active, user, payer, twoWeeks] = Array.from(
    { length: GATE_QUESTIONS },
    (_, index) => answers[index] ?? null,
  );
  if ([active, user, payer, twoWeeks].includes(null)) return "NONE";
  if (active === false) return "PARK";
  if (user === false || payer === false) return "VALIDATE";
  if (twoWeeks === false) return "CUT";
  return "GO";
}

/**
 * Jusqu'où le chemin du sas est allé : une question n'est atteinte que si toutes
 * les précédentes ont reçu « oui ». Sert au schéma du dossier PDF.
 */
export function reached(answers: GateAnswers, question: number): boolean {
  return answers.slice(0, question).every((answer) => answer === true);
}

/** Les réponses lues dans un champ JSON enregistré ; tout ce qui n'est pas un booléen devient null. */
export function parseGateAnswers(value: unknown): GateAnswer[] {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: GATE_QUESTIONS }, (_, index) =>
    typeof list[index] === "boolean" ? (list[index] as boolean) : null,
  );
}
