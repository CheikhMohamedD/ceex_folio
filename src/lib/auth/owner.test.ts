import { describe, expect, it } from "vitest";
import { allowedGithubId, isOwnerGithubId } from "./owner";

describe("allowedGithubId", () => {
  it("garde un identifiant numérique", () => {
    expect(allowedGithubId("123456")).toBe("123456");
    expect(allowedGithubId(" 123456 ")).toBe("123456");
  });

  it.each([undefined, "", "  ", "cheikhMohamedD", "12a", "0", "-5", "1.5"])(
    "refuse tout le monde quand la variable vaut %j",
    (value) => {
      expect(allowedGithubId(value)).toBeNull();
    },
  );
});

describe("isOwnerGithubId", () => {
  const allowed = "123456";

  it("reconnaît l'identifiant, qu'il arrive en nombre (profil) ou en texte (compte)", () => {
    expect(isOwnerGithubId(123456, allowed)).toBe(true);
    expect(isOwnerGithubId("123456", allowed)).toBe(true);
  });

  it.each<[string, unknown]>([
    ["un autre compte", 654321],
    ["un autre compte en texte", "654321"],
    ["un pseudo", "cheikhMohamedD"],
    ["un identifiant avec des espaces", " 123456"],
    ["un nombre non entier", 123456.5],
    ["rien", undefined],
    ["null", null],
    ["un objet", { id: 123456 }],
  ])("refuse %s", (_, candidate) => {
    expect(isOwnerGithubId(candidate, allowed)).toBe(false);
  });

  it("refuse tout le monde sans identifiant attendu", () => {
    expect(isOwnerGithubId(123456, null)).toBe(false);
    expect(isOwnerGithubId("", null)).toBe(false);
  });
});
