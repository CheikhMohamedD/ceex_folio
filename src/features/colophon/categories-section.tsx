import { getTranslations } from "next-intl/server";
import { OpenFolder } from "@/components/ui/open-folder";
import { formatRatio } from "@/lib/design/contrast";
import { CATEGORIES, CATEGORY_ICON } from "@/lib/design/categories";
import { CATEGORY_TOKENS, ratio, TOKENS, type CategoryToken } from "@/lib/design/tokens";
import { ColophonSection } from "./colophon-section";
import { Swatch } from "./swatch";

export async function CategoriesSection() {
  const t = await getTranslations("colophon.categories");
  const tc = await getTranslations("categories");
  const darkMinimum = Math.min(...CATEGORY_TOKENS.map((token) => ratio(token, "paper", "dark")));

  return (
    <ColophonSection id="categories" number="02" title={t("title")} intro={<p>{t("intro")}</p>}>
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) => {
          const token = `cat-${category}` as CategoryToken;
          return (
            <li key={category} className="flex flex-col">
              <OpenFolder
                label={tc(category)}
                icon={CATEGORY_ICON[category]}
                category={category}
                className="flex-1 sm:p-6 lg:p-6"
              >
                <p className="text-[0.9375rem] leading-snug">{t(`projects.${category}`)}</p>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="meta text-ink-soft">{t("light")}</dt>
                    <dd>
                      <Swatch hex={TOKENS[token].light} />
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="meta text-ink-soft">{t("dark")}</dt>
                    <dd>
                      <Swatch hex={TOKENS[token].dark} />
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dotted border-ink-soft pt-2">
                    <dt className="meta text-ink-soft">{t("onColor")}</dt>
                    <dd className="font-display font-semibold">
                      {formatRatio(ratio("on-fill", token, "light"))} /{" "}
                      {formatRatio(ratio("on-fill", token, "dark"))}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="meta text-ink-soft">{t("onPaper")}</dt>
                    <dd className="font-display font-semibold">
                      {formatRatio(ratio(token, "paper", "light"))} /{" "}
                      {formatRatio(ratio(token, "paper", "dark"))}
                    </dd>
                  </div>
                </dl>
              </OpenFolder>
            </li>
          );
        })}
      </ul>
      <ul className="flex max-w-[68ch] flex-col gap-3 text-ink-soft">
        <li className="border-l-[3px] border-cat-web pl-4">{t("rules.home")}</li>
        <li className="border-l-[3px] border-cat-mobile pl-4">
          {t("rules.dark", { min: formatRatio(darkMinimum) })}
        </li>
        <li className="border-l-[3px] border-cat-design pl-4">{t("rules.wash")}</li>
        <li className="border-l-[3px] border-cat-motion pl-4">{t("rules.colorBlind")}</li>
      </ul>
    </ColophonSection>
  );
}
