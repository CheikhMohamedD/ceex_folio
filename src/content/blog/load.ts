import type { MDXContent } from "mdx/types";
import type { Locale } from "@/i18n/routing";
import { postMetadata, type PostMetadata } from "./schema";

type PostModule = { default: MDXContent; metadata: unknown };

/**
 * Un article = un dossier, un MDX par langue disponible. Un article peut n'exister
 * qu'en français : il n'apparaît alors pas dans le blog anglais.
 */
const SOURCES: Record<string, Partial<Record<Locale, () => Promise<PostModule>>>> = {
  "comment-ce-portfolio-est-construit": {
    fr: () => import("./comment-ce-portfolio-est-construit/fr.mdx"),
  },
};

export type Post = { slug: string; meta: PostMetadata; Content: MDXContent };

const showDrafts = process.env.NODE_ENV !== "production";

export async function getPost(slug: string, locale: Locale): Promise<Post | null> {
  const source = SOURCES[slug]?.[locale];
  if (!source) return null;
  const loaded = await source();
  const parsed = postMetadata.safeParse(loaded.metadata);
  if (!parsed.success) {
    throw new Error(
      `En-tête invalide pour l'article ${slug} (${locale}) : ${parsed.error.message}`,
    );
  }
  if (parsed.data.draft && !showDrafts) return null;
  return { slug, meta: parsed.data, Content: loaded.default };
}

/** Articles publiés d'une langue, du plus récent au plus ancien. */
export async function getPosts(locale: Locale): Promise<Post[]> {
  const posts = await Promise.all(Object.keys(SOURCES).map((slug) => getPost(slug, locale)));
  return posts
    .filter((post): post is Post => post !== null)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export function postSlugs(locale: Locale): string[] {
  return Object.entries(SOURCES)
    .filter(([, sources]) => sources[locale])
    .map(([slug]) => slug);
}
