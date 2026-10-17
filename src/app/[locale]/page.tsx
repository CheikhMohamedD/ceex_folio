import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCaseStudies } from "@/content/projects/load";
import { Hero } from "@/features/home/hero";
import { Hobbies } from "@/features/home/hobbies";
import { Prez } from "@/features/home/prez";
import { ProLife } from "@/features/home/pro-life";
import { ReachOut } from "@/features/home/reach-out";
import { pageLocale } from "@/i18n/locale";
import { alternates } from "@/lib/seo/alternates";
import { JsonLd, profilePageSchema } from "@/lib/seo/json-ld";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return { title: { absolute: t("title") }, alternates: alternates(locale, "/") };
}

/** Accueil : GOTF, Prez, Pro life, Hobbies, puis les deux portes de Reach out. */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await pageLocale(params);
  const projects = await getCaseStudies(locale);
  const schema = await profilePageSchema(locale);

  return (
    <>
      <JsonLd data={schema} />
      <Hero projects={projects} />
      <Prez />
      <ProLife projects={projects} />
      <Hobbies />
      <ReachOut />
    </>
  );
}
