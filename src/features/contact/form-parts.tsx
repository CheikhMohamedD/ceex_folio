import { HONEYPOT, type ContactErrorKey } from "./fields";

export type ContactCopy = {
  fields: {
    name: string;
    email: string;
    whatsapp: string;
    whatsappHint: string;
    contactHint: string;
    honeypot: string;
  };
  errors: Record<ContactErrorKey, string>;
  formErrors: Record<"captcha" | "rateLimited" | "unavailable" | "invalid", string>;
};

/** Champ piège : hors de l'écran, hors du clavier, ignoré par les lecteurs d'écran. */
export function Honeypot({ label }: { label: string }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        {label}
        <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** Erreur d'envoi (vérification, limite, base absente), annoncée dès qu'elle paraît. */
export function FormAlert({ message }: { message: string | undefined }) {
  return (
    <p role="alert" className="text-[0.9375rem] font-medium text-error empty:hidden">
      {message}
    </p>
  );
}

/** Met le focus sur le premier champ signalé, pour que l'erreur soit lue tout de suite. */
export function focusFirstInvalid(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
}
