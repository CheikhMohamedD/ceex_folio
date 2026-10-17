"use client";

import { CircleAlert, Check } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button-classes";
import type { ActionResult } from "./action-result";

export type FormMessages = {
  saving: string;
  saved?: string;
  errors: Record<"invalid" | "notFound", string>;
};

type ActionFormProps = {
  action: (previous: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  messages: FormMessages;
  children: ReactNode;
  className?: string;
};

/**
 * Formulaire des Coulisses : la Server Action fait foi, le formulaire dit seulement
 * où en est l'envoi. Sans JavaScript, il s'envoie quand même (la page se recharge).
 */
export function ActionForm({ action, messages, children, className }: ActionFormProps) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <p aria-live="polite" className="text-sm empty:hidden">
        {state && !state.ok ? (
          <span className="flex items-center gap-1.5 font-medium text-error">
            <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {messages.errors[state.error]}
          </span>
        ) : state?.ok && messages.saved ? (
          <span className="flex items-center gap-1.5 text-success">
            <Check size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {messages.saved}
          </span>
        ) : null}
      </p>
    </form>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
  className?: string;
};

/** Bouton d'envoi, désactivé pendant que l'action tourne. */
export function SubmitButton({ children, pendingLabel, variant, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={buttonClasses(variant, className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
