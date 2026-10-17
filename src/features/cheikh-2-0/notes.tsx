import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { CoulissesSection } from "../coulisses/section";

/** Les bugs de l'outil d'origine : gravité, et hypothèse tant que tu ne l'as pas confirmé. */
const BUGS = [
  { id: 1, severity: "crit", hypothesis: true },
  { id: 2, severity: "crit", hypothesis: true },
  { id: 3, severity: "high", hypothesis: false },
  { id: 4, severity: "high", hypothesis: false },
  { id: 5, severity: "high", hypothesis: false },
  { id: 6, severity: "low", hypothesis: false },
  { id: 7, severity: "low", hypothesis: false },
] as const;

const SEVERITY_BORDER = {
  crit: "border-l-error",
  high: "border-l-cat-motion",
  low: "border-l-stamp-strong",
} as const;

/** Changelog : bugs connus et correctifs. */
export async function BugsSection() {
  const t = await getTranslations("coulisses.cheikh.bugs");
  return (
    <CoulissesSection id="bugs" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ul className="flex flex-col gap-3">
        {BUGS.map((bug) => {
          const key = String(bug.id) as "1";
          return (
            <li
              key={bug.id}
              className={cn(
                "grid gap-x-4 gap-y-1 rounded-sheet border-[1.5px] border-l-4 border-ink bg-sheet px-4 py-3 sm:grid-cols-[5rem_minmax(0,1fr)]",
                SEVERITY_BORDER[bug.severity],
              )}
            >
              <p className="meta text-ink-soft sm:pt-1">BUG-{String(bug.id).padStart(2, "0")}</p>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[1.0625rem] font-semibold">
                    {t(`items.${key}.title`)}
                  </h3>
                  <span className="pill">{t(`severity.${bug.severity}`)}</span>
                  {bug.hypothesis ? (
                    <span className="rounded-full border border-dashed border-ink-soft px-2.5 py-0.5 meta text-ink-soft">
                      {t("hypothesis")}
                    </span>
                  ) : null}
                </div>
                <p>
                  <span className="mr-2 meta text-stamp-strong">{t("patch")}</span>
                  {t(`items.${key}.patch`)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </CoulissesSection>
  );
}

/** Le flow : la boucle du bâtisseur, en huit étapes. */
type LoopStep = { id: number; mark: string; branch?: "no" | "fix" | "back" };
const STEPS: readonly LoopStep[] = [
  { id: 1, mark: "1" },
  { id: 2, mark: "?", branch: "no" },
  { id: 3, mark: "3", branch: "fix" },
  { id: 4, mark: "4", branch: "fix" },
  { id: 5, mark: "5", branch: "fix" },
  { id: 6, mark: "6", branch: "fix" },
  { id: 7, mark: "7", branch: "fix" },
  { id: 8, mark: "↺", branch: "back" },
];

export async function LoopSection() {
  const t = await getTranslations("coulisses.cheikh.loop");
  return (
    <CoulissesSection id="boucle" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ol className="flex flex-col">
        {STEPS.map((step, index) => {
          const key = String(step.id) as "2";
          const last = index === STEPS.length - 1;
          return (
            <li
              key={step.id}
              className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 pb-6 md:grid-cols-[2.75rem_minmax(0,1fr)_15rem]"
            >
              {last ? null : (
                <span
                  aria-hidden
                  className="absolute top-11 bottom-0 left-[1.3125rem] w-0.5 bg-rule"
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 grid size-11 place-items-center rounded-full border-2 border-stamp-strong font-mono font-medium",
                  step.branch === "no" || last
                    ? "bg-stamp-strong text-on-fill"
                    : "bg-sheet text-stamp-strong",
                )}
              >
                {step.mark}
              </span>
              <div className="flex min-w-0 flex-col gap-1 pt-2">
                <h3 className="font-display text-[1.0625rem] font-semibold">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="text-ink-soft">{t(`steps.${key}.text`)}</p>
              </div>
              {step.branch ? (
                <p className="col-start-2 mt-2 flex flex-col gap-0.5 rounded-sheet border border-dashed border-ink-soft bg-sheet px-3 py-2 text-sm md:col-start-3 md:mt-2 md:self-start">
                  <span
                    className={cn(
                      "meta",
                      step.branch === "no" ? "text-cat-motion" : "text-stamp-strong",
                    )}
                  >
                    {t(`branch.${step.branch}`)}
                  </span>
                  {t(`steps.${key}.side`)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </CoulissesSection>
  );
}
