/**
 * En-têtes de sécurité envoyés sur toutes les pages, définis en un seul endroit :
 * next.config.ts les applique, la page /colophon les affiche.
 *
 * Les pages publiques sont générées à la construction, donc sans nonce par requête :
 * `script-src` garde 'unsafe-inline' pour les scripts que Next.js insère dans le HTML
 * (et pour le script de thème). Tout le reste est fermé : aucune source externe,
 * pas d'eval en production, pas d'iframe, pas de plugin.
 */
export type SecurityHeaderName =
  | "Content-Security-Policy"
  | "X-Frame-Options"
  | "X-Content-Type-Options"
  | "Referrer-Policy"
  | "Permissions-Policy"
  | "Cross-Origin-Opener-Policy"
  | "Strict-Transport-Security";

export type SecurityHeader = { key: SecurityHeaderName; value: string };

export function contentSecurityPolicy({ isDev }: { isDev: boolean }): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export function securityHeaders({ isDev }: { isDev: boolean }): SecurityHeader[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ isDev }) },
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
