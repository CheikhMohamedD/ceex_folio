import { qualify } from "@/lib/contact/qualification";
import type {
  ClientRequestRepo,
  NewClientRequest,
} from "@/server/repositories/client-requests.repo";
import { type DirectField, type FieldErrors, type GuidedField } from "./fields";
import { directRequestSchema, fieldErrors, guidedRequestSchema } from "./schema";

/** 5 envois par adresse IP et par heure : point de départ de la doc, à ajuster. */
export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 } as const;

/** CONTACT_RATE_LIMIT (entier positif) ajuste la limite sans redéploiement du code. */
export function rateLimitFrom(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : RATE_LIMIT.max;
}

export type FormError = "captcha" | "rateLimited" | "unavailable";

export type SubmitOutcome<Field extends string> =
  { ok: true } | { ok: false; fieldErrors: FieldErrors<Field>; formError?: FormError };

export type ContactDeps = {
  /** null : aucun stockage configuré (production sans base). */
  repo: ClientRequestRepo | null;
  verifyCaptcha: (token: string | undefined) => Promise<boolean>;
  /** Emails de la demande ; un échec d'envoi ne fait pas échouer la demande. */
  notify: (request: NewClientRequest) => Promise<void>;
  /** Empreinte de l'adresse IP, null si l'hébergeur ne la transmet pas. */
  ipHash: string | null;
  /** Envois permis par adresse et par heure ; RATE_LIMIT.max par défaut. */
  rateLimit?: number;
  now?: () => Date;
};

export type Submission<Field extends string> = {
  values: Record<Field, string>;
  /** Champ piège : rempli, c'est un robot. */
  honeypot: string;
  captchaToken?: string;
  locale: string;
};

async function store<Field extends string>(
  deps: ContactDeps,
  submission: Submission<Field>,
  request: Omit<NewClientRequest, "locale" | "ipHash">,
): Promise<SubmitOutcome<Field>> {
  if (!(await deps.verifyCaptcha(submission.captchaToken))) {
    return { ok: false, fieldErrors: {}, formError: "captcha" };
  }
  if (!deps.repo) return { ok: false, fieldErrors: {}, formError: "unavailable" };

  if (deps.ipHash) {
    const now = deps.now?.() ?? new Date();
    const since = new Date(now.getTime() - RATE_LIMIT.windowMs);
    if ((await deps.repo.countSince(deps.ipHash, since)) >= (deps.rateLimit ?? RATE_LIMIT.max)) {
      return { ok: false, fieldErrors: {}, formError: "rateLimited" };
    }
  }

  const saved: NewClientRequest = {
    ...request,
    locale: submission.locale,
    ...(deps.ipHash ? { ipHash: deps.ipHash } : {}),
  };
  await deps.repo.create(saved);
  try {
    await deps.notify(saved);
  } catch (error) {
    console.error("[contact] email non envoyé", error);
  }
  return { ok: true };
}

/** Porte 1 : nom, moyen de réponse, message. */
export async function submitDirect(
  deps: ContactDeps,
  submission: Submission<DirectField>,
): Promise<SubmitOutcome<DirectField>> {
  // Un robot reçoit la même réponse qu'un visiteur, sans que rien ne soit enregistré.
  if (submission.honeypot) return { ok: true };
  const parsed = directRequestSchema.safeParse(submission.values);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return store(deps, submission, { channel: "DIRECT", ...parsed.data });
}

/** Porte 2 : les neuf réponses du parcours, livrées avec leur score de qualification. */
export async function submitGuided(
  deps: ContactDeps,
  submission: Submission<GuidedField>,
): Promise<SubmitOutcome<GuidedField>> {
  if (submission.honeypot) return { ok: true };
  const parsed = guidedRequestSchema.safeParse(submission.values);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return store(deps, submission, {
    channel: "GUIDED",
    ...parsed.data,
    qualificationScore: qualify(parsed.data).score,
  });
}
