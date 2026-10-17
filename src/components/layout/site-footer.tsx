import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/link";
import { SITE } from "@/lib/site";

const LINK = "inline-flex min-h-11 min-w-11 items-center justify-center ink-link";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t-[1.5px] border-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-20">
        <p className="font-display text-lg font-bold">{t("brand")}</p>
        <p className="flex flex-wrap items-center gap-x-5 meta text-ink-soft">
          <span className="inline-flex min-h-11 items-center">{t("rights")}</span>
          <Link href="/services" className={LINK}>
            {t("services")}
          </Link>
          <Link href="/blog" className={LINK}>
            {t("blog")}
          </Link>
          {/* Le colophon n'existe qu'en français, à /colophon : lien direct, sans préfixe. */}
          <NextLink href="/colophon" hrefLang="fr" className={LINK}>
            {t("colophon")}
          </NextLink>
          <a href={SITE.github} className={LINK}>
            {t("github")}
          </a>
        </p>
      </div>
    </footer>
  );
}
