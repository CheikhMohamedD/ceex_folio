import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Client Prisma, créé au premier appel : la construction du site et les pages
 * publiques n'ont jamais besoin de la base. Une seule instance par processus, y
 * compris pendant le rechargement à chaud du développement.
 */
export function db(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante : la base n'est pas configurée.");
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForPrisma.prisma = client;
  return client;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
