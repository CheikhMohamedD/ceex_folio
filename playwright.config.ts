import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

// Chromium déjà présent sur la machine (conteneur, poste hors ligne) : sinon,
// `npx playwright install chromium` télécharge celui de Playwright.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

const phone = { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1440, height: 900 } };

/**
 * Tests de bout en bout sur le site construit (`npm run build` d'abord) :
 * 360 et 1 440 px de large, thème clair et sombre du système.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    locale: "fr-FR",
    timezoneId: "Africa/Dakar",
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "360-clair", use: { ...devices["Desktop Chrome"], ...phone, colorScheme: "light" } },
    { name: "360-sombre", use: { ...devices["Desktop Chrome"], ...phone, colorScheme: "dark" } },
    { name: "1440-clair", use: { ...devices["Desktop Chrome"], ...desktop, colorScheme: "light" } },
    { name: "1440-sombre", use: { ...devices["Desktop Chrome"], ...desktop, colorScheme: "dark" } },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
