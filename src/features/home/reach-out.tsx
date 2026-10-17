import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";
import { directFormCopy } from "@/features/contact/copy";
import { DirectForm } from "@/features/contact/direct-form";
import { SITE } from "@/lib/site";
import { NumberedSection } from "./numbered-section";

/**
 * Reach out : une seule question, deux portes. La bande reste sombre dans les deux
 * thèmes (.scheme-dark), avec les contrastes déjà vérifiés du thème sombre.
 */
export async function ReachOut() {
  const t = await getTranslations("home.reachOut");
  const tc = await getTranslations("contact");
  const locale = await getLocale();
  const hours = SITE.responseHours;

  return (
    <div className="bg-paper text-ink scheme-dark">
      <NumberedSection id="reach-out" number="04" title={t("title")} className="border-t-0">
        <div className="-mt-4 flex flex-col gap-2">
          <p className="text-body">{t("question")}</p>
          <p className="meta text-ink-soft">{t("promise", { hours })}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:items-start">
          <section
            aria-labelledby="porte-directe"
            className="flex flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-sheet p-6 sm:p-8"
          >
            <p className="meta text-ink-soft">{t("direct.label")}</p>
            <h3 id="porte-directe" className="font-display text-card font-semibold">
              {t("direct.title")}
            </h3>
            <p className="text-ink-soft">{t("direct.text")}</p>
            <DirectForm locale={locale} copy={await directFormCopy()} />
            <p className="text-sm text-ink-soft">{tc("privacy", { email: SITE.email })}</p>
            <p className="border-t border-dashed border-ink pt-4 meta text-ink-soft">
              {t("direct.or")}
            </p>
            {/* L'adresse et le numéro restent du texte à copier, et chacun ouvre son appli. */}
            <ul className="flex flex-col font-mono text-[0.9375rem]">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {`WhatsApp ${SITE.whatsappDisplay}`}
                </a>
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="porte-guidee"
            className="flex flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-kraft grain p-6 sm:p-8"
          >
            <p className="meta">{t("guided.label")}</p>
            <h3 id="porte-guidee" className="font-display text-card font-semibold">
              {t("guided.title")}
            </h3>
            <p>{t("guided.text")}</p>
            <div className="flex flex-col items-start gap-3 border-t border-dashed border-ink pt-4">
              <ButtonLink href="/contact/parcours" className="max-sm:w-full">
                {t("guided.start")}
                <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </ButtonLink>
              <p className="meta">{t("guided.details")}</p>
            </div>
          </section>
        </div>

        <Steps
          label={t("steps.label")}
          current={0}
          orientation="responsive"
          className="[--ring:var(--paper)]"
          steps={[
            { label: t("steps.sendTitle"), description: t("steps.send") },
            { label: t("steps.replyTitle"), description: t("steps.reply", { hours }) },
            { label: t("steps.talkTitle"), description: t("steps.talk") },
          ]}
        />

        <p className="flex flex-wrap items-center gap-x-2 meta text-ink-soft">
          {t("elsewhere")} ·
          <a href={SITE.github} className="inline-flex min-h-11 items-center ink-link">
            GitHub @{SITE.handle}
          </a>
        </p>
      </NumberedSection>
    </div>
  );
}
