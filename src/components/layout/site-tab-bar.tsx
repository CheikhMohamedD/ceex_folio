import { BriefcaseBusiness, Heart, Send, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileTabBar } from "@/components/ui/mobile-tab-bar";

/** Barre d'onglets du site sous 640 px. */
export function SiteTabBar() {
  const t = useTranslations("nav");
  return (
    <MobileTabBar
      label={t("mobileLabel")}
      items={[
        { href: "/#prez", label: t("prez"), icon: UserRound },
        { href: "/#pro-life", label: t("proLife"), icon: BriefcaseBusiness },
        { href: "/#hobbies", label: t("hobbies"), icon: Heart },
        { href: "/#reach-out", label: t("reachOut"), icon: Send },
      ]}
    />
  );
}
