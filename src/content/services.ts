import type { Category } from "@/lib/design/categories";

/** Les trois services ; leurs textes sont dans les messages (services.items.*). */
export const SERVICES = [
  { slug: "site-web", category: "web", projectType: "website" },
  { slug: "application-mobile", category: "mobile", projectType: "mobile" },
  { slug: "identite-visuelle", category: "design", projectType: "identity" },
] as const satisfies readonly { slug: string; category: Category; projectType: string }[];

export type ServiceSlug = (typeof SERVICES)[number]["slug"];

export function isServiceSlug(value: string): value is ServiceSlug {
  return SERVICES.some((service) => service.slug === value);
}

/** Les livrables et les étapes sont numérotés de 1 à 4 dans les messages. */
export const SERVICE_ITEMS = ["1", "2", "3", "4"] as const;
