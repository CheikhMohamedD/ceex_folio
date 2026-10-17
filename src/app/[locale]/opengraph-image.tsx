import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { shareImage, SHARE_SIZE } from "@/lib/seo/share-image";
import { SITE } from "@/lib/site";

export const size = SHARE_SIZE;
export const contentType = "image/png";
export const alt = `${SITE.name} · ${SITE.author}`;

/** Image de partage du site (accueil et pages sans image propre). */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  return shareImage({
    masthead: `${SITE.name} · Dakar`,
    title: t("title"),
    summary: t("lead"),
    footer: `Generalist Owns The Future · ${SITE.author}`,
  });
}
