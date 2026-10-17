import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CoulissesShell } from "@/features/coulisses/shell";
import { RequestCard } from "@/features/inbox/request-card";
import { Link } from "@/i18n/link";
import { cn } from "@/lib/cn";
import { isRequestStatus, REQUEST_STATUSES } from "@/lib/contact/status";
import { requireOwner } from "@/server/owner";
import {
  countClientRequestsByStatus,
  listClientRequests,
} from "@/server/repositories/client-requests.repo";

export const instant = false;

const LIMIT = 200;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "coulisses.requests.meta" });
  return { title: t("title") };
}

/** La boîte des demandes : tout ce qui arrive par les deux portes du contact. */
export default async function RequestsPage({
  searchParams,
}: PageProps<"/[locale]/coulisses/demandes">) {
  const owner = await requireOwner();
  const { statut } = await searchParams;
  const status = isRequestStatus(statut) ? statut : undefined;
  const [t, requests, counts] = await Promise.all([
    getTranslations("coulisses.requests"),
    listClientRequests(status, LIMIT),
    countClientRequestsByStatus(),
  ]);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const filters = [
    { key: "all", href: "/coulisses/demandes", label: t("filters.all"), count: total, on: !status },
    ...REQUEST_STATUSES.map((value) => ({
      key: value,
      href: `/coulisses/demandes?statut=${value}`,
      label: t(`status.${value}`),
      count: counts[value],
      on: status === value,
    })),
  ];

  return (
    <CoulissesShell current="requests" owner={owner} title={t("title")} lead={t("lead")}>
      <nav aria-label={t("filters.label")}>
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <li key={filter.key}>
              <Link
                href={filter.href}
                aria-current={filter.on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-4 text-[0.9375rem]",
                  filter.on ? "bg-ink text-on-fill" : "bg-sheet hover:bg-paper",
                )}
              >
                {filter.label}
                <span className="meta">{filter.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {requests.length === 0 ? (
        <p className="text-ink-soft">{status ? t("emptyFiltered") : t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ol>
      )}
      {requests.length === LIMIT ? <p className="meta text-ink-soft">{t("limit")}</p> : null}
    </CoulissesShell>
  );
}
