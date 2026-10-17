import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { allowedGithubId, isOwnerGithubId } from "@/lib/auth/owner";
import { SITE } from "@/lib/site";
import { db } from "@/server/db";

/** Page neutre de refus : elle ne dit pas pourquoi, ni à qui l'espace est réservé. */
export const REFUSED_PATH = "/connexion/refus";
export const SIGN_IN_PATH = "/connexion";
export const HOME_PATH = "/coulisses";

/**
 * Les Coulisses ne s'ouvrent que si tout est configuré : la base, le secret des
 * sessions, l'application OAuth GitHub et ton identifiant. Sinon, personne n'entre.
 */
export function authConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    allowedGithubId(process.env.ALLOWED_GITHUB_ID),
  );
}

function createAuth() {
  const allowed = allowedGithubId(process.env.ALLOWED_GITHUB_ID);
  return betterAuth({
    appName: SITE.name,
    baseURL: process.env.BETTER_AUTH_URL ?? SITE.url,
    database: prismaAdapter(db(), { provider: "postgresql" }),
    telemetry: { enabled: false },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
        // L'identifiant numérique reste sur la fiche : requireOwner() le revérifie.
        mapProfileToUser: (profile) => ({ githubId: String(profile.id) }),
      },
    },
    user: {
      additionalFields: { githubId: { type: "string", required: false, input: false } },
      // Niveau 2 : avant toute création de compte, liaison ou connexion par GitHub,
      // l'identifiant du profil renvoyé par GitHub doit être le tien.
      validateUserInfo: async ({ source }) => {
        const ok =
          source.method === "oauth" &&
          source.oauth?.providerId === "github" &&
          isOwnerGithubId(source.oauth.profile?.id, allowed);
        return ok ? undefined : { error: "access_denied" };
      },
    },
    // Pas de rattachement d'un compte GitHub à une fiche existante par son email ; le
    // jeton GitHub, inutile ici, n'est gardé que chiffré.
    account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
    databaseHooks: {
      session: {
        create: {
          // Une session ne naît que pour la fiche reliée à ton compte GitHub.
          before: async (session, context) => {
            const accounts = await context?.context.internalAdapter.findAccounts(session.userId);
            const owner = accounts?.some(
              (account) =>
                account.providerId === "github" && isOwnerGithubId(account.accountId, allowed),
            );
            return owner ? undefined : false;
          },
        },
      },
    },
    onAPIError: { errorURL: REFUSED_PATH },
    // Toujours en dernier : écrit les cookies depuis les Server Actions.
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Owner = { id: string; name: string; image: string | null };

const globalForAuth = globalThis as unknown as { auth?: Auth };

/** Better Auth, créé au premier appel : la construction et les pages publiques s'en passent. */
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}

/**
 * Le propriétaire derrière ces en-têtes de requête, ou null : session relue en base,
 * puis identifiant GitHub comparé à ALLOWED_GITHUB_ID. Sert au proxy (niveau 1) et à
 * requireOwner() (niveau 3). Lecture seule : le proxy ne prolonge pas la session.
 */
export async function ownerFromHeaders(
  requestHeaders: Headers,
  { refresh = true }: { refresh?: boolean } = {},
): Promise<Owner | null> {
  if (!authConfigured()) return null;
  const session = await getAuth().api.getSession({
    headers: requestHeaders,
    query: refresh ? undefined : { disableRefresh: true },
  });
  const user = session?.user;
  if (!user || !isOwnerGithubId(user.githubId, allowedGithubId(process.env.ALLOWED_GITHUB_ID))) {
    return null;
  }
  return { id: user.id, name: user.name, image: user.image ?? null };
}
