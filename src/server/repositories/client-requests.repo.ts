import { REQUEST_STATUSES, type RequestStatus } from "@/lib/contact/status";
import { db, hasDatabase } from "@/server/db";

export type RequestChannel = "DIRECT" | "GUIDED";

export type NewClientRequest = {
  channel: RequestChannel;
  locale: string;
  name: string;
  email?: string;
  whatsapp?: string;
  message?: string;
  projectType?: string;
  goal?: string;
  problem?: string;
  audience?: string;
  context?: string;
  constraints?: string;
  budgetRange?: string;
  deadline?: string;
  successCriterion?: string;
  qualificationScore?: number;
  ipHash?: string;
};

/** Seul accès aux demandes clients : les features passent par ce contrat. */
export type ClientRequestRepo = {
  create(data: NewClientRequest): Promise<{ id: string }>;
  /** Demandes envoyées depuis la même adresse (empreinte) depuis `since`. */
  countSince(ipHash: string, since: Date): Promise<number>;
};

const prismaRepo: ClientRequestRepo = {
  async create(data) {
    const { id } = await db().clientRequest.create({ data, select: { id: true } });
    return { id };
  },
  countSince(ipHash, since) {
    return db().clientRequest.count({ where: { ipHash, createdAt: { gte: since } } });
  },
};

type StoredRequest = NewClientRequest & { id: string; createdAt: Date };
const memory: StoredRequest[] = [];

/**
 * Stockage en mémoire, perdu au redémarrage : pour le développement et les tests de
 * bout en bout, jamais pour la production (CONTACT_STORE=memory l'impose).
 */
const memoryRepo: ClientRequestRepo = {
  async create(data) {
    const stored = { ...data, id: `mem-${memory.length + 1}`, createdAt: new Date() };
    memory.push(stored);
    return { id: stored.id };
  },
  async countSince(ipHash, since) {
    return memory.filter((request) => request.ipHash === ipHash && request.createdAt >= since)
      .length;
  },
};

/**
 * La base si DATABASE_URL est définie ; sinon la mémoire, en développement ou si
 * CONTACT_STORE=memory. En production sans base, null : le formulaire l'annonce et
 * renvoie vers l'email et WhatsApp, toujours affichés.
 */
export function clientRequestRepo(): ClientRequestRepo | null {
  if (hasDatabase()) return prismaRepo;
  if (process.env.CONTACT_STORE === "memory" || process.env.NODE_ENV === "development") {
    return memoryRepo;
  }
  return null;
}

// ── Coulisses ──────────────────────────────────────────────────────────────────
// Lecture et suivi des demandes reçues : seulement depuis la base, derrière requireOwner().

export type InboxRequest = {
  id: string;
  channel: RequestChannel;
  locale: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  message: string | null;
  projectType: string | null;
  goal: string | null;
  problem: string | null;
  audience: string | null;
  context: string | null;
  constraints: string | null;
  budgetRange: string | null;
  deadline: string | null;
  successCriterion: string | null;
  qualificationScore: number | null;
  status: RequestStatus;
  createdAt: Date;
};

/** Les demandes, les plus récentes d'abord ; filtrées par statut si demandé. */
export function listClientRequests(status?: RequestStatus, take = 200): Promise<InboxRequest[]> {
  return db().clientRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    omit: { ipHash: true },
  });
}

/** Nombre de demandes par statut, pour le tableau de bord et les filtres. */
export async function countClientRequestsByStatus(): Promise<Record<RequestStatus, number>> {
  const groups = await db().clientRequest.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = Object.fromEntries(REQUEST_STATUSES.map((status) => [status, 0])) as Record<
    RequestStatus,
    number
  >;
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export async function setClientRequestStatus(id: string, status: RequestStatus): Promise<void> {
  await db().clientRequest.update({ where: { id }, data: { status } });
}
