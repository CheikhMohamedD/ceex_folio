import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "strong" | "ink" | "success" | "error" | "category";

const tones: Record<Tone, string> = {
  strong: "text-stamp-strong",
  ink: "text-ink",
  success: "text-success",
  error: "text-error",
  category: "text-(--cat)",
};

type StampProps = {
  children: ReactNode;
  tone?: Tone;
  /** Double trait, comme le tampon « Disponible ». */
  double?: boolean;
  /** Inclinaison en degrés. */
  tilt?: number;
  /** Fond papier, pour un tampon posé sur une image. */
  onImage?: boolean;
  className?: string;
};

/**
 * Tampon : statut ou catégorie, légèrement incliné. Le texte est petit, donc
 * jamais en `stamp` (3,9:1) mais en `stamp-strong` (5,3:1) par défaut.
 */
export function Stamp({
  children,
  tone = "strong",
  double = false,
  tilt = -4,
  onImage = false,
  className,
}: StampProps) {
  return (
    <span
      className={cn(
        "inline-block border-[2.5px] border-current px-2.5 py-1 meta leading-none tracking-[0.12em]",
        tones[tone],
        double && "outline-1 outline-offset-2 outline-current",
        onImage && "bg-sheet",
        className,
      )}
      style={{ rotate: `${tilt}deg` }}
    >
      {children}
    </span>
  );
}
