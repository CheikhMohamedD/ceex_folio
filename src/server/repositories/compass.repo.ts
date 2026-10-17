import type { Prisma } from "@/generated/prisma/client";
import type { Horizon, ValueChainActivity } from "@/lib/compass/compass";
import { db } from "@/server/db";

/** La Boussole : les Rêves et la Boîte à projets. */

export type DreamRecord = {
  id: string;
  title: string;
  description: string | null;
  horizon: string;
  createdAt: Date;
  projects: number;
};

export type CompassProjectRecord = {
  id: string;
  title: string;
  feasibilityScore: number;
  impactScore: number;
  itilStep: number;
  valueChainActivities: string[];
  active: boolean;
  dreamId: string | null;
  dreamTitle: string | null;
  /** La fiche de cadrage d'où vient le projet, s'il sort du parking de Cheikh 2.0. */
  fromSheet: boolean;
  createdAt: Date;
};

export async function listDreams(): Promise<DreamRecord[]> {
  const dreams = await db().dream.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });
  return dreams.map(({ _count, ...dream }) => ({ ...dream, projects: _count.projects }));
}

export async function createDream(data: {
  title: string;
  description: string | null;
  horizon: Horizon;
}): Promise<void> {
  await db().dream.create({ data });
}

/** Les projets reliés au rêve restent dans la boîte, sans rêve. */
export async function deleteDream(id: string): Promise<void> {
  await db().dream.delete({ where: { id } });
}

const PROJECT_INCLUDE = {
  dream: { select: { title: true } },
  framingSheet: { select: { id: true } },
} as const;

type ProjectRow = Prisma.CompassProjectGetPayload<{ include: typeof PROJECT_INCLUDE }>;

function toRecord({ dream, framingSheet, ...project }: ProjectRow): CompassProjectRecord {
  return { ...project, dreamTitle: dream?.title ?? null, fromSheet: framingSheet !== null };
}

export async function listCompassProjects(): Promise<CompassProjectRecord[]> {
  const projects = await db().compassProject.findMany({ include: PROJECT_INCLUDE });
  return projects.map(toRecord);
}

export async function activeCompassProject(): Promise<CompassProjectRecord | null> {
  const project = await db().compassProject.findFirst({
    where: { active: true },
    include: PROJECT_INCLUDE,
  });
  return project ? toRecord(project) : null;
}

export type CompassProjectInput = {
  title: string;
  feasibilityScore: number;
  impactScore: number;
  itilStep: number;
  valueChainActivities: ValueChainActivity[];
  dreamId: string | null;
};

export async function createCompassProject(data: CompassProjectInput): Promise<void> {
  await db().compassProject.create({ data });
}

export async function updateCompassProject(id: string, data: CompassProjectInput): Promise<void> {
  await db().compassProject.update({ where: { id }, data });
}

/** Un seul projet actif à la fois (BUG-01 de Cheikh 2.0) ; null n'en garde aucun. */
export async function setActiveCompassProject(id: string | null): Promise<void> {
  await db().$transaction([
    db().compassProject.updateMany({ where: { active: true }, data: { active: false } }),
    ...(id ? [db().compassProject.update({ where: { id }, data: { active: true } })] : []),
  ]);
}

export async function deleteCompassProject(id: string): Promise<void> {
  await db().compassProject.delete({ where: { id } });
}
