"use client";

import { clsx } from "clsx";
import { Copy, Eraser, FileDown, RotateCcw } from "lucide-react";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { Field } from "@/components/ui/field";
import {
  buildPrompt,
  clarity,
  clarityLevel,
  EMPTY_FRAMING,
  FRAMING_FIELDS,
  framingFileName,
  type FramingField,
  type FramingValues,
  type PromptCopy,
} from "@/lib/cheikh/framing";
import {
  EMPTY_GATE,
  GATE_QUESTIONS,
  verdictFor,
  type GateAnswer,
  type Verdict,
} from "@/lib/cheikh/gate";
import { CoulissesSection } from "../coulisses/section";
import { saveFramingSheet } from "./actions";
import { pdfDate, type PdfCopy } from "./pdf-copy";

export type FramingToolCopy = {
  prompt: {
    eyebrow: string;
    title: string;
    lead: string;
    fields: Record<FramingField, { label: string; hint: string; placeholder: string }>;
    output: string;
    /** « Clarté {score}/6 ». */
    score: string;
    clear: string;
    copy: string;
    copied: string;
    copyFallback: string;
    export: string;
    exporting: string;
    /** « … dossier {file} exporté. » */
    exported: string;
    exportFailed: string;
    saveFailed: string;
    incomplete: string;
  };
  promptText: PromptCopy;
  gate: {
    eyebrow: string;
    title: string;
    lead: string;
    nameLabel: string;
    namePlaceholder: string;
    questions: readonly string[];
    yes: string;
    no: string;
    reset: string;
  };
  pdf: PdfCopy;
};

type FramingToolProps = {
  copy: FramingToolCopy;
  /** Feuille de route du moment, reprise dans le dossier. */
  tasks: ReadonlyArray<{ label: string; done: boolean }>;
};

const LEVEL_CLASSES = {
  ok: "border-success text-success",
  mid: "border-cat-motion text-cat-motion",
  bad: "border-error text-error",
} as const;

const VERDICT_CLASSES: Record<Verdict, string> = {
  NONE: "border-ink-soft",
  PARK: "border-cat-motion",
  VALIDATE: "border-error",
  CUT: "border-error",
  GO: "border-success",
};
const VERDICT_TITLE_CLASSES: Record<Verdict, string> = {
  NONE: "text-ink",
  PARK: "text-cat-motion",
  VALIDATE: "text-error",
  CUT: "text-error",
  GO: "text-success",
};

/**
 * Outils 1 et 2 de Cheikh 2.0 : le générateur de prompt et le sas des projets, qui
 * partent ensemble dans le dossier PDF. L'export enregistre d'abord la fiche (le
 * verdict est recalculé côté serveur), puis génère le PDF dans le navigateur.
 */
