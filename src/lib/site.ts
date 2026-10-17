/** Repères du site, hors textes (les textes sont dans src/i18n/messages). */
export const SITE = {
  name: "CEEXFolio",
  author: "Cheikh Diack",
  fullName: "Cheikh Mohamed Tidiane Diack",
  handle: "cheikhMohamedD",
  /** Adresse publique du site, sans barre finale ; à définir au déploiement. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Profil public ; le dépôt du site reste privé. */
  github: "https://github.com/CheikhMohamedD",
  /** [À compléter] l'adresse du profil LinkedIn. */
  linkedin: "https://www.linkedin.com/",
  email: "CheikhDiack313@outlook.fr",
  /** Numéro WhatsApp au format international, sans espaces ni « + ». */
  whatsapp: "221781695896",
  whatsappDisplay: "+221 78 169 58 96",
  /** Délai de réponse annoncé, en heures. */
  responseHours: 24,
} as const;
