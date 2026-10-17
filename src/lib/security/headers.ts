/**
 * En-têtes de sécurité envoyés sur toutes les pages, définis en un seul endroit :
 * next.config.ts les applique, la page /colophon les affiche.
 *
 * Les pages publiques sont générées à la construction, donc sans nonce par requête :
 * `script-src` garde 'unsafe-inline' pour les scripts que Next.js insère dans le HTML
 * (et pour le script de thème). Tout le reste est fermé : aucune source externe,
 * pas d'eval en production, pas d'iframe, pas de plugin.
 *
 * Deux exceptions. Quand Turnstile est configuré (clé publique définie à la
 * construction) : son script et son iframe, servis par challenges.cloudflare.com. Et
 * sur /connexion seulement : le formulaire « Continuer avec GitHub » mène à
 * github.com, ce que form-action doit permettre (même sans JavaScript).
 */
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
const GITHUB_ORIGIN = "https://github.com";

type PolicyOptions = { isDev: boolean; turnstile?: boolean; githubSignIn?: boolean };

export type SecurityHeaderName =
  | "Content-Security-Policy"
  | "X-Frame-Options"
  | "X-Content-Type-Options"
  | "Referrer-Policy"
  | "Permissions-Policy"
  | "Cross-Origin-Opener-Policy"
  | "Strict-Transport-Security";

export type SecurityHeader = { key: SecurityHeaderName; value: string };

export function contentSecurityPolicy({
  isDev,
  turnstile = false,
  githubSignIn = false,
}: PolicyOptions): string {
  const external = turnstile ? [TURNSTILE_ORIGIN] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...external],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    ...(turnstile ? { "frame-src": external } : {}),
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", ...(githubSignIn ? [GITHUB_ORIGIN] : [])],
    "frame-ancestors": ["'none'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export function securityHeaders(options: PolicyOptions): SecurityHeader[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ];
}
