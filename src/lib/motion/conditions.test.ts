import { describe, expect, it } from "vitest";
import { canAnimate, canRunHeroScene, isMotionFree, type Environment } from "./conditions";

const desktop: Environment = {
  width: 1440,
  reducedMotion: false,
  saveData: false,
  cores: 8,
  webgl2: true,
};

describe("canRunHeroScene", () => {
  it("lance la 3D sur un desktop qui remplit toutes les conditions", () => {
    expect(canRunHeroScene(desktop)).toBe(true);
    expect(canRunHeroScene({ ...desktop, width: 1024, cores: 4 })).toBe(true);
  });

  it.each<[string, Partial<Environment>]>([
    ["sous 1 024 px", { width: 1023 }],
    ["sans WebGL2", { webgl2: false }],
    ["avec moins de 4 cœurs", { cores: 2 }],
    ["quand le nombre de cœurs est inconnu", { cores: 0 }],
    ["avec l'économiseur de données", { saveData: true }],
    ["avec « réduire les animations »", { reducedMotion: true }],
  ])("reste au collage statique %s", (_, change) => {
    expect(canRunHeroScene({ ...desktop, ...change })).toBe(false);
  });
});

describe("canAnimate", () => {
  it("n'anime rien quand le visiteur demande moins d'animations", () => {
    expect(canAnimate({ reducedMotion: true })).toBe(false);
    expect(canAnimate({ reducedMotion: false })).toBe(true);
  });
});

describe("isMotionFree", () => {
  it("n'anime ni les Coulisses ni leur connexion", () => {
    for (const path of ["/coulisses", "/coulisses/boussole", "/fr/coulisses", "/connexion", "/connexion/refus"]) {
      expect(isMotionFree(path)).toBe(true);
    }
  });

  it("anime le reste du site", () => {
    for (const path of ["/", "/en", "/projets/seetalma", "/contact/merci", "/coulisses-du-site"]) {
      expect(isMotionFree(path)).toBe(false);
    }
  });
});
