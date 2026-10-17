"use server";

import { hasLocale } from "next-intl";
import { redirect } from "next/navigation";
import { localizedPath } from "@/i18n/paths";
import { routing, type Locale } from "@/i18n/routing";
import { clientRequestRepo } from "@/server/repositories/client-requests.repo";
import { hashIp, requestIp } from "@/server/request-ip";
import { verifyTurnstile } from "@/server/turnstile";
import { notifyRequest } from "./emails";
import {
  DIRECT_FIELDS,
  ENHANCED,
  formValues,
  GUIDED_FIELDS,
  HONEYPOT,
  type DirectField,
  type FieldErrors,
  type GuidedField,
} from "./fields";
import {
  rateLimitFrom,
  submitDirect,
  submitGuided,
  type ContactDeps,
  type FormError,
} from "./service";

export type ContactState<Field extends string> =
  | { status: "idle" }
  | { status: "sent" }
  | {
      status: "error";
      fieldErrors: FieldErrors<Field>;
      formError?: FormError;
      /** Valeurs envoyées, rendues au formulaire (React le réinitialise après l'envoi). */
      values: Record<Field, string>;
    };

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

function localeOf(formData: FormData): Locale {
  const value = text(formData, "locale");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

async function deps(): Promise<ContactDeps> {
  const ip = await requestIp();
  return {
    repo: clientRequestRepo(),
    verifyCaptcha: (token) => verifyTurnstile(token, ip),
    notify: notifyRequest,
    ipHash: ip ? hashIp(ip) : null,
    rateLimit: rateLimitFrom(process.env.CONTACT_RATE_LIMIT),
  };
}

function submission<Field extends string>(formData: FormData, fields: readonly Field[]) {
  return {
    values: formValues(formData, fields),
    honeypot: text(formData, HONEYPOT),
    captchaToken: text(formData, "cf-turnstile-response") || undefined,
    locale: localeOf(formData),
  };
}

/** Porte 1 : en cas de succès, la page de remerciement, avec ou sans JavaScript. */
export async function sendDirectRequest(
  _previous: ContactState<DirectField>,
  formData: FormData,
): Promise<ContactState<DirectField>> {
  const input = submission(formData, DIRECT_FIELDS);
  const outcome = await submitDirect(await deps(), input);
  if (!outcome.ok) {
    return { status: "error", ...outcome, values: input.values };
  }
  redirect(localizedPath("/contact/merci", input.locale));
}

/** Porte 2 : le parcours affiche la confirmation et le brief ; sans JavaScript, la page de remerciement. */
export async function sendGuidedRequest(
  _previous: ContactState<GuidedField>,
  formData: FormData,
): Promise<ContactState<GuidedField>> {
  const input = submission(formData, GUIDED_FIELDS);
  const outcome = await submitGuided(await deps(), input);
  if (!outcome.ok) {
    return { status: "error", ...outcome, values: input.values };
  }
  if (text(formData, ENHANCED) === "1") return { status: "sent" };
  redirect(localizedPath("/contact/merci", input.locale));
}
