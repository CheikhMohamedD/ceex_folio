import type { MetadataRoute } from "next";
import { getPosts } from "@/content/blog/load";
import { PROJECTS } from "@/content/projects/registry";
import { SERVICES } from "@/content/services";
import { localizedPath } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";

function entry(href: string): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${SITE.url}${localizedPath(href, locale)}`]),
  );
  return {
    url: `${SITE.url}${localizedPath(href, routing.defaultLocale)}`,
    alternates: { languages },
  };
}

/** Plan du site : chaque page publique, avec sa version anglaise. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    entry("/"),
    entry("/services"),
    ...SERVICES.map((service) => entry(`/services/${service.slug}`)),
    ...PROJECTS.map((project) => entry(`/projets/${project.slug}`)),
    entry("/contact/parcours"),
    entry("/blog"),
    { url: `${SITE.url}/colophon` },
  ];
  const posts = (
    await Promise.all(
      routing.locales.map(async (locale) =>
        (await getPosts(locale))
          .filter((post) => !post.meta.draft)
          .map((post) => ({
            url: `${SITE.url}${localizedPath(`/blog/${post.slug}`, locale)}`,
            lastModified: post.meta.updated ?? post.meta.date,
          })),
      ),
    )
  ).flat();
  return [...pages, ...posts];
}
