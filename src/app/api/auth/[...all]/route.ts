import { toNextJsHandler } from "better-auth/next-js";
import { authConfigured, getAuth } from "@/server/auth";

/** Les routes de Better Auth (connexion GitHub, retour OAuth, déconnexion) ; 404 tant qu'il n'est pas configuré. */
async function handle(request: Request): Promise<Response> {
  if (!authConfigured()) return new Response(null, { status: 404 });
  return toNextJsHandler(getAuth()).POST(request);
}

export { handle as GET, handle as POST };
