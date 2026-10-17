import { expect, test } from "@playwright/test";

// Indépendant de l'écran et du thème : une seule configuration suffit.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "1440-clair", "Indépendant de l'écran et du thème.");
});

test("chaque version déclare les deux langues et x-default", async ({ page }) => {
  for (const path of ["/", "/en", "/projets/seetalma", "/en/services/site-web"]) {
    await page.goto(path);
    const links = page.locator('link[rel="alternate"][hreflang]');
    const hreflangs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("hreflang")),
    );
    expect(hreflangs.sort(), path).toEqual(["en", "fr", "x-default"]);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  }
});

test("l'accueil décrit une seule personne en données structurées", async ({ page }) => {
  await page.goto("/");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(json ?? "{}") as { "@type": string; mainEntity: { "@type": string } };
  expect(data["@type"]).toBe("ProfilePage");
  expect(data.mainEntity["@type"]).toBe("Person");
});

test("le plan du site, robots.txt et le flux RSS répondent", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/projets/seetalma");

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /coulisses");

  for (const feed of ["/blog/rss.xml", "/en/blog/rss.xml"]) {
    const response = await request.get(feed);
    expect(response.status(), feed).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
  }
});

test("le français n'a pas de préfixe : /fr renvoie vers la racine", async ({ request }) => {
  const response = await request.get("/fr/projets/seetalma", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/projets\/seetalma$/);
});

test("le sélecteur de langue garde la page", async ({ page }) => {
  await page.goto("/projets/seetalma");
  await page.getByRole("link", { name: "Lire ce site en anglais" }).click();
  await expect(page).toHaveURL(/\/en\/projets\/seetalma$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("le sélecteur de langue est juste dès le HTML, avant tout JavaScript", async ({ request }) => {
  const cases: Array<[string, string]> = [
    ["/", 'href="/en"'],
    ["/projets/seetalma", 'href="/en/projets/seetalma"'],
    ["/en/services", 'href="/services"'],
  ];
  for (const [path, target] of cases) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain(target);
  }
});
