"use client";

import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { Field } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Stamp } from "@/components/ui/stamp";
import { localizedPath } from "@/i18n/paths";
import type { Locale } from "@/i18n/routing";
import { downloadBrief, type Brief } from "@/lib/pdf/brief";
import { sendGuidedRequest, type ContactState } from "./actions";
import { ChoiceList } from "./choice-list";
import { FormAlert, Honeypot, type ContactCopy } from "./form-parts";
import {
  BUDGET_RANGES,
  DEADLINES,
  ENHANCED,
  GUIDED_FIELDS,
  GUIDED_STEPS,
  LIMITS,
  PROJECT_TYPES,
  type FieldErrors,
  type GuidedField,
  type GuidedStepId,
} from "./fields";
import { Turnstile } from "./turnstile";

type StepCopy = { question: string; hint?: string };

export type GuidedCopy = ContactCopy & {
  /** « Question 3 sur 9 », une entrée par étape. */
  progress: string[];
  recapProgress: string;
  next: string;
  back: string;
  backToRecap: string;
  edit: string;
  /** « Modifier : De quoi as-tu besoin ? », une entrée par étape. */
  editLabels: string[];
  recapTitle: string;
  recapIntro: string;
  empty: string;
  optional: string;
  submit: string;
  sending: string;
  sent: { stamp: string; title: string; text: string; download: string; home: string };
  noscript: string;
  steps: Record<GuidedStepId, StepCopy> & {
    goal: StepCopy & { goal: string; goalHint: string; problem: string };
  };
  options: {
    projectType: Record<(typeof PROJECT_TYPES)[number], string>;
    budgetRange: Record<(typeof BUDGET_RANGES)[number], string>;
    deadline: Record<(typeof DEADLINES)[number], string>;
  };
  /** dateTemplate : « Le {date} », complété au téléchargement avec la date du jour. */
  brief: Omit<Brief, "sections" | "date"> & { dateTemplate: string; fileName: string };
};

type Answers = Record<GuidedField, string>;

const RECAP = GUIDED_STEPS.length;
/** Étapes à choix : leur aide s'affiche sous la question (les champs texte la portent). */
const CHOICE_STEPS = new Set<GuidedStepId>(["type", "budget", "deadline"]);
const EMPTY = Object.fromEntries(GUIDED_FIELDS.map((field) => [field, ""])) as Answers;
const IDLE: ContactState<GuidedField> = { status: "idle" };
/** Brouillon dans l'onglet : un rechargement ne fait pas perdre les réponses. */
const DRAFT_KEY = "ceexfolio:parcours";

function readDraft(): { answers: Answers; step: number } | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as {
      answers?: Partial<Answers>;
      step?: number;
    } | null;
    if (!draft?.answers) return null;
    const answers = { ...EMPTY };
    for (const field of GUIDED_FIELDS) {
      const value = draft.answers[field];
      if (typeof value === "string") answers[field] = value;
    }
    const step = Number.isInteger(draft.step) ? Math.min(Math.max(draft.step ?? 0, 0), RECAP) : 0;
    return { answers, step };
  } catch {
    return null;
  }
}

function writeDraft(value: { answers: Answers; step: number } | null): void {
  try {
    if (value) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Navigation privée ou stockage bloqué : le parcours marche sans brouillon.
  }
}

/** Le schéma Zod se charge après l'affichage, pendant que la première question se lit. */
const loadSchema = () => import("./schema");

async function errorsOf(answers: Answers): Promise<FieldErrors<GuidedField>> {
  const { fieldErrors, guidedRequestSchema } = await loadSchema();
  const parsed = guidedRequestSchema.safeParse(answers);
  return parsed.success ? {} : fieldErrors<GuidedField>(parsed.error);
}

/** Index de la première étape qui porte une erreur, ou -1. */
function firstStepWithError(errors: FieldErrors<GuidedField>): number {
  return GUIDED_STEPS.findIndex((step) => step.fields.some((field: GuidedField) => errors[field]));
}

