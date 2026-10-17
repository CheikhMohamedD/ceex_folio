import { ArrowRight, Map as MapIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Annotation } from "@/components/ui/annotation";
import { ButtonLink } from "@/components/ui/button";
import { Masthead } from "@/components/ui/masthead";
import { OpenFolder } from "@/components/ui/open-folder";
import { Stamp } from "@/components/ui/stamp";
import { Steps } from "@/components/ui/steps";
import { SITE } from "@/lib/site";

const PHASES = ["p1", "p2", "p3", "p4", "p5"] as const;

/** Sections annoncées par la navigation ; elles arrivent avec les phases 2 et 3. */
const UPCOMING = [
  { id: "prez", key: "prez", number: "01" },
  { id: "pro-life", key: "proLife", number: "02" },
  { id: "hobbies", key: "hobbies", number: "03" },
  { id: "reach-out", key: "reachOut", number: "04" },
] as const;

/** Accueil provisoire de la phase 1 : le chantier, le plan et le lien vers le colophon. */
export default async function HomePage() {
  const t = await getTranslations("home");
  const tp = await getTranslations("phases");
  const tn = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-20">
      <section
        aria-labelledby="accueil-titre"
        className="flex flex-col gap-10 pt-8 pb-16 lg:pt-12 lg:pb-24"
      >
        <Masthead start={t("masthead.start")} end={t("masthead.end")} />
        <div className="flex flex-col items-start gap-6">
          <Stamp>{t("stamp")}</Stamp>
          <h1
            id="accueil-titre"
            className="max-w-[20ch] font-display text-[clamp(2.5rem,1.75rem+3.3vw,4.75rem)] leading-[1.02] font-bold"
          >
            {t("title")}
          </h1>
          <p className="max-w-[60ch] text-body text-ink-soft">{t("lead")}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href="/colophon">
              {t("cta.colophon")}
              <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            </ButtonLink>
            {/* Décor : le bouton dit déjà tout, donc l'annotation se retire sous 640 px. */}
            <Annotation arrow="left" className="hidden sm:inline-flex">
              {t("annotation")}
            </Annotation>
          </div>
          <a href={SITE.github} className="inline-flex min-h-11 items-center ink-link">
            {t("cta.github")}
          </a>
        </div>
      </section>

      <OpenFolder
        as="section"
        label={t("plan.label")}
        icon={MapIcon}
        aria-labelledby="plan-titre"
        className="mb-16 lg:mb-24"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 id="plan-titre" className="font-display text-card font-semibold">
              {t("plan.title")}
            </h2>
            <p className="max-w-[68ch] text-ink-soft">{t("plan.text")}</p>
          </div>
          <Steps
            label={t("plan.label")}
            current={0}
            orientation="responsive"
            breakpoint="lg"
            className="[--cat:var(--stamp-strong)] [--ring:var(--sheet)]"
            steps={PHASES.map((phase) => ({
              label: tp(`${phase}.short`),
              description: tp(`${phase}.milestone`),
            }))}
          />
        </div>
      </OpenFolder>

      <section
        aria-labelledby="a-venir-titre"
        className="border-t-[1.5px] border-ink pt-10 pb-16 lg:pb-24"
      >
        <h2 id="a-venir-titre" className="meta text-ink-soft">
          {t("upcoming.title")}
        </h2>
        <ul className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING.map((section) => (
            <li key={section.id} id={section.id} className="flex flex-col gap-2">
              <p className="flex items-baseline gap-2 font-display text-card font-semibold">
                <span className="font-mono text-xs font-medium text-stamp-strong">
                  {section.number}
                </span>
                {tn(section.key)}
              </p>
              <p className="text-[0.9375rem] leading-normal text-ink-soft">
                {t(`upcoming.${section.key}`)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
