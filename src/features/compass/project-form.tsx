"use client";

import { Field } from "@/components/ui/field";
import { ITIL_STEPS, SCORE_MAX, SCORE_MIN, VALUE_CHAIN } from "@/lib/compass/compass";
import { ActionForm, SubmitButton, type FormMessages } from "../coulisses/action-form";
import { SelectField } from "../coulisses/select-field";
import { saveProject } from "./actions";

export type ProjectFormCopy = {
  title: string;
  feasibility: string;
  impact: string;
  step: string;
  dream: string;
  noDream: string;
  valueChain: string;
  steps: readonly string[];
  activities: Record<(typeof VALUE_CHAIN)[number], string>;
};

type ProjectFormProps = {
  copy: ProjectFormCopy;
  submit: string;
  dreams: ReadonlyArray<{ id: string; title: string }>;
  messages: FormMessages;
  /** Le projet à modifier ; sans lui, le formulaire en ajoute un. */
  project?: {
    id: string;
    title: string;
    feasibilityScore: number;
    impactScore: number;
    itilStep: number;
    valueChainActivities: readonly string[];
    dreamId: string | null;
  };
};

const SCORES = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, index) => ({
  value: SCORE_MIN + index,
  label: String(SCORE_MIN + index),
}));

/** Ajout ou modification d'un projet de la Boîte à projets. */
export function ProjectForm({ copy, submit, dreams, messages, project }: ProjectFormProps) {
  return (
    <ActionForm action={saveProject} messages={messages} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={project?.id ?? ""} />
      <Field
        label={copy.title}
        name="title"
        required
        maxLength={120}
        defaultValue={project?.title}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="feasibilityScore"
          label={copy.feasibility}
          defaultValue={project?.feasibilityScore ?? 3}
          options={SCORES}
        />
        <SelectField
          name="impactScore"
          label={copy.impact}
          defaultValue={project?.impactScore ?? 3}
          options={SCORES}
        />
        <SelectField
          name="itilStep"
          label={copy.step}
          defaultValue={project?.itilStep ?? 1}
          options={Array.from({ length: ITIL_STEPS }, (_, index) => ({
            value: index + 1,
            label: `${index + 1}. ${copy.steps[index] ?? ""}`,
          }))}
        />
        <SelectField
          name="dreamId"
          label={copy.dream}
          defaultValue={project?.dreamId ?? ""}
          options={[
            { value: "", label: copy.noDream },
            ...dreams.map((dream) => ({ value: dream.id, label: dream.title })),
          ]}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-display text-[0.9375rem] font-semibold">
          {copy.valueChain}
        </legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {VALUE_CHAIN.map((activity) => (
            <li key={activity}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sheet border border-rule bg-paper px-3 has-checked:border-ink has-checked:bg-kraft">
                <input
                  type="checkbox"
                  name="valueChain"
                  value={activity}
                  defaultChecked={project?.valueChainActivities.includes(activity)}
                  className="size-5 shrink-0 accent-(--stamp-strong)"
                />
                <span>{copy.activities[activity]}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <SubmitButton pendingLabel={messages.saving} className="self-start">
        {submit}
      </SubmitButton>
    </ActionForm>
  );
}
