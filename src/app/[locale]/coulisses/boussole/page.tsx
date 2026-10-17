import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Progress } from "@/components/ui/progress";
import { Stamp } from "@/components/ui/stamp";
import { DreamForm } from "@/features/compass/dream-form";
import { ProjectForm, type ProjectFormCopy } from "@/features/compass/project-form";
import { makeProjectActive, removeDream, removeProject } from "@/features/compass/actions";
import { CoulissesSection } from "@/features/coulisses/section";
import { CoulissesShell, formMessages } from "@/features/coulisses/shell";
import {
  byPriority,
  HORIZONS,
  ITIL_STEPS,
  priority,
  VALUE_CHAIN,
  valueChainFrom,
} from "@/lib/compass/compass";
import { requireOwner } from "@/server/owner";
import { listCompassProjects, listDreams } from "@/server/repositories/compass.repo";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "coulisses.compass.meta" });
  return { title: t("title") };
}

const LINK_BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 font-display text-[0.9375rem] font-semibold";

/** Un bouton de suppression qui demande confirmation, même sans JavaScript. */
function DeleteForm({
  id,
  label,
  confirm,
  hint,
  action,
}: {
  id: string;
  label: string;
  confirm: string;
  hint?: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <details className="group">
      <summary className={`${LINK_BUTTON} text-ink-soft hover:text-error`}>{label}</summary>
      <form action={action} className="flex flex-col items-start gap-2 pt-2">
        <input type="hidden" name="id" value={id} />
        {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
        <button type="submit" className="btn border-[1.5px] border-error text-error hover:bg-paper">
          {confirm}
        </button>
      </form>
    </details>
  );
}

/** La Boussole du Fondateur : les Rêves et la Boîte à projets, sur le parcours en neuf étapes. */
export default async function CompassPage() {
  const owner = await requireOwner();
  const [t, tForm, dreams, projects] = await Promise.all([
    getTranslations("coulisses.compass"),
    getTranslations("coulisses.form"),
    listDreams(),
    listCompassProjects(),
  ]);
  const messages = await formMessages(tForm("saved"));
  const stepKey = (step: number) => String(step) as "1";
  const steps = Array.from({ length: ITIL_STEPS }, (_, index) =>
    t(`itil.steps.${stepKey(index + 1)}`),
  );
  const formCopy: ProjectFormCopy = {
    title: t("projects.form.title"),
    feasibility: t("projects.form.feasibility"),
    impact: t("projects.form.impact"),
    step: t("projects.form.step"),
    dream: t("projects.form.dream"),
    noDream: t("projects.form.noDream"),
    valueChain: t("projects.form.valueChain"),
    steps,
    activities: Object.fromEntries(
      VALUE_CHAIN.map((activity) => [activity, t(`valueChain.${activity}`)]),
    ) as ProjectFormCopy["activities"],
  };
  const dreamOptions = dreams.map(({ id, title }) => ({ id, title }));
  const sorted = byPriority(projects);

  return (
    <CoulissesShell current="compass" owner={owner} title={t("title")} lead={t("lead")}>
      <CoulissesSection
        id="reves"
        eyebrow={t("dreams.eyebrow")}
        title={t("dreams.title")}
        lead={t("dreams.lead")}
      >
        <DreamForm
          labels={{
            title: t("dreams.form.title"),
            description: t("dreams.form.description"),
            horizon: t("dreams.form.horizon"),
            submit: t("dreams.form.submit"),
            optional: tForm("optional"),
          }}
          horizons={HORIZONS.map((horizon) => ({
            value: horizon,
            label: t(`dreams.horizons.${horizon}`),
          }))}
          messages={messages}
        />
        {dreams.length === 0 ? (
          <p className="text-ink-soft">{t("dreams.empty")}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {dreams.map((dream) => (
              <li key={dream.id}>
                <article className="flex h-full flex-col gap-2 rounded-sheet border-[1.5px] border-ink bg-sheet p-5">
                  <p className="meta text-stamp-strong">
                    {HORIZONS.includes(dream.horizon as (typeof HORIZONS)[number])
                      ? t(`dreams.horizons.${dream.horizon as (typeof HORIZONS)[number]}`)
                      : dream.horizon}
                  </p>
                  <h3 className="font-display text-[1.0625rem] font-semibold wrap-break-word">
                    {dream.title}
                  </h3>
                  {dream.description ? (
                    <p className="wrap-break-word whitespace-pre-line text-ink-soft">
                      {dream.description}
                    </p>
                  ) : null}
                  <p className="meta text-ink-soft">
                    {t("dreams.projects", { count: dream.projects })}
                  </p>
                  <div className="mt-auto">
                    <DeleteForm
                      id={dream.id}
                      label={t("dreams.delete")}
                      confirm={tForm("deleteConfirm")}
                      hint={t("dreams.deleteHint")}
                      action={removeDream}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </CoulissesSection>

      <CoulissesSection id="parcours" title={t("itil.title")}>
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {steps.map((name, index) => {
            const count = projects.filter((project) => project.itilStep === index + 1).length;
            return (
              <li
                key={name}
                className="flex flex-col gap-1 rounded-sheet border border-rule bg-sheet px-3 py-2 lg:min-h-28"
              >
                <span className="meta text-stamp-strong">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium">{name}</span>
                <span className="mt-auto meta text-ink-soft">{count}</span>
              </li>
            );
          })}
        </ol>
      </CoulissesSection>

      <CoulissesSection
        id="projets"
        eyebrow={t("projects.eyebrow")}
        title={t("projects.title")}
        lead={t("projects.lead")}
      >
        <details className="rounded-sheet border-[1.5px] border-ink bg-sheet">
          <summary className={`${LINK_BUTTON} px-4 sm:px-6`}>
            <Plus size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("projects.add")}
          </summary>
          <div className="border-t border-rule p-4 sm:p-6">
            <ProjectForm
              copy={formCopy}
              submit={t("projects.form.submit")}
              dreams={dreamOptions}
              messages={messages}
            />
          </div>
        </details>
        {sorted.length === 0 ? (
          <p className="text-ink-soft">{t("projects.empty")}</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {sorted.map((project) => {
              const activities = valueChainFrom(project.valueChainActivities);
              return (
                <li key={project.id}>
                  <article
                    className={`flex flex-col gap-4 rounded-sheet border-[1.5px] bg-sheet p-5 ${
                      project.active ? "border-stamp-strong" : "border-ink"
                    }`}
                  >
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="font-display text-card font-semibold wrap-break-word">
                          {project.title}
                        </h3>
                        <p className="meta text-ink-soft">
                          {t("projects.priority", { value: String(priority(project)) })} ·{" "}
                          {t("projects.scores", {
                            feasibility: String(project.feasibilityScore),
                            impact: String(project.impactScore),
                          })}
                        </p>
                      </div>
                      {project.active ? <Stamp tone="strong">{t("projects.active")}</Stamp> : null}
                    </header>
                    <Progress
                      current={project.itilStep}
                      total={ITIL_STEPS}
                      label={t("projects.step", {
                        step: String(project.itilStep),
                        total: String(ITIL_STEPS),
                        name: steps[project.itilStep - 1] ?? "",
                      })}
                    />
                    {activities.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {activities.map((activity) => (
                          <li key={activity} className="pill">
                            {t(`valueChain.${activity}`)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {project.dreamTitle || project.fromSheet ? (
                      <p className="text-sm text-ink-soft">
                        {[
                          project.dreamTitle
                            ? t("projects.dream", { title: project.dreamTitle })
                            : null,
                          project.fromSheet ? t("projects.fromSheet") : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 border-t border-dotted border-ink-soft pt-3">
                      <form action={makeProjectActive}>
                        <input type="hidden" name="id" value={project.active ? "" : project.id} />
                        <button type="submit" className={`${LINK_BUTTON} text-stamp-strong`}>
                          {project.active ? t("projects.clearActive") : t("projects.makeActive")}
                        </button>
                      </form>
                      <details className="min-w-0 flex-[1_1_100%] sm:flex-initial sm:basis-auto">
                        <summary className={LINK_BUTTON}>{t("projects.edit")}</summary>
                        <div className="pt-3">
                          <ProjectForm
                            copy={formCopy}
                            submit={t("projects.form.save")}
                            dreams={dreamOptions}
                            messages={messages}
                            project={project}
                          />
                        </div>
                      </details>
                      <DeleteForm
                        id={project.id}
                        label={t("projects.delete")}
                        confirm={tForm("deleteConfirm")}
                        action={removeProject}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </CoulissesSection>
    </CoulissesShell>
  );
}
