import { getTranslations } from "next-intl/server";
import { SITE } from "@/lib/site";
import type { DirectFormCopy } from "./direct-form";
import type { ContactCopy } from "./form-parts";
import type { GuidedCopy } from "./guided-path";
import {
  BUDGET_RANGES,
  DEADLINES,
  GUIDED_STEPS,
  PROJECT_TYPES,
  type ContactErrorKey,
} from "./fields";

const ERROR_KEYS = [
  "required",
  "tooShort",
  "tooLong",
  "email",
  "whatsapp",
  "contactRequired",
  "choice",
] as const satisfies readonly ContactErrorKey[];

const FORM_ERRORS = ["captcha", "rateLimited", "unavailable", "invalid"] as const;

const record = <Key extends string>(keys: readonly Key[], value: (key: Key) => string) =>
  Object.fromEntries(keys.map((key) => [key, value(key)])) as Record<Key, string>;

/** Textes communs aux deux portes, calculés côté serveur et passés aux formulaires. */
async function contactCopy(): Promise<ContactCopy> {
  const t = await getTranslations("contact");
  return {
    fields: {
      name: t("fields.name"),
      email: t("fields.email"),
      whatsapp: t("fields.whatsapp"),
      whatsappHint: t("fields.whatsappHint"),
      contactHint: t("fields.contactHint"),
      honeypot: t("fields.honeypot"),
    },
    errors: record(ERROR_KEYS, (key) => t(`errors.${key}`)),
    formErrors: record(FORM_ERRORS, (key) => t(`formErrors.${key}`)),
  };
}

export async function directFormCopy(): Promise<DirectFormCopy> {
  const t = await getTranslations("contact");
  return {
    ...(await contactCopy()),
    message: t("fields.message"),
    messageHint: t("fields.messageHint"),
    submit: t("direct.submit"),
    sending: t("direct.sending"),
  };
}

export async function guidedCopy(): Promise<GuidedCopy> {
  const t = await getTranslations("contact");
  const total = GUIDED_STEPS.length;
  const question = (id: (typeof GUIDED_STEPS)[number]["id"]) => t(`guided.steps.${id}.question`);

  return {
    ...(await contactCopy()),
    progress: GUIDED_STEPS.map((_, index) => t("guided.progress", { current: index + 1, total })),
    recapProgress: t("guided.recapProgress"),
    next: t("guided.next"),
    back: t("guided.back"),
    backToRecap: t("guided.backToRecap"),
    edit: t("guided.edit"),
    editLabels: GUIDED_STEPS.map((step) => t("guided.editLabel", { question: question(step.id) })),
    recapTitle: t("guided.recapTitle"),
    recapIntro: t("guided.recapIntro"),
    empty: t("guided.empty"),
    optional: t("guided.optional"),
    submit: t("guided.submit"),
    sending: t("guided.sending"),
    sent: {
      stamp: t("guided.sentStamp"),
      title: t("guided.sentTitle"),
      text: t("guided.sentText", { hours: SITE.responseHours }),
      download: t("guided.download"),
      home: t("guided.home"),
    },
    noscript: t("guided.noscript"),
    steps: {
      type: { question: question("type") },
      goal: {
        question: question("goal"),
        goal: t("guided.steps.goal.goal"),
        goalHint: t("guided.steps.goal.goalHint"),
        problem: t("guided.steps.goal.problem"),
      },
      audience: { question: question("audience"), hint: t("guided.steps.audience.hint") },
      context: { question: question("context"), hint: t("guided.steps.context.hint") },
      constraints: { question: question("constraints"), hint: t("guided.steps.constraints.hint") },
      budget: { question: question("budget"), hint: t("guided.steps.budget.hint") },
      deadline: { question: question("deadline") },
      success: { question: question("success"), hint: t("guided.steps.success.hint") },
      contact: { question: question("contact") },
    },
    options: {
      projectType: record(PROJECT_TYPES, (key) => t(`options.projectType.${key}`)),
      budgetRange: record(BUDGET_RANGES, (key) => t(`options.budgetRange.${key}`)),
      deadline: record(DEADLINES, (key) => t(`options.deadline.${key}`)),
    },
    brief: {
      title: t("brief.title"),
      subtitle: t("brief.subtitle"),
      // Modèle brut : la date du jour est formatée dans le navigateur, au téléchargement.
      dateTemplate: t.raw("brief.date") as string,
      footer: t("brief.footer", { email: SITE.email, whatsapp: SITE.whatsappDisplay }),
      fileName: t("brief.fileName"),
    },
  };
}
