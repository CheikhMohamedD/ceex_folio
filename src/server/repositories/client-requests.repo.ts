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
