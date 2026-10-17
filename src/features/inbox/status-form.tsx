"use client";

import { ActionForm, SubmitButton, type FormMessages } from "../coulisses/action-form";
import { SelectField } from "../coulisses/select-field";
import { changeRequestStatus } from "./actions";

type StatusFormProps = {
  id: string;
  status: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  label: string;
  submit: string;
  messages: FormMessages;
};

/** Le statut d'une demande, modifiable sur place. */
export function StatusForm({ id, status, options, label, submit, messages }: StatusFormProps) {
  return (
    <ActionForm action={changeRequestStatus} messages={messages} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3">
        <SelectField name="status" label={label} defaultValue={status} options={options} />
        <SubmitButton variant="secondary" pendingLabel={messages.saving}>
          {submit}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
