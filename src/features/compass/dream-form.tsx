"use client";

import { Field } from "@/components/ui/field";
import { ActionForm, SubmitButton, type FormMessages } from "../coulisses/action-form";
import { SelectField } from "../coulisses/select-field";
import { addDream } from "./actions";

type DreamFormProps = {
  labels: { title: string; description: string; horizon: string; submit: string; optional: string };
  horizons: ReadonlyArray<{ value: string; label: string }>;
  messages: FormMessages;
};

export function DreamForm({ labels, horizons, messages }: DreamFormProps) {
  return (
    <ActionForm
      action={addDream}
      messages={messages}
      className="flex flex-col gap-4 rounded-sheet border-[1.5px] border-ink bg-sheet p-4 sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <Field label={labels.title} name="title" required maxLength={120} />
        <SelectField
          name="horizon"
          label={labels.horizon}
          required
          defaultValue={horizons[1]?.value}
          options={horizons}
        />
      </div>
      <Field
        label={labels.description}
        optional={labels.optional}
        name="description"
        multiline
        rows={2}
        maxLength={1000}
      />
      <SubmitButton pendingLabel={messages.saving} className="self-start">
        {labels.submit}
      </SubmitButton>
    </ActionForm>
  );
}
