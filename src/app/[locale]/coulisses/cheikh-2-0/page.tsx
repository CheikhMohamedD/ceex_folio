import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FramingTool, type FramingToolCopy } from "@/features/cheikh-2-0/framing-tool";
import { HistorySection } from "@/features/cheikh-2-0/history";
import { BugsSection, LoopSection } from "@/features/cheikh-2-0/notes";
import { RoadmapBoard } from "@/features/cheikh-2-0/roadmap-board";
import { CoulissesSection } from "@/features/coulisses/section";
import { CoulissesShell } from "@/features/coulisses/shell";
import { FRAMING_FIELDS } from "@/lib/cheikh/framing";
import { VERDICTS } from "@/lib/cheikh/gate";
import { ROADMAP_WEEKS } from "@/lib/cheikh/roadmap";
import { requireOwner } from "@/server/owner";
import { listFramingSheets, listRoadmap } from "@/server/repositories/cheikh.repo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "coulisses.cheikh.meta" });
  return { title: t("title") };
}

const TOC = [
  { id: "bugs", key: "bugs" },
  { id: "boucle", key: "loop" },
  { id: "prompt", key: "prompt" },
  { id: "sas", key: "gate" },
  { id: "historique", key: "history" },
  { id: "roadmap", key: "roadmap" },
] as const;

/**
 * Cheikh 2.0, passé de la page autonome à la base : les cases cochées, les fiches et
 * leurs verdicts se retrouvent sur tous tes appareils.
 */
export default async function CheikhPage() {
  const owner = await requireOwner();
  const [t, tasks, sheets] = await Promise.all([
    getTranslations("coulisses.cheikh"),
    listRoadmap(),
    listFramingSheets(),
  ]);
  // Les clés numérotées (semaines 1 à 4) : le type de next-intl ne sait pas les calculer.
  const weekKey = (index: number) => String(index + 1) as "1";
  const weeks = Array.from({ length: ROADMAP_WEEKS }, (_, index) => ({
    label: t(`roadmap.weeks.${weekKey(index)}.label`),
    title: t(`roadmap.weeks.${weekKey(index)}.title`),
  }));
  const fieldText = (
    field: (typeof FRAMING_FIELDS)[number],
    part: "label" | "hint" | "placeholder" | "short",
  ) => t(`prompt.fields.${field}.${part}`);
  const promptText = {
    labels: Object.fromEntries(
      FRAMING_FIELDS.map((field) => [field, t(`prompt.labels.${field}`)]),
    ) as Record<(typeof FRAMING_FIELDS)[number], string>,
    missing: t("prompt.missing"),
    closing: [t("prompt.closing.1"), t("prompt.closing.2"), t("prompt.closing.3")],
  };
  const questions = [
    t("gate.questions.1"),
    t("gate.questions.2"),
    t("gate.questions.3"),
    t("gate.questions.4"),
  ];
  const pdf = {
    fields: Object.fromEntries(
      FRAMING_FIELDS.map((field) => [field, fieldText(field, "short")]),
    ) as Record<(typeof FRAMING_FIELDS)[number], string>,
    questions,
    verdicts: Object.fromEntries(
      VERDICTS.map((verdict) => [
        verdict,
        { title: t(`gate.verdicts.${verdict}.title`), text: t(`gate.verdicts.${verdict}.text`) },
      ]),
    ) as FramingToolCopy["pdf"]["verdicts"],
    weeks: weeks.map((week) => week.label),
  };
  const copy: FramingToolCopy = {
    prompt: {
      eyebrow: t("prompt.eyebrow"),
      title: t("prompt.title"),
      lead: t("prompt.lead"),
      fields: Object.fromEntries(
        FRAMING_FIELDS.map((field) => [
          field,
          {
            label: fieldText(field, "label"),
            hint: fieldText(field, "hint"),
            placeholder: fieldText(field, "placeholder"),
          },
        ]),
      ) as FramingToolCopy["prompt"]["fields"],
      output: t("prompt.output"),
      score: t.raw("prompt.score") as string,
      clear: t("prompt.clear"),
      copy: t("prompt.copy"),
      copied: t("prompt.copied"),
      copyFallback: t("prompt.copyFallback"),
      export: t("prompt.export"),
      exporting: t("prompt.exporting"),
      exported: t.raw("prompt.exported") as string,
      exportFailed: t("prompt.exportFailed"),
      saveFailed: t("prompt.saveFailed"),
      incomplete: t("prompt.incomplete"),
    },
    promptText,
    gate: {
      eyebrow: t("gate.eyebrow"),
      title: t("gate.title"),
      lead: t("gate.lead"),
      nameLabel: t("gate.name.label"),
      namePlaceholder: t("gate.name.placeholder"),
      questions,
      yes: t("gate.yes"),
      no: t("gate.no"),
      reset: t("gate.reset"),
    },
    pdf,
  };
  const pdfTasks = tasks.map(({ label, done }) => ({ label, done }));

  return (
    <CoulissesShell
      current="cheikh"
      owner={owner}
      title={t("title")}
      lead={t("lead")}
      kicker={
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 meta text-ink-soft">
          <span>
            <s>{t("version.from")}</s> →{" "}
            <span className="rounded-full bg-stamp-strong px-2.5 py-0.5 text-on-fill">
              {t("version.to")}
            </span>
          </span>
          <span>{t("version.build")}</span>
          <span>{t("version.maintainer")}</span>
        </p>
      }
    >
      <nav aria-label={t("toc.label")}>
        <ul className="flex flex-wrap gap-2">
          {TOC.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-ink bg-sheet px-4 text-[0.9375rem] hover:bg-paper"
              >
                {t(`toc.${entry.key}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <BugsSection />
      <LoopSection />
      <FramingTool copy={copy} tasks={pdfTasks} />
      <HistorySection
        sheets={sheets}
        tasks={pdfTasks}
        promptCopy={promptText}
        pdfCopy={pdf}
        pdfLabels={{ pending: t("history.downloading"), failed: t("history.downloadFailed") }}
      />
      <CoulissesSection
        id="roadmap"
        eyebrow={t("roadmap.eyebrow")}
        title={t("roadmap.title")}
        lead={t("roadmap.lead")}
      >
        <RoadmapBoard
          tasks={tasks}
          copy={{ progress: t.raw("roadmap.progress") as string, reset: t("roadmap.reset"), weeks }}
        />
      </CoulissesSection>
    </CoulissesShell>
  );
}
