import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/**
 * Adresse IP du visiteur, telle que la transmet l'hébergeur (Cloudflare, Vercel ou un
 * proxy). Elle ne sert qu'à la limite d'envois et n'est jamais enregistrée en clair.
 */
export async function requestIp(): Promise<string | null> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return list.get("cf-connecting-ip") ?? forwarded ?? list.get("x-real-ip") ?? null;
}

/** Empreinte HMAC-SHA256 de l'adresse ; la clé IP_HASH_SECRET la rend impossible à inverser. */
export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? "ceexfolio-ip";
  return createHmac("sha256", secret).update(ip).digest("hex");
}
