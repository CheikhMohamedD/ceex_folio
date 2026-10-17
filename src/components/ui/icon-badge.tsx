import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type IconBadgeProps = {
  icon: LucideIcon;
  /** ink : pastille encre · category : couleur de la catégorie courante · outline : contour */
  tone?: "ink" | "category" | "outline";
  /** Libellé pour les lecteurs d'écran ; sans libellé, la pastille est décorative. */
  label?: string;
  className?: string;
};

/** Pastille : icône Lucide de 22 px au trait de 1,5 px dans un rond de 40 px. */
export function IconBadge({ icon: Icon, tone = "ink", label, className }: IconBadgeProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-grid size-10 shrink-0 place-items-center rounded-full",
        tone === "ink" && "bg-ink text-on-fill",
        tone === "category" && "bg-(--cat) text-on-fill",
        tone === "outline" && "border-[1.5px] border-ink text-ink",
        className,
      )}
    >
      <Icon size={22} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
    </span>
  );
}
