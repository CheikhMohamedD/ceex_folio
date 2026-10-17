import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Masthead } from "@/components/ui/masthead";
import { SubmitButton } from "@/features/coulisses/action-form";
import { signInWithGitHub } from "@/features/coulisses/auth-actions";
import { pageLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "fr", namespace: "connexion.meta" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Porte des Coulisses : un seul bouton, « Continuer avec GitHub ». En français seulement. */
export default async function SignInPage({ params }: PageProps<"/[locale]/connexion">) {
  if ((await pageLocale(params)) !== "fr") notFound();
  const t = await getTranslations("connexion");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 pb-24 sm:px-6 lg:px-20 lg:pt-12">
      <Masthead start={t("masthead")} />
      <div className="flex max-w-[40rem] flex-col items-start gap-6">
        <h1 className="font-display text-section font-semibold">{t("title")}</h1>
        <p className="text-body text-ink-soft">{t("text")}</p>
        <form action={signInWithGitHub}>
          <SubmitButton pendingLabel={t("pending")}>
            <KeyRound size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {t("button")}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
