import { expect, test } from "@playwright/test";

// Les moments GSAP arrivent une fois la page au repos : on attend leurs traces dans le DOM.
const idle = { timeout: 15_000 };

test.describe("avec les animations", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name.includes("sombre"), "Le thème ne change pas le mouvement.");
  });

  test("GSAP arrive après l'affichage et le trait suit la section en cours", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".section-mark").first()).toBeAttached(idle);
    await page.locator("#hobbies").scrollIntoViewIfNeeded();
    await expect(page.locator(".section-mark").first()).toHaveCSS("opacity", "1", idle);
  });

  test("les tuiles de Prez finissent visibles et à leur place", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".section-mark").first()).toBeAttached(idle);
    const tiles = page.getByRole("list", { name: "Ce que je fais" }).getByRole("listitem");
    await tiles.first().scrollIntoViewIfNeeded();
    await expect(tiles.last()).toHaveCSS("opacity", "1", idle);
    await expect(tiles.last()).toHaveCSS("transform", /none|matrix\(1, 0, 0, 1, 0, 0\)/, idle);
  });

  test("un onglet de Pro life ne garde que sa catégorie, après le glissement", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".section-mark").first()).toBeAttached(idle);
    const tabs = page.getByRole("tablist", { name: "Filtrer les projets" });
    await tabs.scrollIntoViewIfNeeded();
    await tabs.hover();
    await tabs.getByRole("tab", { name: /Mobile/ }).click();
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("link", { name: "Ferme Jambar" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Seetalma" })).toBeHidden();
  });

  test("une fiche ouvre son étude de cas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Seetalma" }).first().click();
    await expect(page).toHaveURL(/\/projets\/seetalma$/);
    await expect(page.getByRole("heading", { level: 1, name: "Seetalma" })).toBeVisible();
  });

  test("pas de scène 3D sur mobile", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("360"), "Largeur mobile seulement.");
    await page.goto("/");
    await expect(page.locator(".section-mark").first()).toBeAttached(idle);
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

test.describe("avec « réduire les animations »", () => {
  test.use({ reducedMotion: "reduce" });

  test("rien ne se charge ni ne bouge, et tout le contenu est là", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    await expect(page.locator(".section-mark")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Reach out" })).toBeAttached();
    const html = await page.content();
    expect(html).not.toContain('data-scene="on"');
    expect(scripts.length).toBeGreaterThan(0);
  });
});
