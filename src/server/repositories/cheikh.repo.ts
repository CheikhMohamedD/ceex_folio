import type { FramingValues } from "@/lib/cheikh/framing";
import { parseGateAnswers, type GateAnswer, type Verdict } from "@/lib/cheikh/gate";
import { DEFAULT_ROADMAP, type RoadmapItem } from "@/lib/cheikh/roadmap";
import { db } from "@/server/db";

/** Cheikh 2.0 : la feuille de route sur 30 jours et l'historique des fiches de cadrage. */

const ROADMAP_SELECT = { id: true, week: true, label: true, done: true } as const;

function roadmapRows() {
  return db().roadmapTask.findMany({
    orderBy: [{ week: "asc" }, { position: "asc" }],
    select: ROADMAP_SELECT,
  });
}

/** Les douze tâches, créées à la première lecture ; la clé (semaine, position) évite les doublons. */
export async function listRoadmap(): Promise<RoadmapItem[]> {
  const tasks = await roadmapRows();
  if (tasks.length > 0) return tasks;
  const positions = new Map<number, number>();
  await db().roadmapTask.createMany({
    data: DEFAULT_ROADMAP.map(({ week, label }) => {
      const position = positions.get(week) ?? 0;
      positions.set(week, position + 1);
      return { week, label, position };
    }),
    skipDuplicates: true,
  });
  return roadmapRows();
}

export async function setRoadmapTask(id: string, done: boolean): Promise<void> {
  await db().roadmapTask.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });
}

export async function resetRoadmap(): Promise<void> {
  await db().roadmapTask.updateMany({ data: { done: false, doneAt: null } });
}

export type NewFramingSheet = FramingValues & {
  gateName: string | null;
  gateAnswers: GateAnswer[];
  verdict: Verdict;
};

export type FramingSheetRecord = NewFramingSheet & {
  id: string;
  compassProjectId: string | null;
  createdAt: Date;
};

export async function createFramingSheet(data: NewFramingSheet): Promise<{ id: string }> {
  return db().framingSheet.create({ data, select: { id: true } });
}

/** Les fiches, les plus récentes d'abord. */
export async function listFramingSheets(take = 50): Promise<FramingSheetRecord[]> {
  const sheets = await db().framingSheet.findMany({ orderBy: { createdAt: "desc" }, take });
  return sheets.map((sheet) => ({ ...sheet, gateAnswers: parseGateAnswers(sheet.gateAnswers) }));
}

/**
 * Une idée mise au parking entre dans la Boîte à projets de la Boussole : un projet
 * à l'étape 1, aux scores moyens, relié à sa fiche. Une seule fois par fiche.
 */
export async function parkFramingSheet(id: string): Promise<{ projectId: string } | null> {
  return db().$transaction(async (tx) => {
    const sheet = await tx.framingSheet.findUnique({
      where: { id },
      select: { verdict: true, compassProjectId: true, gateName: true, goal: true },
    });
    if (!sheet || sheet.verdict !== "PARK" || sheet.compassProjectId) return null;
    const project = await tx.compassProject.create({
      data: {
        title: (sheet.gateName || sheet.goal).slice(0, 120),
        feasibilityScore: 3,
        impactScore: 3,
        valueChainActivities: [],
      },
      select: { id: true },
    });
    await tx.framingSheet.update({ where: { id }, data: { compassProjectId: project.id } });
    return { projectId: project.id };
  });
}
