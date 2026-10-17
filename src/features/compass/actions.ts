"use server";

import { refresh } from "next/cache";
import * as z from "zod/mini";
import { HORIZONS, ITIL_STEPS, SCORE_MAX, SCORE_MIN, valueChainFrom } from "@/lib/compass/compass";
import { requireOwner } from "@/server/owner";
import {
  createCompassProject,
  createDream,
  deleteCompassProject,
  deleteDream,
  setActiveCompassProject,
  updateCompassProject,
} from "@/server/repositories/compass.repo";
import {
  field,
  intBetween,
  INVALID,
  OK,
  optionalText,
  recordId,
  text,
  unlessMissing,
  type ActionResult,
} from "../coulisses/action-result";

const dream = z.object({
  title: text(120),
  description: optionalText(1000),
  horizon: z.enum(HORIZONS),
});

export async function addDream(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const parsed = dream.safeParse({
    title: field(formData, "title"),
    description: field(formData, "description"),
    horizon: field(formData, "horizon"),
  });
  if (!parsed.success) return INVALID;
  await createDream(parsed.data);
  refresh();
  return OK;
}

export async function removeDream(formData: FormData): Promise<void> {
  await requireOwner();
  const id = recordId.safeParse(field(formData, "id"));
  if (!id.success) return;
  await unlessMissing(() => deleteDream(id.data));
  refresh();
}

/** Champ facultatif d'un identifiant : vide pour « aucun ». */
const optionalId = z
  .pipe(
    z.string(),
    z.transform((value) => value || null),
  )
  .check(z.refine((value) => value === null || recordId.safeParse(value).success));

const project = z.object({
  id: optionalId,
  title: text(120),
  feasibilityScore: intBetween(SCORE_MIN, SCORE_MAX),
  impactScore: intBetween(SCORE_MIN, SCORE_MAX),
  itilStep: intBetween(1, ITIL_STEPS),
  dreamId: optionalId,
});

/** Ajoute un projet à la boîte, ou modifie celui dont l'identifiant est envoyé. */
export async function saveProject(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const parsed = project.safeParse({
    id: field(formData, "id"),
    title: field(formData, "title"),
    feasibilityScore: field(formData, "feasibilityScore"),
    impactScore: field(formData, "impactScore"),
    itilStep: field(formData, "itilStep"),
    dreamId: field(formData, "dreamId"),
  });
  if (!parsed.success) return INVALID;
  const { id, ...values } = parsed.data;
  const data = { ...values, valueChainActivities: valueChainFrom(formData.getAll("valueChain")) };
  const result = id ? await unlessMissing(() => updateCompassProject(id, data)) : OK;
  if (!id) await createCompassProject(data);
  refresh();
  return result;
}

/** Le projet affiché sur le tableau de bord ; un seul à la fois. Vide pour n'en garder aucun. */
export async function makeProjectActive(formData: FormData): Promise<void> {
  await requireOwner();
  const id = optionalId.safeParse(field(formData, "id"));
  if (!id.success) return;
  await unlessMissing(() => setActiveCompassProject(id.data));
  refresh();
}

export async function removeProject(formData: FormData): Promise<void> {
  await requireOwner();
  const id = recordId.safeParse(field(formData, "id"));
  if (!id.success) return;
  await unlessMissing(() => deleteCompassProject(id.data));
  refresh();
}
