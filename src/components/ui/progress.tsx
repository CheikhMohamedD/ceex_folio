import { useId } from "react";
import { cn } from "@/lib/cn";

type ProgressProps = {
  /** Nombre de segments remplis. */
  current: number;
  total?: number;
  /** Texte visible et nom accessible, par exemple « Question 3 sur 9 ». */
  label: string;
  className?: string;
};

/** Progression : 9 segments par défaut, pour le parcours guidé. */
export function Progress({ current, total = 9, label, className }: ProgressProps) {
  const id = useId();
  const value = Math.min(Math.max(current, 0), total);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p id={id} className="meta text-ink-soft">
        {label}
      </p>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 rounded-[1px] border border-ink transition-colors duration-300",
              index < value && "bg-ink",
            )}
          />
        ))}
      </div>
    </div>
  );
}
