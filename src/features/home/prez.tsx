import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Annotation } from "@/components/ui/annotation";
import { Link } from "@/i18n/link";
import { NumberedSection } from "./numbered-section";

const SKILLS = ["design", "code", "mockups", "video"] as const;

/** Prez : qui je suis, ce que je fais, et un premier lien vers le contact. */
export async function Prez() {
  const t = await getTranslations("home.prez");

  return (
    <NumberedSection id="prez" number="01" title={t("title")}>
      <p className="max-w-[62ch] text-[clamp(1.0625rem,1rem+0.3vw,1.1875rem)] leading-relaxed">
        {t("text")}
      </p>
      <ul
        aria-label={t("skillsLabel")}
        className="grid grid-cols-2 gap-3 *:flex *:flex-col *:gap-1.5 *:rounded-sheet *:border-[1.5px] *:border-ink *:bg-sheet *:p-4 sm:*:p-5 lg:grid-cols-4"
      >
        {SKILLS.map((skill) => (
          <li key={skill}>
            <span lang="en" className="font-display text-[1.375rem] font-semibold">
              {t(`skills.${skill}.title`)}
            </span>
            <span className="meta text-ink-soft">{t(`skills.${skill}.detail`)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <Link
          href="/#reach-out"
          className="inline-flex min-h-12 items-center gap-2.5 rounded-sheet border-[1.5px] border-dashed border-stamp-strong px-5 font-display text-[1.0625rem] font-semibold text-stamp-strong hover:bg-sheet"
        >
          <span lang="en">{t("contact")}</span>
          <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        </Link>
        <Annotation tilt={-2}>
          <span lang="en">{t("motto")}</span>
        </Annotation>
      </div>
    </NumberedSection>
  );
}
