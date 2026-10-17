import {
  Clapperboard,
  Globe,
  KeyRound,
  Layers,
  MapPin,
  PenTool,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { IconBadge } from "@/components/ui/icon-badge";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import { ColophonSection, SubHeading } from "./colophon-section";

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

const ICONS: Array<{ icon: LucideIcon; name: string }> = [
  { icon: Globe, name: "globe" },
  { icon: Smartphone, name: "smartphone" },
  { icon: PenTool, name: "pen-tool" },
  { icon: Clapperboard, name: "clapperboard" },
  { icon: MapPin, name: "map-pin" },
  { icon: KeyRound, name: "key-round" },
  { icon: Layers, name: "layers" },
  { icon: ShieldCheck, name: "shield-check" },
];

const rem = (px: number) => `${px / 16}rem`;

function Block({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SubHeading>{title}</SubHeading>
      <p className="max-w-[68ch] text-ink-soft">{text}</p>
      {children}
    </div>
  );
}

export async function FoundationsSection() {
  const t = await getTranslations("colophon.foundations");

  const materials = [
    { key: "paper", className: "grain bg-paper" },
    { key: "kraft", className: "grain bg-kraft" },
    { key: "hatch", className: "hatch" },
    { key: "wash", className: "bg-wash" },
  ] as const;

  const rules = [
    { key: "solid", className: "border-t-[1.5px] border-ink" },
    { key: "dotted", className: "border-t border-dotted border-ink-soft" },
    { key: "dashed", className: "border-t-[1.5px] border-dashed border-ink" },
    { key: "fine", className: "border-t border-rule" },
  ] as const;

  return (
    <ColophonSection id="fondations" number="04" title={t("title")} intro={<p>{t("intro")}</p>}>
      <div className="flex flex-col gap-14">
        <Block title={t("spacing.title")} text={t("spacing.text")}>
          <ul aria-label={t("spacing.label")} className="flex flex-wrap items-end gap-x-5 gap-y-4">
            {SPACING.map((value) => (
              <li key={value} className="flex flex-col items-start gap-2">
                <span
                  aria-hidden
                  className="block rounded-[1px] bg-ink"
                  style={{ width: rem(value), height: rem(value) }}
                />
                <span className="font-mono text-xs font-medium">{value}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t("grid.title")} text={t("grid.text")}>
          <div className="flex flex-col gap-3">
            <div
              aria-hidden
              className="grid grid-cols-4 gap-4 sm:grid-cols-8 sm:gap-6 lg:grid-cols-12"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "flex h-20 items-end justify-center rounded-sheet border border-ink hatch pb-2 font-mono text-xs font-medium",
                    index >= 4 && "hidden sm:flex",
                    index >= 8 && "sm:hidden lg:flex",
                  )}
                >
                  {index + 1}
                </span>
              ))}
            </div>
            <p className="meta text-ink-soft">
              <span className="sm:hidden">{t("grid.mobile")}</span>
              <span className="hidden sm:inline lg:hidden">{t("grid.tablet")}</span>
              <span className="hidden lg:inline">{t("grid.desktop")}</span>
            </p>
          </div>
        </Block>

        <Block title={t("shapes.title")} text={t("shapes.text")}>
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-3">
            <li className="flex flex-col gap-3">
              <Sheet raised className="grid h-24 place-items-center">
                <span className="meta">{t("shapes.sheet")}</span>
              </Sheet>
              <span className="text-sm text-ink-soft">{t("shapes.sheetSpec")}</span>
            </li>
            <li className="flex flex-col gap-3">
              <div className="flex h-24 flex-col justify-end">
                <span className="inline-flex h-11 items-center self-start rounded-t-tab border-[1.5px] border-b-0 border-ink bg-kraft grain px-4 meta">
                  {t("shapes.tab")}
                </span>
                <span aria-hidden className="block border-t-[1.5px] border-ink" />
              </div>
              <span className="text-sm text-ink-soft">{t("shapes.tabSpec")}</span>
            </li>
            <li className="flex flex-col gap-3">
              <div className="flex h-24 items-center">
                <span className="inline-flex min-h-12 items-center rounded-sheet bg-stamp-strong px-5 meta text-on-fill shadow-press">
                  {t("shapes.press")}
                </span>
              </div>
              <span className="text-sm text-ink-soft">{t("shapes.pressSpec")}</span>
            </li>
          </ul>
        </Block>

        <Block title={t("materials.title")} text={t("materials.text")}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
            {materials.map((material) => (
              <li key={material.key} className="flex flex-col gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "block h-24 rounded-sheet border-[1.5px] border-ink",
                    material.className,
                  )}
                />
                <span className="text-sm text-ink-soft">{t(`materials.${material.key}`)}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t("rules.title")} text={t("rules.text")}>
          <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.key} className="flex flex-col gap-3">
                <span aria-hidden className={cn("block w-full", rule.className)} />
                <span className="text-sm text-ink-soft">{t(`rules.${rule.key}`)}</span>
              </li>
            ))}
            <li className="flex flex-col gap-3">
              <span aria-hidden className="block h-[3px] w-10 bg-stamp" />
              <span className="text-sm text-ink-soft">{t("rules.accent")}</span>
            </li>
          </ul>
        </Block>

        <Block title={t("icons.title")} text={t("icons.text")}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            {ICONS.map(({ icon, name }) => (
              <li key={name} className="flex min-w-0 items-center gap-3">
                <IconBadge icon={icon} tone="outline" />
                <span className="min-w-0 font-mono text-sm">{name}</span>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-x-8 gap-y-4">
            <li className="flex items-center gap-3">
              <IconBadge icon={KeyRound} tone="ink" />
              <span className="text-sm text-ink-soft">{t("icons.ink")}</span>
            </li>
            <li className="cat-web flex items-center gap-3">
              <IconBadge icon={Globe} tone="category" />
              <span className="text-sm text-ink-soft">{t("icons.category")}</span>
            </li>
            <li className="flex items-center gap-3">
              <IconBadge icon={Layers} tone="outline" />
              <span className="text-sm text-ink-soft">{t("icons.outline")}</span>
            </li>
          </ul>
        </Block>
      </div>
    </ColophonSection>
  );
}
