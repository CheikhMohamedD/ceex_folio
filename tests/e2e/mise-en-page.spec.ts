import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/en",
  "/colophon",
  "/projets/seetalma",
  "/en/projets/ferme-jambar",
  "/services",
  "/services/application-mobile",
  "/blog",
  "/contact/parcours",
  "/en/contact/parcours",
  "/contact/merci",
];

for (const path of PAGES) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
    });

    test("aucun défilement horizontal", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("aucun texte visible sous 12 px", async ({ page }) => {
      const tooSmall = await page.evaluate(() => {
        const found: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent?.trim();
          const element = walker.currentNode.parentElement;
          if (!text || !element) continue;
          if (element.closest("[aria-hidden='true'], [hidden], .sr-only, script, style")) continue;
          if (element.getClientRects().length === 0) continue;
          const size = Number.parseFloat(getComputedStyle(element).fontSize);
          if (size < 12) found.push(`${size}px : « ${text.slice(0, 40)} »`);
        }
        return found;
      });
      expect(tooSmall).toEqual([]);
    });

    test("cibles tactiles d'au moins 44 × 44 px", async ({ page }) => {
      const small = await page.evaluate(() => {
        const found: string[] = [];
        // Les liens de titre des fiches couvrent toute la carte (lien étiré) : la carte est la cible.
        const targets = document.querySelectorAll<HTMLElement>("a, button, [role='tab']");
        for (const target of targets) {
          if (target.closest("article, [inert], .sr-only")) continue;
          const box = target.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) continue;
          if (box.width < 44 || box.height < 44) {
            const name = target.getAttribute("aria-label") ?? target.textContent?.trim() ?? "";
            found.push(`${Math.round(box.width)}×${Math.round(box.height)} : ${name.slice(0, 40)}`);
          }
        }
        return found;
      });
      expect(small).toEqual([]);
    });
  });
}
