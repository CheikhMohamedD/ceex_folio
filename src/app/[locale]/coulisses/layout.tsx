import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "coulisses.meta" });
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    // Jamais indexées, et absentes du plan du site (robots.ts les exclut aussi).
    robots: { index: false, follow: false },
  };
}

/**
 * Les Coulisses, en français seulement. Ce layout ne lit pas la session : chaque page
 * appelle requireOwner() elle-même, car un layout n'est pas rejoué à chaque navigation.
 */
export default async function CoulissesLayout({
  children,
  params,
}: LayoutProps<"/[locale]/coulisses">) {
  if ((await pageLocale(params)) !== "fr") notFound();
  return children;
}
