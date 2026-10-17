import { getTranslations } from "next-intl/server";
import type { CaseStudy } from "@/content/projects/load";
import { localizedPath } from "@/i18n/paths";
import type { Locale } from "@/i18n/routing";
import { SITE } from "@/lib/site";

type Schema = Record<string, unknown>;

/** Données structurées : un bloc JSON-LD, sans « < » qui fermerait la balise. */
export function JsonLd({ data }: { data: Schema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function absolute(path: string): string {
  return `${SITE.url}${path === "/" ? "" : path}` || SITE.url;
}

function personId(): string {
  return `${SITE.url}/#person`;
}

/** La personne derrière le site, référencée par les autres blocs. */
async function person(locale: Locale): Promise<Schema> {
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    "@type": "Person",
    "@id": personId(),
    name: SITE.author,
    alternateName: [SITE.fullName, SITE.handle],
    jobTitle: t("jobTitle"),
    url: absolute(localizedPath("/", locale)),
    sameAs: [SITE.github],
    address: { "@type": "PostalAddress", addressLocality: "Dakar", addressCountry: "SN" },
    knowsLanguage: ["fr", "en"],
  };
}

/** Accueil : une page de profil centrée sur une seule personne. */
export async function profilePageSchema(locale: Locale): Promise<Schema> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absolute(localizedPath("/", locale)),
    inLanguage: locale,
    mainEntity: await person(locale),
  };
}

/** Étude de cas : l'œuvre, son auteur, et le fil d'Ariane jusqu'à elle. */
export async function caseStudySchema(study: CaseStudy, locale: Locale): Promise<Schema> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const tp = await getTranslations({ locale, namespace: "project" });
  const url = absolute(localizedPath(`/projets/${study.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#oeuvre`,
        name: study.meta.title,
        description: study.meta.description,
        url,
        inLanguage: locale,
        creator: { "@id": personId() },
        keywords: [...study.stack, ...study.meta.tools].join(", ") || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("home"),
            item: absolute(localizedPath("/", locale)),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: tp("breadcrumb"),
            item: absolute(localizedPath("/#pro-life", locale)),
          },
          { "@type": "ListItem", position: 3, name: study.meta.title, item: url },
        ],
      },
      await person(locale),
    ],
  };
}

/** Article du blog. */
export async function blogPostingSchema(
  post: { slug: string; title: string; description: string; date: string; updated?: string },
  locale: Locale,
): Promise<Schema> {
  const url = absolute(localizedPath(`/blog/${post.slug}`, locale));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        inLanguage: locale,
        url,
        mainEntityOfPage: url,
        author: { "@id": personId() },
      },
      await person(locale),
    ],
  };
}
