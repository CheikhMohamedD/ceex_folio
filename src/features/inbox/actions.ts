"use server";

import { refresh } from "next/cache";
import * as z from "zod/mini";
import { REQUEST_STATUSES } from "@/lib/contact/status";
import { requireOwner } from "@/server/owner";
import { setClientRequestStatus } from "@/server/repositories/client-requests.repo";
import {
  field,
  INVALID,
  recordId,
  unlessMissing,
  type ActionResult,
} from "../coulisses/action-result";

const statusChange = z.object({ id: recordId, status: z.enum(REQUEST_STATUSES) });

/** Fait avancer une demande dans son cycle : nouvelle, qualifiée, en discussion, gagnée, perdue. */
export async function changeRequestStatus(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOwner();
  const parsed = statusChange.safeParse({
    id: field(formData, "id"),
    status: field(formData, "status"),
  });
  if (!parsed.success) return INVALID;
  const result = await unlessMissing(() =>
    setClientRequestStatus(parsed.data.id, parsed.data.status),
  );
  refresh();
  return result;
}
