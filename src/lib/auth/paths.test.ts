import { describe, expect, it } from "vitest";
import { isPrivatePath } from "./paths";

describe("isPrivatePath", () => {
  it.each([
    "/coulisses",
    "/coulisses/",
    "/coulisses/demandes",
    "/fr/coulisses/boussole",
    "//coulisses",
    "/%63oulisses",
    "/%63oulisses/demandes",
    "/fr/%63oulisses",
    "/Coulisses",
    "/%E0%A4%A",
  ])("protège %s", (path) => {
    expect(isPrivatePath(path)).toBe(true);
  });

  it.each([
    "/",
    "/connexion",
    "/connexion/refus",
    "/en/coulisses",
    "/coulisses-du-site",
    "/blog/coulisses",
  ])("laisse passer %s", (path) => {
    expect(isPrivatePath(path)).toBe(false);
  });
});
