import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { INTRUDER_GITHUB_ID, OWNER_GITHUB_ID, SESSION_COOKIE } from "./support/coulisses-env";
import { countSessions, createSession, resetDatabase, seedRequests } from "./support/database";

/**
 * Le parcours du propriétaire dans les Coulisses, sur une vraie base PostgreSQL (celle de
 * compose.yaml) : `npm run db:up`, puis `npm run e2e:coulisses`. Joué à 360 px de large,
 * car la Boussole doit rester utilisable au téléphone. Les tests se suivent et partagent
 * la même base : chacun part de ce que le précédent a laissé.
 */
test.describe.configure({ mode: "serial" });

let ownerCookie = "";

test.beforeAll(async () => {
  await resetDatabase();
  await seedRequests();
  ownerCookie = await createSession(OWNER_GITHUB_ID, "Cheikh Diack");
});

async function signIn(page: Page, cookie = ownerCookie) {
  const baseURL = test.info().project.use.baseURL ?? "";
  await page.context().addCookies([{ name: SESSION_COOKIE, value: cookie, url: baseURL }]);
}

test("un autre compte GitHub, même avec une vraie session, ne passe pas", async ({ request }) => {
  const intruder = await createSession(INTRUDER_GITHUB_ID, "Intrus");
  for (const path of ["/coulisses", "/coulisses/demandes", "/%63oulisses/boussole"]) {
    const response = await request.get(path, {
      maxRedirects: 0,
      headers: { cookie: `${SESSION_COOKIE}=${intruder}` },
    });
    expect(response.status(), path).toBe(307);
    expect(response.headers().location).toContain("/connexion");
  }
});

