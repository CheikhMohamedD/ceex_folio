import {
  Accessibility,
  BadgeCheck,
  Contrast,
  FileCode,
  FlaskConical,
  Gauge,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Callout } from "@/components/ui/callout";
import { DataTable } from "@/components/ui/data-table";
import { KeyFacts } from "@/components/ui/key-facts";
import { contrastAudit } from "@/lib/design/tokens";
import { JS_BUDGET, LIGHTHOUSE, LIGHTHOUSE_CATEGORIES } from "@/lib/quality";
import { securityHeaders, type SecurityHeaderName } from "@/lib/security/headers";
import { ColophonSection, SubHeading } from "./colophon-section";

const SCORE_ICON = {
  performance: Gauge,
  accessibility: Accessibility,
  "best-practices": BadgeCheck,
  seo: Search,
} as const;

/** Rôle de chaque en-tête, clé de message par nom d'en-tête. */
const HEADER_ROLE: Record<
  SecurityHeaderName,
  "csp" | "frame" | "sniff" | "referrer" | "permissions" | "coop" | "hsts"
> = {
  "Content-Security-Policy": "csp",
  "X-Frame-Options": "frame",
  "X-Content-Type-Options": "sniff",
  "Referrer-Policy": "referrer",
  "Permissions-Policy": "permissions",
  "Cross-Origin-Opener-Policy": "coop",
  "Strict-Transport-Security": "hsts",
};

export async function MeasuresSection() {
  const t = await getTranslations("colophon.measures");
  const format = await getFormatter();
  const audit = contrastAudit();

  const day = (iso: string) => format.dateTime(new Date(`${iso}T12:00:00Z`), { dateStyle: "long" });
  const scores = LIGHTHOUSE.pages["/colophon"];
  const kilobytes = (bytes: number) =>
    `${format.number(bytes / 1024, { maximumFractionDigits: 1 })} Ko`;

  const lighthouseNote =
    LIGHTHOUSE.measuredAt && scores
      ? t("lighthouse.measured", {
          date: day(LIGHTHOUSE.measuredAt),
          runs: LIGHTHOUSE.runs,
        })
      : t("lighthouse.pending");

  const budgetFacts = [
    {
      icon: FileCode,
      value: JS_BUDGET.gzipBytes === null ? t("pending") : kilobytes(JS_BUDGET.gzipBytes),
      label:
        JS_BUDGET.measuredAt && JS_BUDGET.scripts !== null
          ? t("budget.measured", {
              date: day(JS_BUDGET.measuredAt),
              scripts: JS_BUDGET.scripts,
            })
          : t("budget.pendingLabel"),
    },
    {
      icon: Gauge,
      value: t("budget.tolerance", { percent: Math.round(JS_BUDGET.tolerance * 100) }),
      label: t("budget.toleranceLabel"),
    },
    {
      icon: Contrast,
      value: t("budget.contrast", { passing: audit.passing, total: audit.total }),
      label: t("budget.contrastLabel"),
    },
    {
      icon: Smartphone,
      value: t("budget.width"),
      label: t("budget.widthLabel"),
    },
  ];

  const headers = securityHeaders({
    isDev: false,
    turnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  });

  return (
    <ColophonSection id="mesures" number="07" title={t("title")} intro={<p>{t("intro")}</p>}>
      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <SubHeading>{t("lighthouse.title")}</SubHeading>
          <p className="text-ink-soft">{lighthouseNote}</p>
          <KeyFacts
            facts={LIGHTHOUSE_CATEGORIES.map((category) => ({
              icon: SCORE_ICON[category],
              value: scores ? `${Math.round(scores[category] * 100)} / 100` : t("pending"),
              label: t(`lighthouse.categories.${category}`),
            }))}
          />
          <p className="text-sm text-ink-soft">{t("lighthouse.seoNote")}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <SubHeading>{t("budget.title")}</SubHeading>
          <p className="text-ink-soft">{t("budget.text")}</p>
          <KeyFacts facts={budgetFacts} />
        </div>
      </div>

      <Callout
        label={t("ci.label")}
        items={[
          { icon: FileCode, text: t("ci.lint") },
          { icon: FlaskConical, text: t("ci.unit", { total: audit.total }) },
          { icon: Accessibility, text: t("ci.e2e") },
          { icon: Gauge, text: t("ci.performance") },
          { icon: ShieldCheck, text: t("ci.security") },
        ]}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <SubHeading>{t("headers.title")}</SubHeading>
        <p className="max-w-[68ch] text-ink-soft">{t("headers.text")}</p>
        <DataTable
          caption={t("headers.caption")}
          columns={[
            { key: "name", header: t("headers.columns.name") },
            { key: "role", header: t("headers.columns.role") },
            { key: "value", header: t("headers.columns.value") },
          ]}
          rows={headers.map((header) => ({
            id: header.key,
            cells: {
              name: <code className="font-mono normal-case">{header.key}</code>,
              role: t(`headers.roles.${HEADER_ROLE[header.key]}`),
              value: (
                <code className="font-mono text-xs leading-relaxed wrap-anywhere text-ink-soft">
                  {header.value}
                </code>
              ),
            },
          }))}
        />
      </div>
    </ColophonSection>
  );
}
