import { describe, expect, it } from "vitest";
import { EMPTY_GATE, parseGateAnswers, reached, verdictFor, type GateAnswer } from "./gate";

describe("verdictFor", () => {
  it("attend tant qu'une question n'a pas sa réponse", () => {
    expect(verdictFor(EMPTY_GATE)).toBe("NONE");
    expect(verdictFor([true, true, true, null])).toBe("NONE");
    expect(verdictFor([false, null, null, null])).toBe("NONE");
    expect(verdictFor([])).toBe("NONE");
  });

  it.each<[GateAnswer[], string]>([
    [[false, true, true, true], "PARK"],
    [[false, false, false, false], "PARK"],
    [[true, false, true, true], "VALIDATE"],
    [[true, true, false, true], "VALIDATE"],
    [[true, false, false, false], "VALIDATE"],
    [[true, true, true, false], "CUT"],
    [[true, true, true, true], "GO"],
  ])("%j donne %s", (answers, verdict) => {
    expect(verdictFor(answers)).toBe(verdict);
  });
});

describe("reached", () => {
  it("n'atteint une question que par des « oui »", () => {
    const answers = [true, false, true, true];
    expect(reached(answers, 0)).toBe(true);
    expect(reached(answers, 1)).toBe(true);
    expect(reached(answers, 2)).toBe(false);
    expect(reached(answers, 4)).toBe(false);
    expect(reached([true, true, true, true], 4)).toBe(true);
  });
});

describe("parseGateAnswers", () => {
  it("relit un tableau enregistré, et rien d'autre", () => {
    expect(parseGateAnswers([true, false, null, true])).toEqual([true, false, null, true]);
    expect(parseGateAnswers([true, "oui", 1])).toEqual([true, null, null, null]);
    expect(parseGateAnswers({ 0: true })).toEqual([null, null, null, null]);
    expect(parseGateAnswers(null)).toEqual([null, null, null, null]);
  });
});
