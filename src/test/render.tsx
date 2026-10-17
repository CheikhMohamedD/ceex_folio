import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import messages from "@/i18n/messages/fr.json";

/** Rendu avec les messages français, comme dans l'application. */
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages} timeZone="Africa/Dakar">
      {ui}
    </NextIntlClientProvider>,
  );
}
