// @vitest-environment node
import { describe, expect, it } from "vitest";
import { localizedPath } from "./paths";

describe("adresses localisées", () => {
  it("laisse le français sans préfixe", () => {
    expect(localizedPath("/", "fr")).toBe("/");
    expect(localizedPath("/projets/seetalma", "fr")).toBe("/projets/seetalma");
    expect(localizedPath("/#reach-out", "fr")).toBe("/#reach-out");
  });

  it("préfixe l'anglais, ancres comprises", () => {
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/projets/seetalma", "en")).toBe("/en/projets/seetalma");
    expect(localizedPath("/#reach-out", "en")).toBe("/en#reach-out");
  });
});
