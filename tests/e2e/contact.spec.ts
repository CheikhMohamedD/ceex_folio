import { expect, test, type Page } from "@playwright/test";

// Les envois restent en mémoire (CONTACT_STORE=memory, voir playwright.config.ts).
// Un parcours par largeur suffit : le thème ne change rien aux formulaires.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name.includes("sombre"), "Le thème ne change pas les formulaires.");
});

function directForm(page: Page) {
  return page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Envoyer mon message" }) });
}

test("porte 1 : les erreurs s'affichent, puis la demande part vers la page de remerciement", async ({
  page,
}) => {
  await page.goto("/#reach-out");
  const form = directForm(page);
  await form.getByRole("button", { name: "Envoyer mon message" }).click();

  await expect(form.getByText("Ce champ est à remplir.").first()).toBeVisible();
  await expect(form.getByText("Indique un email ou un numéro WhatsApp")).toBeVisible();
  await expect(form.getByLabel("Ton nom")).toBeFocused();
  await expect(form.getByLabel("Ton nom")).toHaveAttribute("aria-invalid", "true");

  await form.getByLabel("Ton nom").fill("Awa Ndiaye");
  await form.getByLabel("Email").fill("awa@example.sn");
  await form.getByLabel("Ton message").fill("Bonjour, je voudrais un site pour ma boutique.");
  await form.getByRole("button", { name: "Envoyer mon message" }).click();

  await expect(page).toHaveURL(/\/contact\/merci$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Ta demande est bien arrivée." }),
  ).toBeVisible();
});

test("porte 2 : neuf questions, un récapitulatif à corriger, l'envoi puis le brief PDF", async ({
  page,
}) => {
  await page.goto("/contact/parcours");
  const next = async (question: string) => {
    await page.getByRole("button", { name: "Suivant" }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: question })).toBeVisible();
  };

  await expect(page.getByText("Question 1 sur 9")).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).filter({ visible: true }).click();
  await expect(page.getByText("Choisis une réponse.")).toBeVisible();

  await page.getByLabel("Un site web").check();
  await next("Que doit faire ce projet, et quel problème règle-t-il ?");
  await expect(page.getByText("Question 2 sur 9")).toBeVisible();
  await page
    .getByLabel("Ce que doit faire le projet")
    .fill("Une boutique en ligne pour vendre nos tissus et livrer.");
  await next("Qui va l'utiliser ?");
  await page
    .getByRole("textbox", { name: "Qui va l'utiliser ?" })
    .fill("Nos clientes, sur téléphone.");
  await next("Où et comment sera-t-il utilisé ?");
  await next("Y a-t-il des contraintes déjà fixées ?");
  await next("Quel budget envisages-tu ?");
  await page.getByLabel("De 500 000 à 2 millions FCFA").check();
  await next("Pour quand ?");
  await page.getByLabel("D'ici trois mois").check();
  await next("À quoi verras-tu que c'est réussi ?");
  await next("Comment te joindre ?");
  await page.getByLabel("Ton nom").fill("Awa Ndiaye");
  await page.getByLabel("WhatsApp").fill("+221 77 123 45 67");
  await next("Ton récapitulatif");

  // Retour arrière depuis le récapitulatif, puis retour direct au récapitulatif.
  await page.getByRole("button", { name: "Modifier : Pour quand ?" }).click();
  await page.getByLabel("Dans le mois").check();
  await page.getByRole("button", { name: "Revenir au récapitulatif" }).click();
  await expect(page.locator("dl")).toContainText("Dans le mois");

  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByRole("heading", { name: "Merci, c'est noté." })).toBeFocused();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger mon brief (PDF)" }).click();
  expect((await download).suggestedFilename()).toBe("brief-ceexfolio.pdf");
});

test("le parcours garde les réponses au rechargement de la page", async ({ page }) => {
  await page.goto("/contact/parcours");
  await page.getByLabel("Une application mobile").check();
  await page.getByRole("button", { name: "Suivant" }).filter({ visible: true }).click();
  await expect(page.getByText("Question 2 sur 9")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Question 2 sur 9")).toBeVisible();
  await page.getByRole("button", { name: "Retour" }).filter({ visible: true }).click();
  await expect(page.getByLabel("Une application mobile")).toBeChecked();
});

test("la version anglaise du parcours", async ({ page }) => {
  await page.goto("/en/contact/parcours");
  await expect(
    page.getByRole("heading", { level: 1, name: "Help me frame my project" }),
  ).toBeVisible();
  await expect(page.getByText("Question 1 of 9")).toBeVisible();
  await expect(page.getByLabel("A website")).toBeVisible();
});

test.describe("sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  // Playwright coupe les scripts sans rendre les <noscript> : le HTML servi fait foi.
  test("le parcours sert ses neuf questions et un envoi pour les navigateurs sans script", async ({
    request,
  }) => {
    const html = await (await request.get("/contact/parcours")).text();
    expect(html.match(/<fieldset/g)).toHaveLength(9);
    expect(html).toContain("<noscript><style>.guided [data-step][hidden]{display:flex!important}");
    expect(html).toMatch(
      /<noscript><button type="submit"[^>]*>Envoyer ma demande<\/button><\/noscript>/,
    );
  });

  test("la porte 1 envoie sa demande", async ({ page }) => {
    await page.goto("/");
    const form = directForm(page);
    await form.getByLabel("Ton nom").fill("Awa Ndiaye");
    await form.getByLabel("WhatsApp").fill("+221 77 123 45 67");
    await form.getByLabel("Ton message").fill("Bonjour, une application pour ma ferme.");
    await form.getByRole("button", { name: "Envoyer mon message" }).click();
    await expect(page).toHaveURL(/\/contact\/merci$/);
  });
});
