"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { Field } from "@/components/ui/field";
import { sendDirectRequest, type ContactState } from "./actions";
import { focusFirstInvalid, FormAlert, Honeypot, type ContactCopy } from "./form-parts";
import { DIRECT_FIELDS, formValues, LIMITS, type DirectField, type FieldErrors } from "./fields";
import { Turnstile } from "./turnstile";

export type DirectFormCopy = ContactCopy & {
  message: string;
  messageHint: string;
  submit: string;
  sending: string;
};

const IDLE: ContactState<DirectField> = { status: "idle" };

/** Le schéma Zod n'entre pas dans le JavaScript initial de l'accueil. */
const loadSchema = () => import("./schema");

/**
 * Porte 1 : nom, email ou WhatsApp, message. Validé ici à l'envoi avec le schéma de la
 * Server Action (chargé au premier focus), puis par elle, qui fait foi ; sans
 * JavaScript, le formulaire part tel quel et le serveur répond de la même façon.
 */
export function DirectForm({ locale, copy }: { locale: string; copy: DirectFormCopy }) {
  const [state, action, pending] = useActionState(sendDirectRequest, IDLE);
  const [localErrors, setLocalErrors] = useState<FieldErrors<DirectField> | null>(null);
  const [touched, setTouched] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const refused = state.status === "error" ? state : null;
  const errors = localErrors ?? refused?.fieldErrors ?? {};
  const values = refused?.values;
  const message = (field: DirectField) => {
    const key = errors[field];
    return key ? copy.errors[key] : undefined;
  };

  // Erreurs affichées (ici ou par le serveur) : le focus va au premier champ signalé.
  useEffect(() => {
    if (refused || localErrors) focusFirstInvalid(form.current);
  }, [refused, localErrors]);

  // Premier focus dans le formulaire : Turnstile peut se charger.
  useEffect(() => {
    const element = form.current;
    if (!element || touched) return;
    const arm = () => {
      setTouched(true);
      void loadSchema();
    };
    element.addEventListener("focusin", arm, { once: true });
    return () => element.removeEventListener("focusin", arm);
  }, [touched]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { directRequestSchema, fieldErrors } = await loadSchema();
    const parsed = directRequestSchema.safeParse(formValues(data, DIRECT_FIELDS));
    if (!parsed.success) {
      setLocalErrors(fieldErrors(parsed.error));
      return;
    }
    setLocalErrors(null);
    startTransition(() => action(data));
  }

  return (
    <form
      ref={form}
      action={action}
      onSubmit={onSubmit}
      noValidate
      className="relative flex flex-col gap-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <Field
        label={copy.fields.name}
        name="name"
        autoComplete="name"
        maxLength={LIMITS.name}
        required
        defaultValue={values?.name}
        error={message("name")}
      />
      <p className="-mb-1 text-sm text-ink-soft">{copy.fields.contactHint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={copy.fields.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          defaultValue={values?.email}
          error={message("email")}
        />
        <Field
          label={copy.fields.whatsapp}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={LIMITS.whatsapp}
          hint={copy.fields.whatsappHint}
          defaultValue={values?.whatsapp}
          error={message("whatsapp")}
        />
      </div>
      <Field
        multiline
        label={copy.message}
        name="message"
        rows={4}
        maxLength={LIMITS.message}
        required
        hint={copy.messageHint}
        defaultValue={values?.message}
        error={message("message")}
      />
      <Honeypot label={copy.fields.honeypot} />
      <Turnstile active={touched} locale={locale} resetKey={state} />
      <FormAlert message={refused?.formError ? copy.formErrors[refused.formError] : undefined} />
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses("primary", "self-start disabled:opacity-60 max-sm:w-full")}
      >
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}
