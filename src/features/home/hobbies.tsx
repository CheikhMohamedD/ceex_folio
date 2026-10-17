import { getTranslations } from "next-intl/server";
import { NumberedSection } from "./numbered-section";

const HOBBIES = [
  { key: "swim", pattern: "hatch" },
  { key: "anime", pattern: "hatch-reverse" },
  { key: "read", pattern: "hatch" },
  { key: "sport", pattern: "hatch-reverse" },
] as const;

/** Hobbies : une bande horizontale qui défile au doigt, à la molette ou au clavier. */
export async function Hobbies() {
  const t = await getTranslations("home.hobbies");

  return (
    <NumberedSection id="hobbies" number="03" title={t("title")} className="overflow-hidden">
      {/* Zone défilante sans lien à l'intérieur : focalisable pour défiler au clavier
          (WCAG 2.1.1, règle scrollable-region-focusable d'axe-core). */}
      <div
        role="region"
        aria-label={t("label")}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        <ul className="flex w-max gap-4 *:relative *:h-44 *:w-60 *:shrink-0 *:snap-start *:rounded-sheet *:border-[1.5px] *:border-ink sm:*:h-52 sm:*:w-72">
          {HOBBIES.map((hobby) => (
            <li key={hobby.key} className={hobby.pattern}>
              <span
                lang="en"
                className="absolute bottom-3 left-3 border border-ink bg-sheet px-2 py-1 font-display text-[0.9375rem] font-semibold"
              >
                {t(`items.${hobby.key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p aria-hidden className="meta text-ink-soft">
        {t("hint")} →
      </p>
    </NumberedSection>
  );
}