test("le tableau de bord réunit les trois indicateurs", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tableau de bord");
  const main = page.getByRole("main");
  // La valeur de la carte, puis la même phrase sous la barre de progression.
  await expect(main.getByText("0 / 12 tâches", { exact: true }).first()).toBeVisible();
  await expect(main.getByText("1 nouvelle", { exact: true })).toBeVisible();
  await expect(main.getByText("Aucun projet actif", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("la feuille de route garde ses cases cochées", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses/cheikh-2-0");
  const boxes = page.locator("#roadmap input[type=checkbox]");
  await expect(boxes).toHaveCount(12);
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await expect(page.locator("#roadmap").getByText("2 / 12 tâches")).toBeVisible();
  // L'enregistrement suit la case cochée : on attend que la base l'ait reçu.
  await expect(async () => {
    await page.reload();
    await expect(page.locator("#roadmap input[type=checkbox]:checked")).toHaveCount(2);
  }).toPass({ timeout: 10_000 });
});

test("une fiche passe le sas, part en PDF, puis au parking de la Boussole", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses/cheikh-2-0");
  const exportButton = page.getByRole("button", { name: "Enregistrer et exporter le PDF" });
  await expect(exportButton).toBeDisabled();

  const fields: Array<[string, string]> = [
    ["Quoi", "L'écran de saisie de la ponte, par bâtiment"],
    ["Pourquoi", "Tout est noté sur papier"],
    ["Pour qui", "Le gérant de la Ferme Jambar"],
    ["Où et dans quel contexte", "Au poulailler, sur Android, sans réseau"],
    ["Contraintes", "Expo, hors ligne"],
    ["C'est réussi si…", "Le gérant l'utilise seul 7 jours de suite"],
  ];
  for (const [label, value] of fields) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await expect(page.locator("#prompt").getByText("Clarté 6/6")).toBeVisible();

  await page.getByLabel("Nom de l'idée").fill("Saisie de la ponte");
  const questions = page.locator("#sas [role=group]");
  await questions.nth(0).getByRole("button", { name: "Non" }).click();
  for (const index of [1, 2, 3]) {
    await questions.nth(index).getByRole("button", { name: "Oui" }).click();
  }
  await expect(page.locator("#sas").getByText("Parking · Saisie de la ponte")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
  expect(download.suggestedFilename()).toMatch(
    /^cadrage-\d{4}-\d{2}-\d{2}-l-ecran-de-saisie-de\.pdf$/,
  );

  const history = page.locator("#historique");
  await expect(history.getByRole("article")).toHaveCount(1);
  await expect(history.getByRole("heading", { name: "Saisie de la ponte" })).toBeVisible();
  await history.getByRole("button", { name: "Garer dans la Boussole" }).click();
  await expect(history.getByRole("link", { name: "Dans la Boussole" })).toBeVisible();
});

test("la Boussole range rêves et projets, avec un seul projet actif", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses/boussole");

  // L'idée garée depuis Cheikh 2.0 est déjà dans la boîte.
  const projects = page.locator("#projets ol > li");
  await expect(projects).toHaveCount(1);
  await expect(projects.first()).toContainText("Sorti du parking de Cheikh 2.0");

  await page.getByLabel("Ton rêve").fill("Une agence produit à Dakar");
  await page.getByRole("button", { name: "Ajouter le rêve" }).click();
  await expect(page.locator("#reves").getByRole("article")).toHaveCount(1);

  await page.getByText("Ajouter un projet").click();
  const form = page.locator("#projets > details").first();
  await form.getByLabel("Projet", { exact: true }).fill("Atelier, website builder");
  await form.getByLabel("Impact, de 1 à 5").selectOption("5");
  await form.getByLabel("Étape du parcours").selectOption("4");
  await form.getByLabel("Rêve relié").selectOption({ label: "Une agence produit à Dakar" });
  await form.getByRole("checkbox", { name: "Planifier" }).check();
  await form.getByRole("button", { name: "Ajouter le projet" }).click();

  // Faisabilité 3 × impact 5 = 15 : il passe devant l'idée garée (3 × 3).
  await expect(projects).toHaveCount(2);
  await expect(projects.first().getByRole("heading")).toHaveText("Atelier, website builder");
  await expect(projects.first()).toContainText("Rêve : Une agence produit à Dakar");

  await projects.first().getByRole("button", { name: "En faire le projet actif" }).click();
  await expect(projects.first().getByText("Projet actif", { exact: true })).toBeVisible();
  await projects.nth(1).getByRole("button", { name: "En faire le projet actif" }).click();
  await expect(page.locator("#projets").getByText("Projet actif", { exact: true })).toHaveCount(1);
  await expect(projects.nth(1).getByText("Projet actif", { exact: true })).toBeVisible();

  await page.goto("/coulisses");
  await expect(
    page.getByRole("main").getByText("Saisie de la ponte", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("2 / 12 tâches", { exact: true }).first(),
  ).toBeVisible();
});

test("une demande avance dans son cycle", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses/demandes");
  const request = page.getByRole("article").filter({ hasText: "Awa Ndiaye" });
  await request.getByLabel("Statut de la demande").selectOption("IN_DISCUSSION");
  await request.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(request.getByText("Enregistré.")).toBeVisible();
  await expect(request.locator(".pill").first()).toHaveText("En discussion");

  await page.goto("/coulisses/demandes?statut=NEW");
  await expect(page.getByText("Aucune demande avec ce statut.")).toBeVisible();
});

test("les quatre pages restent lisibles et accessibles à 360 et 1 440 px", async ({ page }) => {
  await signIn(page);
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/coulisses",
      "/coulisses/demandes",
      "/coulisses/cheikh-2-0",
      "/coulisses/boussole",
    ]) {
      await page.goto(path);
      // Les formulaires repliés (modifier, supprimer, brief complet) comptent aussi.
      await page.evaluate(() =>
        document.querySelectorAll("details").forEach((d) => (d.open = true)),
      );
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${path} à ${width} px`).toBeLessThanOrEqual(width);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const violations = results.violations.map(
        (violation) =>
          `${violation.id} : ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
      );
      expect(violations, `${path} à ${width} px`).toEqual([]);
    }
  }
});

test("la déconnexion ferme la session en base", async ({ page }) => {
  await signIn(page);
  await page.goto("/coulisses");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  expect(await countSessions(OWNER_GITHUB_ID)).toBe(0);
  await page.goto("/coulisses");
  await expect(page).toHaveURL(/\/connexion$/);
});
