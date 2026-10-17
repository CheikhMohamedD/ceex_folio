import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/en",
  "/colophon",
  "/projets/seetalma",
  "/en/projets/ferme-jambar",
  "/services",
  "/services/identite-visuelle",
  "/blog",
  "/contact/parcours",
  "/en/contact/parcours",
  "/contact/merci",
  "/page-introuvable",
];

for (const path of PAGES) {
  test(`${path} : aucune violation WCAG 2.2 AA (axe-core)`, async ({ page }) => {
    // État final, sans élément à mi-fondu : les animations finissent toutes là (et le
    // test de console ci-dessous les garde actives).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = results.violations.map(
      (violation) =>
        `${violation.id} (${violation.impact}) : ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
    );
    expect(violations).toEqual([]);
  });

  test(`${path} : aucune erreur dans la console, CSP comprise`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("404"))
        errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("le lien d'évitement mène au contenu", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenu$/);
});
