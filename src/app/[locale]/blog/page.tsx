import { Rss } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Masthead } from "@/components/ui/masthead";
import { Stamp } from "@/components/ui/stamp";
import { getPosts } from "@/content/blog/load";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { alternates } from "@/lib/seo/alternates";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      ...alternates(locale, "/blog"),
      types: { "application/rss+xml": locale === "fr" ? "/blog/rss.xml" : "/en/blog/rss.xml" },
    },
  };
}

/** Le blog : les articles publiés, du plus récent au plus ancien. */
export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const locale = await pageLocale(params);
  const t = await getTranslations("blog");
  const format = await getFormatter();
  const posts = await getPosts(locale);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:px-20 lg:pt-12 lg:pb-24">
      <Masthead start={t("masthead")} />
      <header className="flex flex-col gap-5">
        <h1 className="font-display text-section font-semibold">{t("title")}</h1>
        <p className="max-w-[60ch] text-body text-ink-soft">{t("lead")}</p>
        <a
          href={locale === "fr" ? "/blog/rss.xml" : "/en/blog/rss.xml"}
          className="inline-flex min-h-11 items-center gap-2 self-start ink-link"
        >
          <Rss size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          {t("rss")}
        </a>
      </header>
      {posts.length === 0 ? (
        <p className="border-t-[1.5px] border-ink pt-6 text-ink-soft">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col border-t-[1.5px] border-ink">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="relative flex flex-col gap-2 border-b border-dotted border-ink-soft py-6 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
            >
              <time dateTime={post.meta.date} className="meta text-ink-soft">
                {format.dateTime(new Date(post.meta.date), { dateStyle: "long" })}
              </time>
              <div className="flex flex-col items-start gap-2">
                {post.meta.draft ? <Stamp tone="ink">{t("draft")}</Stamp> : null}
                <h2 className="font-display text-card font-semibold">
                  <Link href={`/blog/${post.slug}`} className="stretched-link">
                    {post.meta.title}
                  </Link>
                </h2>
                <p className="max-w-[68ch] text-ink-soft">{post.meta.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
