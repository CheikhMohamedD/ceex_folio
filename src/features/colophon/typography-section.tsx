import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Annotation } from "@/components/ui/annotation";
import { cn } from "@/lib/cn";
import { ColophonSection } from "./colophon-section";

function Specimen({ role, spec, children }: { role: string; spec: string; children: ReactNode }) {
  return (
    <li className="grid gap-x-8 gap-y-3 border-t border-dotted border-ink-soft py-6 first:border-t-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-baseline">
      <div className="flex flex-col gap-1">
        <span className="meta">{role}</span>
        <span className="text-sm text-ink-soft">{spec}</span>
      </div>
      <div className={cn("min-w-0")}>{children}</div>
    </li>
  );
}

export async function TypographySection() {
  const t = await getTranslations("colophon.typography");

  return (
    <ColophonSection id="typographie" number="03" title={t("title")} intro={<p>{t("intro")}</p>}>
      <ul className="flex flex-col">
        <Specimen role={t("hero.role")} spec={t("hero.spec")}>
          <span className="block font-display text-hero font-bold">GOTF</span>
        </Specimen>
        <Specimen role={t("section.role")} spec={t("section.spec")}>
          <span className="block font-display text-section font-semibold">
            {t("section.sample")}
          </span>
        </Specimen>
        <Specimen role={t("card.role")} spec={t("card.spec")}>
          <span className="block font-display text-card font-semibold">{t("card.sample")}</span>
        </Specimen>
        <Specimen role={t("body.role")} spec={t("body.spec")}>
          <p className="max-w-[68ch] text-body">{t("body.sample")}</p>
        </Specimen>
        <Specimen role={t("meta.role")} spec={t("meta.spec")}>
          <span className="meta">{t("meta.sample")}</span>
        </Specimen>
        <Specimen role={t("annotation.role")} spec={t("annotation.spec")}>
          <Annotation arrow="right">{t("annotation.sample")}</Annotation>
        </Specimen>
        <Specimen role={t("accent.role")} spec={t("accent.spec")}>
          <span className="block font-display text-section font-semibold">
            {t("accent.before")} <span className="text-stamp">{t("accent.word")}</span>
          </span>
        </Specimen>
      </ul>
      <p className="max-w-[68ch] text-sm text-ink-soft">{t("credits")}</p>
    </ColophonSection>
  );
}
