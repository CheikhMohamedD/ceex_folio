"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile indisponible"));
    };
    document.head.append(script);
  });
  return loading;
}

type TurnstileProps = {
  /** Le script n'est chargé qu'une fois le formulaire touché (premier focus). */
  active: boolean;
  locale: string;
  /** Change à chaque envoi refusé (le résultat de l'action) : un jeton ne sert qu'une fois. */
  resetKey?: unknown;
};

/**
 * Cloudflare Turnstile, en mode « interaction seulement » : le plus souvent invisible.
 * Il dépose son jeton dans le champ cf-turnstile-response du formulaire. Rien n'est
 * rendu tant que NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas définie.
 */
export function Turnstile({ active, locale, resetKey }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !active || !container.current) return;
    const element = container.current;
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId = turnstile.render(element, {
          sitekey: SITE_KEY,
          language: locale,
          appearance: "interaction-only",
          theme: "auto",
        });
      })
      .catch(() => {
        // Sans le script (bloqueur, réseau), le serveur refusera l'envoi et le dira.
      });
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [active, locale, resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={container} />;
}
