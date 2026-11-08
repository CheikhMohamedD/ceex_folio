/**
 * Réglages des tests des Coulisses sur une vraie base (`npm run e2e:coulisses`), partagés
 * par playwright.config.ts, le script de lancement et les tests. Ce sont des valeurs de
 * test : la base est celle de compose.yaml, et ces secrets ne servent nulle part ailleurs.
 */
export const COULISSES_DATABASE_URL = "postgresql://ceex:ceex@localhost:5433/ceexfolio_test";

/** Port à part : un serveur déjà lancé sur 3100, sans base, ne peut pas être réutilisé. */
export const COULISSES_PORT = 3300;

/** Le compte GitHub autorisé pendant les tests, et un autre qui ne l'est pas. */
export const OWNER_GITHUB_ID = "1000001";
export const INTRUDER_GITHUB_ID = "1000002";

export const COULISSES_TEST_AUTH = {
  BETTER_AUTH_SECRET: "secret-des-tests-e2e-des-coulisses-jamais-en-production",
  GITHUB_CLIENT_ID: "e2e-client-id",
  GITHUB_CLIENT_SECRET: "e2e-client-secret",
  ALLOWED_GITHUB_ID: OWNER_GITHUB_ID,
} as const;

/** Cookie de session de Better Auth sur une adresse http (sans le préfixe __Secure-). */
export const SESSION_COOKIE = "better-auth.session_token";
