"use server";

import { refresh } from "next/cache";
import * as z from "zod/mini";
import { GATE_QUESTIONS, verdictFor } from "@/lib/cheikh/gate";
import { requireOwner } from "@/server/owner";
import {
  createFramingSheet,
  parkFramingSheet,
  resetRoadmap,
  setRoadmapTask,
} from "@/server/repositories/cheikh.repo";
import {
  field,
  INVALID,
  optionalText,
  recordId,
  text,
  unlessMissing,
  type ActionResult,
} from "../coulisses/action-result";

/** Coche ou décoche une tâche de la feuille de route. */
export async function toggleRoadmapTask(id: string, done: boolean): Promise<ActionResult> {
  await requireOwner();
  const parsed = z.object({ id: recordId, done: z.boolean() }).safeParse({ id, done });
  if (!parsed.success) return INVALID;
  const result = await unlessMissing(() => setRoadmapTask(parsed.data.id, parsed.data.done));
  refresh();
  return result;
}

/** « Tout décocher ». */
export async function resetRoadmapTasks(): Promise<void> {
  await requireOwner();
  await resetRoadmap();
  refresh();
}

/** Les six champs sont obligatoires, comme pour l'export du dossier dans l'outil d'origine. */
const framingSheet = z.object({
  goal: text(600),
  problem: text(600),
  audience: text(400),
  context: text(400),
  constraints: text(400),
  successCriterion: text(400),
  gateName: optionalText(80),
  gateAnswers: z.array(z.nullable(z.boolean())).check(z.length(GATE_QUESTIONS)),
});

export type SaveSheetResult = { ok: true; id: string } | { ok: false };

/**
 * Chaque export du dossier PDF enregistre sa fiche : l'historique ne se perd plus.
 * Le verdict est recalculé ici à partir des réponses, jamais repris du navigateur.
 */
export async function saveFramingSheet(input: unknown): Promise<SaveSheetResult> {
  await requireOwner();
  const parsed = framingSheet.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { id } = await createFramingSheet({
    ...parsed.data,
    verdict: verdictFor(parsed.data.gateAnswers),
  });
  refresh();
  return { ok: true, id };
}

/** Une idée au parking part dans la Boîte à projets de la Boussole, en un clic. */
export async function parkSheetInCompass(formData: FormData): Promise<void> {
  await requireOwner();
  const id = recordId.safeParse(field(formData, "id"));
  if (!id.success) return;
  await parkFramingSheet(id.data);
  refresh();
}
