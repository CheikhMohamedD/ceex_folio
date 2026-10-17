import { getTranslations } from "next-intl/server";
import { DataTable } from "@/components/ui/data-table";
import { formatRatio } from "@/lib/design/contrast";
import { BASE_TOKENS, contrastAudit, CONTRAST_REFERENCE, ratio, TOKENS } from "@/lib/design/tokens";
import { ColophonSection } from "./colophon-section";
import { Swatch } from "./swatch";

export async function PaletteSection() {
  const t = await getTranslations("colophon.palette");
  const audit = contrastAudit();

  const rows = BASE_TOKENS.map((name) => {
    const reference = CONTRAST_REFERENCE[name];
    const contrast = reference
      ? `${formatRatio(ratio(name, reference, "light"))} / ${formatRatio(ratio(name, reference, "dark"))}`
      : t(name === "rule" ? "decorative" : "surface");
    return {
      id: name,
      cells: {
        token: <code className="font-mono normal-case">{name}</code>,
        light: <Swatch hex={TOKENS[name].light} />,
        dark: <Swatch hex={TOKENS[name].dark} />,
        usage: t(`usage.${name}`),
        contrast,
      },
    };
  });

  return (
    <ColophonSection id="palette" number="01" title={t("title")} intro={<p>{t("intro")}</p>}>
      <DataTable
        caption={t("caption")}
        columns={[
          { key: "token", header: t("columns.token") },
          { key: "light", header: t("columns.light") },
          { key: "dark", header: t("columns.dark") },
          { key: "usage", header: t("columns.usage") },
          { key: "contrast", header: t("columns.contrast"), emphasis: true },
        ]}
        rows={rows}
      />
      <ul className="flex max-w-[68ch] flex-col gap-3 text-ink-soft">
        <li className="border-l-[3px] border-stamp pl-4">
          {t("rules.stamp", {
            stamp: formatRatio(ratio("stamp", "paper", "light")),
            strong: formatRatio(ratio("stamp-strong", "paper", "light")),
          })}
        </li>
        <li className="border-l-[3px] border-kraft pl-4">
          {t("rules.kraft", {
            ratio: formatRatio(
              Math.min(ratio("ink", "kraft", "light"), ratio("ink", "kraft", "dark")),
            ),
          })}
        </li>
        <li className="border-l-[3px] border-ink pl-4">
          {t("rules.audit", { total: audit.total, passing: audit.passing })}
        </li>
      </ul>
    </ColophonSection>
  );
}
