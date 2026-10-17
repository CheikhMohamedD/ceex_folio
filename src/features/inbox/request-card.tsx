import { Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Sheet } from "@/components/ui/sheet";
import { REQUEST_STATUSES } from "@/lib/contact/status";
import { cn } from "@/lib/cn";
import type { InboxRequest } from "@/server/repositories/client-requests.repo";
import { formMessages } from "../coulisses/shell";
import { StatusForm } from "./status-form";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Dakar",
});

const BRIEF_FIELDS = [
  "projectType",
  "goal",
  "problem",
  "audience",
  "context",
  "constraints",
  "budgetRange",
  "deadline",
  "successCriterion",
] as const;
const OPTION_FIELDS = new Set(["projectType", "budgetRange", "deadline"]);

/** Une demande reçue : qui, comment répondre, ce qui est demandé, et son statut. */
export async function RequestCard({ request }: { request: InboxRequest }) {
  const t = await getTranslations("coulisses.requests");
  const tContact = await getTranslations("contact.options");
  const messages = await formMessages((await getTranslations("coulisses.form"))("saved"));

  const valueOf = (field: (typeof BRIEF_FIELDS)[number]) => {
    const value = request[field];
    if (!value) return null;
    const key = `${field}.${value}` as "projectType.site";
    return OPTION_FIELDS.has(field) && tContact.has(key) ? tContact(key) : value;
  };
  const brief = BRIEF_FIELDS.map((field) => ({ field, value: valueOf(field) })).filter(
    (entry): entry is { field: (typeof BRIEF_FIELDS)[number]; value: string } =>
      entry.value !== null,
  );

  return (
    <Sheet as="article" className="flex flex-col gap-4 p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "pill",
              request.status === "NEW" && "border-stamp-strong bg-sheet text-stamp-strong",
            )}
          >
            {t(`status.${request.status}`)}
          </span>
          <span className="meta text-ink-soft">{t(`channel.${request.channel}`)}</span>
          {request.qualificationScore !== null ? (
            <span className="meta text-ink-soft">
              {t("score", { score: String(request.qualificationScore) })}
            </span>
          ) : null}
        </div>
        <h2 className="font-display text-card font-semibold wrap-break-word">{request.name}</h2>
        <p className="meta text-ink-soft">
          {t("received", { date: DATE.format(request.createdAt) })} ·{" "}
          {t("locale", { locale: request.locale })}
        </p>
      </header>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {request.email ? (
          <li>
            <a
              href={`mailto:${request.email}`}
              className="inline-flex min-h-11 items-center gap-2 ink-link break-all"
              aria-label={t("write", { name: request.name })}
            >
              <Mail size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              {request.email}
            </a>
          </li>
        ) : null}
        {request.whatsapp ? (
          <li>
            <a
              href={`https://wa.me/${request.whatsapp.replace(/\D/g, "")}`}
              className="inline-flex min-h-11 items-center gap-2 ink-link"
            >
              <MessageCircle size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              {t("whatsapp")} {request.whatsapp}
            </a>
          </li>
        ) : null}
      </ul>

      {request.message ? (
        <div className="flex flex-col gap-1">
          <p className="meta text-ink-soft">{t("fields.message")}</p>
          <p className="max-w-[72ch] wrap-break-word whitespace-pre-line">{request.message}</p>
        </div>
      ) : null}

      {brief.length > 0 ? (
        <details className="group border-t border-dotted border-ink-soft pt-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-display font-semibold">
            {t("details")}
          </summary>
          <dl className="grid gap-x-6 gap-y-3 pt-2 md:grid-cols-[12rem_minmax(0,1fr)]">
            {brief.map(({ field, value }) => (
              <div key={field} className="contents">
                <dt className="meta text-ink-soft md:pt-1">{t(`fields.${field}`)}</dt>
                <dd className="max-w-[72ch] wrap-break-word whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}

      <StatusForm
        id={request.id}
        status={request.status}
        options={REQUEST_STATUSES.map((status) => ({
          value: status,
          label: t(`status.${status}`),
        }))}
        label={t("statusForm.label")}
        submit={t("statusForm.submit")}
        messages={messages}
      />
    </Sheet>
  );
}
