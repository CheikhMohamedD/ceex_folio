import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Tout est public, sauf les Coulisses et les routes internes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/coulisses", "/connexion", "/api/"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
