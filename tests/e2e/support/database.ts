import { createHmac, randomBytes } from "node:crypto";
import { Client } from "pg";
import { COULISSES_DATABASE_URL, COULISSES_TEST_AUTH } from "./coulisses-env";

/**
 * Accès direct à la base de test des Coulisses. La connexion GitHub ne peut pas se jouer
 * en test (elle passe par github.com) : on crée donc en base ce qu'elle aurait créé, un
 * utilisateur, son compte GitHub et une session, et on signe le cookie comme Better Auth
 * (HMAC-SHA256 du jeton avec BETTER_AUTH_SECRET). Rien de tout cela n'existe hors des tests.
 */
async function withDatabase<T>(work: (client: Client) => Promise<T>): Promise<T> {
  const connectionString = process.env.DATABASE_URL ?? COULISSES_DATABASE_URL;
  // Les tests vident la base : jamais une autre que celle des tests.
  if (!new URL(connectionString).pathname.endsWith("_test")) {
    throw new Error(
      "Les tests des Coulisses ne tournent que sur une base dont le nom finit par _test.",
    );
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Repart d'une base vide : Coulisses, comptes et demandes. */
export function resetDatabase(): Promise<void> {
  return withDatabase(async (client) => {
    await client.query(
      `TRUNCATE "FramingSheet", "CompassProject", "Dream", "RoadmapTask", "ClientRequest",
        "session", "account", "verification", "user" CASCADE`,
    );
  });
}

/** Deux demandes reçues : une directe, nouvelle ; une guidée, déjà qualifiée. */
export function seedRequests(): Promise<void> {
  return withDatabase(async (client) => {
    await client.query(
      `INSERT INTO "ClientRequest" (id, channel, locale, name, email, message, status)
       VALUES ('e2edemande0000000000000001', 'DIRECT', 'fr', 'Awa Ndiaye', 'awa@example.test',
         'Bonjour, je veux un site pour ma boutique de tissus à Dakar.', 'NEW')`,
    );
    await client.query(
      `INSERT INTO "ClientRequest" (id, channel, locale, name, whatsapp, "projectType", goal,
         "budgetRange", deadline, "successCriterion", "qualificationScore", status)
       VALUES ('e2edemande0000000000000002', 'GUIDED', 'fr', 'Moussa Fall', '+221 77 123 45 67',
         'mobile', 'Une application pour suivre les livraisons de mes trois camions',
         '500k-2m', 'quarter', 'Je sais où est chaque camion en temps réel', 4, 'QUALIFIED')`,
    );
  });
}

function signedCookieValue(token: string): string {
  const signature = createHmac("sha256", COULISSES_TEST_AUTH.BETTER_AUTH_SECRET)
    .update(token)
    .digest("base64");
  return encodeURIComponent(`${token}.${signature}`);
}

/**
 * Un utilisateur relié au compte GitHub `githubId`, avec une session valable 7 jours.
 * Renvoie la valeur du cookie de session à poser dans le navigateur.
 */
export function createSession(githubId: string, name: string): Promise<string> {
  return withDatabase(async (client) => {
    const userId = `e2e-utilisateur-${githubId}`;
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "githubId")
       VALUES ($1, $2, $3, true, $4) ON CONFLICT (id) DO NOTHING`,
      [userId, name, `${githubId}@example.test`, githubId],
    );
    await client.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", "updatedAt")
       VALUES ($1, $2, 'github', $3, now()) ON CONFLICT (id) DO NOTHING`,
      [`e2e-compte-${githubId}`, githubId, userId],
    );
    const token = randomBytes(24).toString("hex");
    await client.query(
      `INSERT INTO "session" (id, "expiresAt", token, "updatedAt", "userId")
       VALUES ($1, now() + interval '7 days', $2, now(), $3)`,
      [`e2e-session-${token.slice(0, 12)}`, token, userId],
    );
    return signedCookieValue(token);
  });
}

/** Nombre de sessions encore ouvertes pour ce compte GitHub (la déconnexion les ferme). */
export function countSessions(githubId: string): Promise<number> {
  return withDatabase(async (client) => {
    const result = await client.query<{ count: string }>(
      `SELECT count(*) FROM "session" WHERE "userId" = $1`,
      [`e2e-utilisateur-${githubId}`],
    );
    return Number(result.rows[0]?.count ?? 0);
  });
}
