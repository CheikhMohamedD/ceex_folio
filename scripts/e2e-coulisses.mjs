/**
 * Tests des Coulisses sur une vraie base : `npm run db:up`, `npm run build`, puis
 * `npm run e2e:coulisses`. Le script crée la base de test si elle manque, y applique les
 * migrations, puis lance Playwright en mode Coulisses. Les arguments suivants passent à
 * Playwright (par exemple `npm run e2e:coulisses -- --headed`).
 *
 * DATABASE_URL vaut par défaut la base de test de compose.yaml (ceexfolio_test, port
 * 5433), jamais celle du développement : les tests la vident à chaque passage.
 */
import { spawnSync } from "node:child_process";
import pg from "pg";

const DEFAULT_URL = "postgresql://ceex:ceex@localhost:5433/ceexfolio_test";
const databaseUrl = process.env.E2E_DATABASE_URL ?? DEFAULT_URL;
const database = new URL(databaseUrl).pathname.slice(1);

if (!/^\w+_test$/.test(database)) {
  console.error(
    `Base « ${database} » refusée : les tests la vident, son nom doit finir par _test.`,
  );
  process.exit(1);
}

/** La base de maintenance « postgres » du même serveur, pour créer la base de test. */
const admin = new URL(databaseUrl);
admin.pathname = "/postgres";
const client = new pg.Client({ connectionString: admin.toString() });
try {
  await client.connect();
} catch (error) {
  console.error(`PostgreSQL injoignable (${error.message}). Lance d'abord : npm run db:up`);
  process.exit(1);
}
const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
if (rowCount === 0) {
  await client.query(`CREATE DATABASE "${database}"`);
  console.log(`Base ${database} créée.`);
}
await client.end();

const env = { ...process.env, DATABASE_URL: databaseUrl };
const shell = process.platform === "win32";

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell,
    env: { ...env, ...extraEnv },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["--no", "prisma", "migrate", "deploy"]);
run("npx", ["--no", "playwright", "test", ...process.argv.slice(2)], { E2E_COULISSES: "1" });
