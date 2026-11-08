import { defineConfig, devices, type Project } from "@playwright/test";
import {
  COULISSES_DATABASE_URL,
  COULISSES_PORT,
  COULISSES_TEST_AUTH,
} from "./tests/e2e/support/coulisses-env";

/**
 * Deux modes. Par défaut, le site public et les Coulisses vues de l'extérieur, sans base.
 * Avec E2E_COULISSES=1 (`npm run e2e:coulisses`), le parcours du propriétaire sur la
 * base PostgreSQL de compose.yaml, avec une configuration d'authentification de test.
 */
const coulisses = process.env.E2E_COULISSES === "1";
const PORT = Number(process.env.PORT ?? (coulisses ? COULISSES_PORT : 3100));
const baseURL = `http://localhost:${PORT}`;
const OWNER_SPEC = /coulisses-proprietaire\.spec\.ts/;

// Chromium déjà présent sur la machine (conteneur, poste hors ligne) : sinon,
// `npx playwright install chromium` télécharge celui de Playwright.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

const phone = { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1440, height: 900 } };

/** Le site public et les Coulisses vues de l'extérieur : 360 et 1 440 px, clair et sombre. */
const publicProjects: Project[] = [
  { name: "360-clair", use: { ...devices["Desktop Chrome"], ...phone, colorScheme: "light" } },
  { name: "360-sombre", use: { ...devices["Desktop Chrome"], ...phone, colorScheme: "dark" } },
  { name: "1440-clair", use: { ...devices["Desktop Chrome"], ...desktop, colorScheme: "light" } },
  { name: "1440-sombre", use: { ...devices["Desktop Chrome"], ...desktop, colorScheme: "dark" } },
].map((project): Project => ({ ...project, testIgnore: OWNER_SPEC }));

/** Le parcours du propriétaire, au téléphone : la Boussole doit y rester utilisable. */
const ownerProjects: Project[] = [
  {
    name: "coulisses-360",
    testMatch: OWNER_SPEC,
    use: { ...devices["Desktop Chrome"], ...phone, colorScheme: "light" },
  },
];

/**
 * Sans base : les variables vides l'emportent sur un éventuel .env.local, que `next start`
 * lit aussi. Les formulaires de contact enregistrent en mémoire, et toutes les requêtes
 * venant de la même adresse, la limite d'envois est relevée.
 */
const publicEnv = {
  CONTACT_STORE: "memory",
  CONTACT_RATE_LIMIT: "1000",
  DATABASE_URL: "",
  BETTER_AUTH_SECRET: "",
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  ALLOWED_GITHUB_ID: "",
};

const coulissesEnv = {
  ...COULISSES_TEST_AUTH,
  DATABASE_URL: process.env.DATABASE_URL ?? COULISSES_DATABASE_URL,
  BETTER_AUTH_URL: baseURL,
  CONTACT_RATE_LIMIT: "1000",
};

/**
 * Tests de bout en bout sur le site construit (`npm run build` d'abord) :
 * 360 et 1 440 px de large, thème clair et sombre du système.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: !coulisses,
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
  projects: coulisses ? ownerProjects : publicProjects,
  // Une seule base pour tout le parcours : un seul navigateur à la fois.
  workers: coulisses ? 1 : undefined,
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    env: coulisses ? coulissesEnv : publicEnv,
    // Le mode Coulisses démarre toujours son propre serveur : il lui faut sa configuration.
    reuseExistingServer: !coulisses && !process.env.CI,
    timeout: 120_000,
  },
});
