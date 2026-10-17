/**
 * Envoi d'email par l'API HTTP de Resend, sans SDK. Texte brut seulement : le contenu
 * vient de formulaires publics, il n'est jamais interprété comme du HTML.
 * Sans RESEND_API_KEY ni RESEND_FROM (développement, CI), l'envoi est ignoré.
 */
export type Email = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 8000;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(email: Email): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return { sent: false };

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Resend a répondu ${response.status}`);
  return { sent: true };
}
