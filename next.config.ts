import path from "node:path";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/security/headers";

const isDev = process.env.NODE_ENV === "development";
// Turnstile protège les formulaires dès que sa clé publique est définie à la construction.
const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // Une seule page 404 pour les adresses inconnues : la mise en page racine dépend de la langue.
  experimental: { globalNotFound: true, inlineCss: true },
  // Le dépôt contient d'autres projets (motion/fekk) : la racine est fixée ici.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      // Toutes les pages sauf /connexion, dont le formulaire part vers GitHub.
      {
        source: "/((?!connexion$|connexion/).*)",
        headers: securityHeaders({ isDev, turnstile }),
      },
      {
        source: "/connexion/:path*",
        headers: securityHeaders({ isDev, turnstile, githubSignIn: true }),
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: {
    createMessagesDeclaration: "./src/i18n/messages/fr.json",
  },
});

// Études de cas et articles en MDX, importés par les pages (src/content).
const withMDX = createMDX({});

export default withNextIntl(withMDX(nextConfig));
