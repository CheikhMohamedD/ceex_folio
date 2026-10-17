import { expect, test, type Page } from "@playwright/test";

const PAPER = { light: "rgb(242, 238, 230)", dark: "rgb(20, 18, 15)" } as const;

const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test("le thème suit le système tant que rien n'est choisi", async ({ page }, testInfo) => {
  await page.goto("/");
  const scheme = testInfo.project.use.colorScheme === "dark" ? "dark" : "light";
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(await background(page)).toBe(PAPER[scheme]);
});

test("le bouton passe de système à clair puis sombre, et le choix tient au rechargement", async ({
  page,
}) => {
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /^Thème/ });

  await expect(toggle).toHaveAccessibleName("Thème système, passer au thème clair");
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "light");
  expect(await background(page)).toBe(PAPER.light);

  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await background(page)).toBe(PAPER.dark);

  // Le script inline applique le choix avant le premier affichage : pas de flash.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await background(page)).toBe(PAPER.dark);

  await toggle.click();
  await expect(html).not.toHaveAttribute("data-theme");
});