export function FramingTool({ copy, tasks }: FramingToolProps) {
  const [values, setValues] = useState<FramingValues>(EMPTY_FRAMING);
  const [gateName, setGateName] = useState("");
  const [answers, setAnswers] = useState<GateAnswer[]>([...EMPTY_GATE]);
  const [message, setMessage] = useState("");
  const [exporting, startExport] = useTransition();
  const output = useRef<HTMLPreElement>(null);

  const score = clarity(values);
  const complete = score === FRAMING_FIELDS.length;
  const prompt = buildPrompt(values, copy.promptText);
  const verdict = verdictFor(answers);
  const name = gateName.trim();

  const update =
    (field: FramingField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  function answer(question: number, value: boolean) {
    setAnswers((current) =>
      current.map((previous, index) => (index === question ? value : previous)),
    );
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage(copy.prompt.copied);
    } catch {
      const node = output.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setMessage(copy.prompt.copyFallback);
    }
  }

  function exportSheet() {
    if (!complete) return;
    startExport(async () => {
      setMessage(copy.prompt.exporting);
      const saved = await saveFramingSheet({ ...values, gateName: name, gateAnswers: answers });
      if (!saved.ok) {
        setMessage(copy.prompt.saveFailed);
        return;
      }
      try {
        const now = new Date();
        const file = framingFileName(values.goal, now);
        const { downloadFramingPdf } = await import("@/lib/pdf/framing");
        await downloadFramingPdf(
          {
            values,
            gateName: name || null,
            answers,
            verdict,
            prompt,
            date: pdfDate(now),
            tasks,
            copy: copy.pdf,
          },
          file,
        );
        setMessage(copy.prompt.exported.replace("{file}", file));
      } catch {
        setMessage(copy.prompt.exportFailed);
      }
    });
  }

  const level = clarityLevel(score);

  return (
    <>
      <CoulissesSection
        id="prompt"
        eyebrow={copy.prompt.eyebrow}
        title={copy.prompt.title}
        lead={copy.prompt.lead}
      >
        <div className="grid gap-8 rounded-sheet border-[1.5px] border-ink bg-sheet p-4 sm:p-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            {FRAMING_FIELDS.map((field) => (
              <Field
                key={field}
                label={copy.prompt.fields[field].label}
                hint={copy.prompt.fields[field].hint}
                placeholder={copy.prompt.fields[field].placeholder}
                value={values[field]}
                onChange={update(field)}
                maxLength={field === "goal" || field === "problem" ? 600 : 400}
                {...(field === "goal" || field === "problem"
                  ? { multiline: true as const, rows: 3 }
                  : {})}
              />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display font-semibold">{copy.prompt.output}</p>
              <div className="flex items-center gap-3">
                <span
                  className={clsx("rounded-full border px-3 py-0.5 meta", LEVEL_CLASSES[level])}
                >
                  {copy.prompt.score.replace("{score}", String(score))}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setValues(EMPTY_FRAMING);
                    setMessage("");
                  }}
                  className="inline-flex min-h-11 items-center gap-2 px-1 font-display text-[0.9375rem] font-semibold text-ink-soft hover:text-ink"
                >
                  <Eraser size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                  {copy.prompt.clear}
                </button>
              </div>
            </div>
            <pre
              ref={output}
              className="min-h-52 rounded-sheet border border-rule bg-paper p-4 font-mono text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
            >
              {prompt}
            </pre>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={copyPrompt} className={buttonClasses("secondary")}>
                <Copy size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                {copy.prompt.copy}
              </button>
              <button
                type="button"
                onClick={exportSheet}
                disabled={!complete || exporting}
                aria-describedby={complete ? undefined : "prompt-incomplet"}
                className={buttonClasses(
                  "primary",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <FileDown size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                {exporting ? copy.prompt.exporting : copy.prompt.export}
              </button>
            </div>
            {complete ? null : (
              <p id="prompt-incomplet" className="text-sm text-ink-soft">
                {copy.prompt.incomplete}
              </p>
            )}
            <p aria-live="polite" className="text-sm font-medium empty:hidden">
              {message}
            </p>
          </div>
        </div>
      </CoulissesSection>

      <CoulissesSection
        id="sas"
        eyebrow={copy.gate.eyebrow}
        title={copy.gate.title}
        lead={copy.gate.lead}
      >
        <div className="flex flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-sheet p-4 sm:p-6">
          <Field
            label={copy.gate.nameLabel}
            placeholder={copy.gate.namePlaceholder}
            value={gateName}
            maxLength={80}
            onChange={(event) => setGateName(event.target.value)}
          />
          <ol className="flex flex-col gap-3">
            {Array.from({ length: GATE_QUESTIONS }, (_, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sheet border border-rule bg-paper px-4 py-3"
              >
                <p id={`sas-q${index + 1}`} className="min-w-0 flex-[1_1_16rem]">
                  {copy.gate.questions[index]}
                </p>
                <div role="group" aria-labelledby={`sas-q${index + 1}`} className="flex gap-2">
                  {([true, false] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={answers[index] === value}
                      onClick={() => answer(index, value)}
                      className={clsx(
                        "min-h-11 min-w-16 rounded-full border-[1.5px] px-4 font-display text-[0.9375rem] font-semibold",
                        answers[index] === value
                          ? value
                            ? "border-success bg-success text-on-fill"
                            : "border-error bg-error text-on-fill"
                          : "border-ink bg-sheet text-ink hover:bg-paper",
                      )}
                    >
                      {value ? copy.gate.yes : copy.gate.no}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <div
            aria-live="polite"
            className={clsx(
              "flex flex-col gap-1 rounded-sheet border-[1.5px] bg-paper p-4",
              VERDICT_CLASSES[verdict],
            )}
          >
            <p className={clsx("font-display text-card font-bold", VERDICT_TITLE_CLASSES[verdict])}>
              {copy.pdf.verdicts[verdict].title}
              {name && verdict !== "NONE" ? ` · ${name}` : ""}
            </p>
            <p>{copy.pdf.verdicts[verdict].text}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAnswers([...EMPTY_GATE]);
              setGateName("");
            }}
            className={buttonClasses("secondary", "self-start")}
          >
            <RotateCcw size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {copy.gate.reset}
          </button>
        </div>
      </CoulissesSection>
    </>
  );
}