/**
 * Porte 2 : une question par écran, une barre de progression, retour possible, puis
 * un récapitulatif à corriger avant l'envoi. Sans JavaScript, les neuf questions
 * s'affichent sur une seule page (voir le style du <noscript>).
 */
export function GuidedPath({ locale, copy }: { locale: Locale; copy: GuidedCopy }) {
  const [state, action, pending] = useActionState(sendGuidedRequest, IDLE);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors<GuidedField>>({});
  const [fromRecap, setFromRecap] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const headings = useRef<Array<HTMLElement | null>>([]);
  const moved = useRef(false);

  const refused = state.status === "error" ? state : null;
  const sent = state.status === "sent";

  useEffect(() => {
    void loadSchema();
    const draft = readDraft();
    // Restauration du brouillon après l'hydratation, pour ne pas désaccorder le rendu serveur.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (draft) {
      setAnswers(draft.answers);
      setStep(draft.step);
    }
    setEnhanced(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (enhanced && !sent) writeDraft({ answers, step });
  }, [answers, step, enhanced, sent]);

  useEffect(() => {
    if (sent) writeDraft(null);
  }, [sent]);

  // Erreurs renvoyées par le serveur : retour à la première étape concernée.
  useEffect(() => {
    if (!refused) return;
    const target = firstStepWithError(refused.fieldErrors);
    /* eslint-disable react-hooks/set-state-in-effect */
    setErrors(refused.fieldErrors);
    if (target >= 0) {
      moved.current = true;
      setStep(target);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refused]);

  // À chaque changement d'écran, le focus va à la question (ou au premier champ en erreur).
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const invalid = form.current?.querySelector<HTMLElement>(
      `[data-step="${step}"] :is([aria-invalid="true"], [data-invalid="true"])`,
    );
    (invalid ?? headings.current[step])?.focus();
  }, [step, errors]);

  function go(target: number) {
    moved.current = true;
    setStep(target);
  }

  function update(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as GuidedField;
    setAnswers((current) => ({ ...current, [field]: event.target.value }));
  }

  async function next() {
    const all = await errorsOf(answers);
    const own = Object.fromEntries(
      GUIDED_STEPS[step]!.fields.flatMap((field: GuidedField) =>
        all[field] ? [[field, all[field]]] : [],
      ),
    ) as FieldErrors<GuidedField>;
    setErrors(own);
    if (Object.keys(own).length > 0) {
      // Même écran : l'effet de focus ci-dessus vise le premier champ signalé.
      moved.current = true;
      return;
    }
    go(fromRecap ? RECAP : step + 1);
    if (fromRecap) setFromRecap(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!enhanced) return; // Avant l'hydratation, le formulaire part tel quel.
    event.preventDefault();
    if (step !== RECAP) return next();
    const data = new FormData(event.currentTarget);
    const all = await errorsOf(answers);
    const target = firstStepWithError(all);
    if (target >= 0) {
      setErrors(all);
      go(target);
      return;
    }
    startTransition(() => action(data));
  }

  const message = (field: GuidedField) => {
    const key = errors[field];
    return key ? copy.errors[key] : undefined;
  };

  const display = (field: GuidedField): string => {
    const value = answers[field];
    if (!value) return "";
    if (field === "projectType")
      return copy.options.projectType[value as keyof typeof copy.options.projectType] ?? value;
    if (field === "budgetRange")
      return copy.options.budgetRange[value as keyof typeof copy.options.budgetRange] ?? value;
    if (field === "deadline")
      return copy.options.deadline[value as keyof typeof copy.options.deadline] ?? value;
    return value;
  };

  const sections = GUIDED_STEPS.map((item) => ({
    id: item.id,
    label: copy.steps[item.id].question,
    value: item.fields
      .map((field: GuidedField) => display(field))
      .filter(Boolean)
      .join("\n"),
  }));

  if (sent) {
    return (
      <section aria-labelledby="parcours-envoye" className="flex flex-col items-start gap-5">
        <Stamp tone="success">{copy.sent.stamp}</Stamp>
        <h2
          id="parcours-envoye"
          tabIndex={-1}
          ref={(element) => element?.focus()}
          className="font-display text-section font-semibold"
        >
          {copy.sent.title}
        </h2>
        <p className="max-w-[60ch] text-body text-ink-soft">{copy.sent.text}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonClasses("primary", "max-sm:w-full")}
            onClick={() =>
              void downloadBrief(
                {
                  title: copy.brief.title,
                  subtitle: copy.brief.subtitle,
                  date: copy.brief.dateTemplate.replace(
                    "{date}",
                    new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date()),
                  ),
                  footer: copy.brief.footer,
                  sections: sections.map(({ label, value }) => ({
                    label,
                    value: value || copy.empty,
                  })),
                },
                copy.brief.fileName,
              )
            }
          >
            <Download size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {copy.sent.download}
          </button>
          <a href={localizedPath("/", locale)} className={buttonClasses("secondary")}>
            {copy.sent.home}
          </a>
        </div>
      </section>
    );
  }

  const text = (
    field: GuidedField,
    props: { label: string; hint?: string; optional?: boolean; hideLabel?: boolean },
  ) => (
    <Field
      multiline
      name={field}
      rows={field === "goal" ? 4 : 3}
      maxLength={LIMITS[field as keyof typeof LIMITS]}
      value={answers[field]}
      onChange={update}
      label={props.label}
      hideLabel={props.hideLabel}
      hint={props.hint}
      optional={props.optional ? copy.optional : undefined}
      error={message(field)}
    />
  );

  const body: Record<GuidedStepId, React.ReactNode> = {
    type: (
      <ChoiceList
        name="projectType"
        options={PROJECT_TYPES}
        labels={copy.options.projectType}
        value={answers.projectType}
        onChange={update}
        error={message("projectType")}
      />
    ),
    goal: (
      <>
        {text("goal", { label: copy.steps.goal.goal, hint: copy.steps.goal.goalHint })}
        {text("problem", { label: copy.steps.goal.problem, optional: true })}
      </>
    ),
    audience: text("audience", {
      label: copy.steps.audience.question,
      hint: copy.steps.audience.hint,
      hideLabel: true,
    }),
    context: text("context", {
      label: copy.steps.context.question,
      hint: copy.steps.context.hint,
      optional: true,
      hideLabel: true,
    }),
    constraints: text("constraints", {
      label: copy.steps.constraints.question,
      hint: copy.steps.constraints.hint,
      optional: true,
      hideLabel: true,
    }),
    budget: (
      <ChoiceList
        name="budgetRange"
        options={BUDGET_RANGES}
        labels={copy.options.budgetRange}
        value={answers.budgetRange}
        onChange={update}
        error={message("budgetRange")}
      />
    ),
    deadline: (
      <ChoiceList
        name="deadline"
        options={DEADLINES}
        labels={copy.options.deadline}
        value={answers.deadline}
        onChange={update}
        error={message("deadline")}
      />
    ),
    success: text("successCriterion", {
      label: copy.steps.success.question,
      hint: copy.steps.success.hint,
      optional: true,
      hideLabel: true,
    }),
    contact: (
      <>
        <Field
          name="name"
          autoComplete="name"
          maxLength={LIMITS.name}
          value={answers.name}
          onChange={update}
          label={copy.fields.name}
          error={message("name")}
        />
        <p className="-mb-1 text-sm text-ink-soft">{copy.fields.contactHint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={LIMITS.email}
            value={answers.email}
            onChange={update}
            label={copy.fields.email}
            error={message("email")}
          />
          <Field
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={LIMITS.whatsapp}
            value={answers.whatsapp}
            onChange={update}
            label={copy.fields.whatsapp}
            hint={copy.fields.whatsappHint}
            error={message("whatsapp")}
          />
        </div>
      </>
    ),
  };

  return (
    <form
      ref={form}
      action={action}
      onSubmit={onSubmit}
      noValidate
      className="guided relative flex flex-col gap-8"
    >
      {/* Sans JavaScript : toutes les questions (!important, comme la règle [hidden] de la
          préflight Tailwind), sans boutons d'étape, et un envoi en bas. */}
      <noscript>
        <style>{`.guided [data-step][hidden]{display:flex!important}.guided-nav,.guided-progress{display:none}`}</style>
        <p className="text-sm text-ink-soft">{copy.noscript}</p>
      </noscript>
      <input type="hidden" name="locale" value={locale} />
      {enhanced ? <input type="hidden" name={ENHANCED} value="1" /> : null}

      <Progress
        className="guided-progress"
        current={Math.min(step + 1, RECAP)}
        total={RECAP}
        label={step < RECAP ? (copy.progress[step] ?? "") : copy.recapProgress}
      />

      {GUIDED_STEPS.map((item, index) => (
        <fieldset
          key={item.id}
          data-step={index}
          hidden={index !== step}
          className="flex min-w-0 flex-col gap-5"
        >
          <legend className="mb-5">
            <h2
              tabIndex={-1}
              ref={(element) => {
                headings.current[index] = element;
              }}
              className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-tight font-semibold focus-visible:outline-none"
            >
              {copy.steps[item.id].question}
            </h2>
          </legend>
          {CHOICE_STEPS.has(item.id) && copy.steps[item.id].hint ? (
            <p className="-mt-2 text-sm text-ink-soft">{copy.steps[item.id].hint}</p>
          ) : null}
          {body[item.id]}
          <div className="guided-nav flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void next()}
              className={buttonClasses("primary", "max-sm:w-full")}
            >
              {fromRecap ? copy.backToRecap : copy.next}
              {fromRecap ? null : (
                <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              )}
            </button>
            {index > 0 && !fromRecap ? (
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  go(index - 1);
                }}
                className={buttonClasses("secondary", "max-sm:w-full")}
              >
                <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
                {copy.back}
              </button>
            ) : null}
          </div>
        </fieldset>
      ))}

      {step === RECAP ? (
        <section data-step={RECAP} aria-labelledby="parcours-recap" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2
              id="parcours-recap"
              tabIndex={-1}
              ref={(element) => {
                headings.current[RECAP] = element;
              }}
              className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-tight font-semibold focus-visible:outline-none"
            >
              {copy.recapTitle}
            </h2>
            <p className="text-ink-soft">{copy.recapIntro}</p>
          </div>
          <dl className="flex flex-col rounded-sheet border-[1.5px] border-ink bg-sheet">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="grid gap-2 border-t border-dotted border-ink-soft px-4 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-5"
              >
                <dt className="meta text-ink-soft sm:col-span-2">{section.label}</dt>
                <dd className="min-w-0 wrap-break-word whitespace-pre-line">
                  {section.value || <span className="text-ink-soft italic">{copy.empty}</span>}
                </dd>
                <dd>
                  <button
                    type="button"
                    aria-label={copy.editLabels[index]}
                    onClick={() => {
                      setFromRecap(true);
                      go(index);
                    }}
                    className="inline-flex min-h-11 items-center ink-link"
                  >
                    {copy.edit}
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          <Turnstile active locale={locale} resetKey={state} />
          <FormAlert
            message={refused?.formError ? copy.formErrors[refused.formError] : undefined}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className={buttonClasses("primary", "disabled:opacity-60 max-sm:w-full")}
            >
              {pending ? copy.sending : copy.submit}
            </button>
            <button
              type="button"
              onClick={() => go(RECAP - 1)}
              className={buttonClasses("secondary", "max-sm:w-full")}
            >
              <ArrowLeft size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              {copy.back}
            </button>
          </div>
        </section>
      ) : null}

      <Honeypot label={copy.fields.honeypot} />
      {/* Envoi sans JavaScript : le navigateur n'affiche ce bouton que si les scripts sont coupés. */}
      <noscript>
        <button type="submit" className={buttonClasses("primary", "self-start max-sm:w-full")}>
          {copy.submit}
        </button>
      </noscript>
    </form>
  );
}
