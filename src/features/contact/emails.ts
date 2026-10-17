import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { sendEmail } from "@/server/email";
import type { NewClientRequest } from "@/server/repositories/client-requests.repo";
import { BUDGET_RANGES, DEADLINES, PROJECT_TYPES } from "./fields";

const isOneOf = <T extends string>(values: readonly T[], value: string | undefined): value is T =>
  value !== undefined && (values as readonly string[]).includes(value);

/** « Libellé : valeur », avec l'espace insécable de la typographie française. */
const line = (label: string, value: string | number | undefined) =>
  value === undefined || value === "" ? null : `${label} : ${value}`;

/** Ta notification, toujours en français, avec toutes les réponses. */
async function ownerEmail(request: NewClientRequest) {
  const t = await getTranslations({ locale: "fr", namespace: "contact" });
  const guided = request.channel === "GUIDED";
  const option = {
    projectType: isOneOf(PROJECT_TYPES, request.projectType)
      ? t(`options.projectType.${request.projectType}`)
      : undefined,
    budgetRange: isOneOf(BUDGET_RANGES, request.budgetRange)
      ? t(`options.budgetRange.${request.budgetRange}`)
      : undefined,
    deadline: isOneOf(DEADLINES, request.deadline)
      ? t(`options.deadline.${request.deadline}`)
      : undefined,
  };

  const contact = [
    line(t("fields.name"), request.name),
    line(t("fields.email"), request.email),
    line(t("fields.whatsapp"), request.whatsapp),
    line(t("email.language"), request.locale),
  ];
  const answers = guided
    ? [
        line(t("email.score"), `${request.qualificationScore ?? 0}/4`),
        "",
        line(t("guided.steps.type.question"), option.projectType),
        line(t("guided.steps.goal.goal"), request.goal),
        line(t("guided.steps.goal.problem"), request.problem),
        line(t("guided.steps.audience.question"), request.audience),
        line(t("guided.steps.context.question"), request.context),
        line(t("guided.steps.constraints.question"), request.constraints),
        line(t("guided.steps.budget.question"), option.budgetRange),
        line(t("guided.steps.deadline.question"), option.deadline),
        line(t("guided.steps.success.question"), request.successCriterion),
      ]
    : ["", line(t("fields.message"), request.message)];

  return {
    to: process.env.CONTACT_NOTIFY_TO ?? SITE.email,
    subject: guided
      ? t("email.notifyGuided", { name: request.name, score: request.qualificationScore ?? 0 })
      : t("email.notifyDirect", { name: request.name }),
    text: [guided ? t("email.channelGuided") : t("email.channelDirect"), "", ...contact, ...answers]
      .filter((entry) => entry !== null)
      .join("\n"),
    ...(request.email ? { replyTo: request.email } : {}),
  };
}

/** Accusé de réception, dans la langue du visiteur, s'il a laissé un email. */
async function acknowledgement(request: NewClientRequest) {
  if (!request.email) return null;
  const locale = hasLocale(routing.locales, request.locale)
    ? request.locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "contact.email" });
  return {
    to: request.email,
    subject: t("ackSubject"),
    text: t("ackBody", { name: request.name, hours: SITE.responseHours, site: SITE.url }),
    replyTo: SITE.email,
  };
}

export async function notifyRequest(request: NewClientRequest): Promise<void> {
  const ack = await acknowledgement(request);
  await Promise.all([sendEmail(await ownerEmail(request)), ...(ack ? [sendEmail(ack)] : [])]);
}
