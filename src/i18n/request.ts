import { getRequestConfig } from "next-intl/server";
import messages from "./messages/fr.json";

/**
 * Français seulement pour l'instant : la version anglaise sous /en attend sa
 * validation. Les textes vivent déjà dans des fichiers de messages, donc
 * l'ajouter ne demandera pas de toucher aux composants.
 */
export const locale = "fr";

export default getRequestConfig(async () => ({
  locale,
  messages,
  timeZone: "Africa/Dakar",
}));
