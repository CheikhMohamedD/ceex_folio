import { getTranslations } from "next-intl/server";
import { getPosts } from "@/content/blog/load";
import { localizedPath } from "@/i18n/paths";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Flux RSS 2.0 des articles publiés d'une langue. */
export async function GET(_request: Request, context: RouteContext<"/[locale]/blog/rss.xml">) {
  const { locale: requested } = await context.params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = (await getPosts(locale)).filter((post) => !post.meta.draft);
  const blogUrl = `${SITE.url}${localizedPath("/blog", locale)}`;

  const items = posts
    .map((post) => {
      const url = `${SITE.url}${localizedPath(`/blog/${post.slug}`, locale)}`;
      return `    <item>
      <title>${escape(post.meta.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escape(post.meta.description)}</description>
      <pubDate>${new Date(`${post.meta.date}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(t("rssTitle"))}</title>
    <link>${blogUrl}</link>
    <description>${escape(t("meta.description"))}</description>
    <language>${locale}</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
