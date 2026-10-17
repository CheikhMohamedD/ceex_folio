import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Progress } from "@/components/ui/progress";
import { Sheet } from "@/components/ui/sheet";
import { CoulissesShell } from "@/features/coulisses/shell";
import { Link } from "@/i18n/link";
import { roadmapProgress } from "@/lib/cheikh/roadmap";
import { ITIL_STEPS } from "@/lib/compass/compass";
import { requireOwner } from "@/server/owner";
import { listRoadmap } from "@/server/repositories/cheikh.repo";
import { countClientRequestsByStatus } from "@/server/repositories/client-requests.repo";
import { activeCompassProject } from "@/server/repositories/compass.repo";

/** Lit la session et la base à chaque requête : la page attend le serveur. */
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "coulisses.dashboard.meta" });
  return { title: t("title") };
}

/** Tableau de bord : le rituel du vendredi sur un seul écran. */
export default async function DashboardPage() {
  const owner = await requireOwner();
  const [t, tasks, counts, active] = await Promise.all([
    getTranslations("coulisses"),
    listRoadmap(),
    countClientRequestsByStatus(),
    activeCompassProject(),
  ]);
  const progress = roadmapProgress(tasks);
  const received = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const cards = [
    {
      key: "roadmap",
      label: t("dashboard.roadmap.label"),
      value: t("dashboard.roadmap.value", {
        done: String(progress.done),
        total: String(progress.total),
      }),
      detail: (
        <Progress
          current={progress.done}
          total={Math.max(progress.total, 1)}
          label={t("cheikh.roadmap.progress", {
            done: String(progress.done),
            total: String(progress.total),
          })}
        />
      ),
      href: "/coulisses/cheikh-2-0#roadmap",
      link: t("dashboard.roadmap.link"),
    },
    {
      key: "requests",
      label: t("dashboard.requests.label"),
      value: t("dashboard.requests.value", { count: counts.NEW }),
      detail: <p className="text-ink-soft">{t("dashboard.requests.total", { count: received })}</p>,
      href: counts.NEW > 0 ? "/coulisses/demandes?statut=NEW" : "/coulisses/demandes",
      link: t("dashboard.requests.link"),
    },
    {
      key: "active",
      label: t("dashboard.active.label"),
      value: active ? active.title : t("dashboard.active.none"),
      detail: (
        <p className="text-ink-soft">
          {active
            ? t("dashboard.active.step", {
                step: String(active.itilStep),
                total: String(ITIL_STEPS),
                name: t(`compass.itil.steps.${active.itilStep}` as "compass.itil.steps.1"),
              })
            : t("dashboard.active.noneHint")}
        </p>
      ),
      href: "/coulisses/boussole#projets",
      link: t("dashboard.active.link"),
    },
  ];

  return (
    <CoulissesShell
      current="dashboard"
      owner={owner}
      title={t("dashboard.title")}
      lead={t("dashboard.lead")}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.key}>
            <Sheet as="article" className="flex h-full flex-col gap-4 p-5">
              <h2 className="meta text-ink-soft">{card.label}</h2>
              <p className="font-display text-card font-semibold wrap-break-word">{card.value}</p>
              {card.detail}
              <Link
                href={card.href}
                className="mt-auto inline-flex min-h-11 items-center gap-2 font-display font-semibold text-stamp-strong"
              >
                {card.link}
                <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              </Link>
            </Sheet>
          </li>
        ))}
      </ul>
      <aside className="flex flex-col gap-2 rounded-sheet border-[1.5px] border-stamp-strong bg-sheet p-5">
        <h2 className="font-display text-[1.0625rem] font-semibold text-stamp-strong">
          {t("dashboard.ritual.title")}
        </h2>
        <p className="max-w-[72ch]">{t("dashboard.ritual.text")}</p>
      </aside>
    </CoulissesShell>
  );
}
