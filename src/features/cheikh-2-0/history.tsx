import { ArrowRight, Archive } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildPrompt, framingFileName, type PromptCopy } from "@/lib/cheikh/framing";
import type { Verdict } from "@/lib/cheikh/gate";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/link";
import type { FramingSheetRecord } from "@/server/repositories/cheikh.repo";
import { CoulissesSection } from "../coulisses/section";
import { parkSheetInCompass } from "./actions";
import { pdfDate, type PdfCopy } from "./pdf-copy";
import { SheetPdfButton } from "./sheet-pdf-button";

const VERDICT_PILL: Record<Verdict, string> = {
  NONE: "border-ink-soft text-ink-soft",
  PARK: "border-cat-motion text-cat-motion",
  VALIDATE: "border-error text-error",
  CUT: "border-error text-error",
  GO: "border-success text-success",
};

type HistoryProps = {
  sheets: FramingSheetRecord[];
  tasks: ReadonlyArray<{ label: string; done: boolean }>;
  promptCopy: PromptCopy;
  pdfCopy: PdfCopy;
  pdfLabels: { pending: string; failed: string };
};

/** Historique des fiches : chaque export laisse une trace, avec son verdict. */
export async function HistorySection({
  sheets,
  tasks,
  promptCopy,
  pdfCopy,
  pdfLabels,
}: HistoryProps) {
  const t = await getTranslations("coulisses.cheikh.history");
  return (
    <CoulissesSection id="historique" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      {sheets.length === 0 ? (
        <p className="text-ink-soft">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {sheets.map((sheet) => {
            const values = {
              goal: sheet.goal,
              problem: sheet.problem,
              audience: sheet.audience,
              context: sheet.context,
              constraints: sheet.constraints,
              successCriterion: sheet.successCriterion,
            };
            return (
              <li key={sheet.id}>
                <article className="flex flex-col gap-3 rounded-sheet border-[1.5px] border-ink bg-sheet p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 meta",
                        VERDICT_PILL[sheet.verdict],
                      )}
                    >
                      {pdfCopy.verdicts[sheet.verdict].title}
                    </span>
                    <span className="meta text-ink-soft">
                      {t("created", { date: pdfDate(sheet.createdAt) })}
                    </span>
                  </div>
                  <h3 className="font-display text-[1.0625rem] font-semibold wrap-break-word">
                    {sheet.gateName ?? sheet.goal}
                  </h3>
                  {sheet.gateName ? (
                    <p className="wrap-break-word text-ink-soft">{sheet.goal}</p>
                  ) : null}
                  <div className="flex flex-wrap items-start gap-3">
                    <SheetPdfButton
                      data={{
                        values,
                        gateName: sheet.gateName,
                        answers: sheet.gateAnswers,
                        verdict: sheet.verdict,
                        prompt: buildPrompt(values, promptCopy),
                        date: pdfDate(sheet.createdAt),
                        tasks,
                        copy: pdfCopy,
                      }}
                      fileName={framingFileName(sheet.goal, sheet.createdAt)}
                      label={t("download")}
                      pendingLabel={pdfLabels.pending}
                      failedLabel={pdfLabels.failed}
                    />
                    {sheet.verdict === "PARK" && !sheet.compassProjectId ? (
                      <form action={parkSheetInCompass}>
                        <input type="hidden" name="id" value={sheet.id} />
                        <button type="submit" className="btn btn-primary">
                          <Archive size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                          {t("park")}
                        </button>
                      </form>
                    ) : null}
                    {sheet.compassProjectId ? (
                      <Link
                        href="/coulisses/boussole#projets"
                        className="inline-flex min-h-12 items-center gap-2 font-display font-semibold text-stamp-strong"
                      >
                        {t("parked")}
                        <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </CoulissesSection>
  );
}
