import { expect, test } from "@playwright/test";

test("chaque page envoie les en-têtes de sécurité", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "1440-clair", "Indépendant de l'écran et du thème.");
  for (const path of ["/", "/colophon", "/page-introuvable"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");
    expect(headers["x-powered-by"]).toBeUndefined();
  }
});
