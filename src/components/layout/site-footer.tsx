import Link from "next/link";
import { useTranslations } from "next-intl";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t-[1.5px] border-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-20">
        <p className="font-display text-lg font-bold">{t("brand")}</p>
        <p className="flex flex-wrap items-center gap-x-5 meta text-ink-soft">
          <span className="inline-flex min-h-11 items-center">{t("rights")}</span>
          <Link href="/colophon" className="inline-flex min-h-11 items-center ink-link">
            {t("colophon")}
          </Link>
          <a href={SITE.repository} className="inline-flex min-h-11 items-center ink-link">
            {t("source")}
          </a>
        </p>
      </div>
    </footer>
  );
}
