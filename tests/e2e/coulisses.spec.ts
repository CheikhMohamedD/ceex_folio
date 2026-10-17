import { expect, test } from "@playwright/test";

/**
 * Les Coulisses vues de l'extérieur. La CI n'a ni base ni secrets : personne n'entre,
 * et c'est exactement ce qu'on vérifie. Le parcours du propriétaire (session en base)
 * se vérifie à la main, avec une base de test (README, « Coulisses »).
 */
const PRIVATE = [
  "/coulisses",
  "/coulisses/demandes",
  "/coulisses/cheikh-2-0",
  "/coulisses/boussole",
];

for (const path of PRIVATE) {
  test(`${path} renvoie vers /connexion sans session`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location ?? "", "http://x").pathname).toBe("/connexion");
  });
}

test("une adresse encodée passe par le même contrôle", async ({ request }) => {
  for (const path of ["/%63oulisses", "/%63oulisses/demandes"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/connexion");
  }
});

test("un faux cookie de session ne suffit pas", async ({ request }) => {
  for (const path of ["/coulisses", "/fr/coulisses/demandes"]) {
    const response = await request.get(path, {
      maxRedirects: 0,
      headers: {
        cookie: "better-auth.session_token=faux.faux; __Secure-better-auth.session_token=faux.faux",
      },
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/connexion");
  }
});

test("la connexion ne propose que GitHub, et n'est pas indexée", async ({ page }) => {
  const response = await page.goto("/connexion");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Les Coulisses");
  await expect(page.getByRole("main").getByRole("button")).toHaveText(["Continuer avec GitHub"]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  // Seule cette page laisse un formulaire partir vers github.com.
  expect(response?.headers()["content-security-policy"]).toContain(
    "form-action 'self' https://github.com;",
  );
});

test("le reste du site n'envoie aucun formulaire hors du site", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("form-action 'self';");
});

test("sans configuration, « Continuer avec GitHub » mène à la page neutre", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: "Continuer avec GitHub" }).click();
  await expect(page).toHaveURL(/\/connexion\/refus$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connexion impossible");
  await expect(page.getByText("Cet espace est privé.")).toBeVisible();
  // Rien sur ce qui a échoué ni sur qui peut entrer. (La page de connexion quittée reste
  // dans le DOM, cachée, le temps de la navigation : seul le texte visible compte.)
  await expect(
    page
      .getByRole("main")
      .getByText(/GitHub/)
      .filter({ visible: true }),
  ).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("les Coulisses n'existent qu'en français", async ({ request }) => {
  for (const path of ["/en/connexion", "/en/connexion/refus", "/en/coulisses"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect([307, 404]).toContain(response.status());
    if (response.status() === 307) expect(response.headers().location).toContain("/connexion");
  }
});

test("aucune trace des Coulisses dans le plan du site ni sur les pages publiques", async ({
  request,
  page,
}) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("coulisses");
  expect(sitemap).not.toContain("connexion");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /connexion");
  await page.goto("/");
  await expect(page.locator('a[href*="coulisses"], a[href*="connexion"]')).toHaveCount(0);
});

test("l'API d'authentification reste fermée tant qu'elle n'est pas configurée", async ({
  request,
}) => {
  const response = await request.get("/api/auth/get-session");
  expect(response.status()).toBe(404);
});
