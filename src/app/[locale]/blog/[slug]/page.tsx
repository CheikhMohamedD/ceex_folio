import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Masthead } from "@/components/ui/masthead";
import { Stamp } from "@/components/ui/stamp";
import { getPost, postSlugs } from "@/content/blog/load";
import { pageLocale } from "@/i18n/locale";
import { Link } from "@/i18n/link";
import { routing } from "@/i18n/routing";
import { blogPostingSchema, JsonLd } from "@/lib/seo/json-ld";

export function generateStaticParams() {
  const slugs = new Set(routing.locales.flatMap((locale) => postSlugs(locale)));
  return [...slugs].map((slug) => ({ slug }));
}

async function load(params: PageProps<"/[locale]/blog/[slug]">["params"]) {
  const locale = await pageLocale(params);
  const { slug } = await params;
  const post = await getPost(slug, locale);
  if (!post) notFound();
  return { locale, post };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, post } = await load(params);
  const path = `/blog/${post.slug}`;
  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: { canonical: locale === "fr" ? path : `/${locale}${path}` },
    openGraph: {
      type: "article",
      title: post.meta.title,
      description: post.meta.description,
      publishedTime: post.meta.date,
      modifiedTime: post.meta.updated ?? post.meta.date,
    },
    ...(post.meta.draft ? { robots: { index: false } } : {}),
  };
}

/** Un article : bandeau, titre, date, puis le texte MDX. */
export default async function PostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, post } = await load(params);
  const t = await getTranslations("blog");
  const format = await getFormatter();
  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: "long" });
  const schema = await blogPostingSchema({ slug: post.slug, ...post.meta }, locale);
  const { Content } = post;

  return (
    <article className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 sm:px-6 lg:px-20 lg:pt-12 lg:pb-24">
      <JsonLd data={schema} />
      <Masthead
        start={
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 ink-link">
            <ArrowLeft size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("back")}
          </Link>
        }
        end={
          <time dateTime={post.meta.date}>{t("published", { date: date(post.meta.date) })}</time>
        }
      />
      <header className="flex max-w-[48rem] flex-col items-start gap-5">
        {post.meta.draft ? <Stamp tone="ink">{t("draft")}</Stamp> : null}
        <h1 className="font-display text-[clamp(2.25rem,1.75rem+2.2vw,3.75rem)] leading-[1.05] font-bold">
          {post.meta.title}
        </h1>
        <p className="text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-relaxed text-ink-soft">
          {post.meta.description}
        </p>
        {post.meta.updated ? (
          <p className="meta text-ink-soft">{t("updated", { date: date(post.meta.updated) })}</p>
        ) : null}
      </header>
      <div className="flex max-w-[48rem] flex-col border-t-[1.5px] border-ink pt-8">
        <Content />
      </div>
    </article>
  );
}
