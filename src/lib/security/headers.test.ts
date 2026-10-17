// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./headers";

describe("en-têtes de sécurité", () => {
  it("ferme la CSP de production", () => {
    const csp = contentSecurityPolicy({ isDev: false });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
    // Aucune origine externe : tout est servi par le site.
    expect(csp).not.toMatch(/https?:/);
  });

  it("n'ouvre que Cloudflare Turnstile, et seulement s'il est configuré", () => {
    const csp = contentSecurityPolicy({ isDev: false, turnstile: true });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp.match(/https?:\/\/[^\s;]+/g)).toEqual([
      "https://challenges.cloudflare.com",
      "https://challenges.cloudflare.com",
    ]);
  });

  it("n'ouvre eval et le websocket qu'en développement", () => {
    const csp = contentSecurityPolicy({ isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("envoie chaque en-tête une seule fois", () => {
    const names = securityHeaders({ isDev: false }).map((header) => header.key);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
      ]),
    );
  });
});
