import { expect, test } from "@playwright/test";

test("les onglets de dossier se pilotent au clavier", async ({ page }) => {
  await page.goto("/colophon#onglets");
  const tablist = page.getByRole("tablist", { name: "Filtrer les projets par catégorie" });
  const tabs = tablist.getByRole("tab");
  const panel = page.getByRole("tabpanel");

  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(panel).toContainText("Seetalma");
  await expect(panel).not.toContainText("Ferme Jambar");

  await page.keyboard.press("End");
  await expect(tabs.last()).toBeFocused();
  await expect(panel).toContainText("Safar 2026");

  await page.keyboard.press("Home");
  await expect(tabs.first()).toBeFocused();
});

test("le sommaire du colophon mène à chaque section", async ({ page }) => {
  await page.goto("/colophon");
  const toc = page.getByRole("navigation", { name: "Sommaire" });
  await toc.getByRole("link", { name: /Mesures/ }).click();
  await expect(page).toHaveURL(/#mesures$/);
  await expect(page.getByRole("heading", { level: 2, name: "Mesures" })).toBeInViewport();
});

test("les sections annoncées par la navigation existent sur l'accueil", async ({ page }) => {
  await page.goto("/");
  for (const id of ["prez", "pro-life", "hobbies", "reach-out"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("une adresse inconnue répond 404 avec un chemin de retour", async ({ page }) => {
  const response = await page.goto("/page-introuvable");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Cette page n'est pas dans le dossier.",
  );
  await expect(page.getByRole("link", { name: "Retour à l'accueil" })).toBeVisible();
});
