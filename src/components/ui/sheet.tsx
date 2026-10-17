import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type SheetProps = ComponentProps<"div"> & {
  /** Feuille surélevée : ajoute l'ombre nette de 6 px. */
  raised?: boolean;
  as?: "div" | "section" | "article" | "aside";
};

/** Feuille : papier blanc au trait d'encre, surélevé par l'ombre nette si besoin. */
export function Sheet({ as: Tag = "div", raised = false, className, ...props }: SheetProps) {
  return (
    <Tag
      className={cn(
        "rounded-sheet border-[1.5px] border-ink bg-sheet",
        raised && "shadow-sheet",
        className,
      )}
      {...props}
    />
  );
}
