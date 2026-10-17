import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type Step = { label: string; description?: string };
type State = "done" | "current" | "upcoming";

type StepsProps = {
  /** Nom accessible de la liste. */
  label: string;
  steps: Step[];
  /** Index de l'étape en cours (0 = la première). */
  current: number;
  /** responsive : vertical sous le point de rupture, horizontal au-delà. */
  orientation?: "horizontal" | "vertical" | "responsive";
  /** Point de rupture du mode responsive : 640 px (sm) ou 1 024 px (lg), pour 5 étapes. */
  breakpoint?: "sm" | "lg";
  category?: Category | "ink";
  className?: string;
};

function stateOf(index: number, current: number): State {
  if (index < current) return "done";
  return index === current ? "current" : "upcoming";
}

function Dot({ state, className }: { state: State; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-4 shrink-0 rounded-full",
        state === "done" && "bg-(--cat)",
        state === "current" &&
          "bg-(--cat) shadow-[0_0_0_4px_var(--ring,var(--paper)),0_0_0_5.5px_var(--cat)]",
        state === "upcoming" && "border-[1.5px] border-ink bg-sheet",
        className,
      )}
    />
  );
}

/**
 * Étapes : des points reliés. Plein pour ce qui est fait, anneau pour l'étape en
 * cours, tirets vers ce qui reste à venir. L'étape en cours porte aria-current.
 */
export function Steps({
  label,
  steps,
  current,
  orientation = "horizontal",
  breakpoint = "sm",
  category,
  className,
}: StepsProps) {
  const responsive = orientation === "responsive";
  const t = useTranslations("ui.steps");
  const last = steps.length - 1;
  const number = (index: number) => String(index + 1).padStart(2, "0");

  const horizontal = (
    <ol
      aria-label={label}
      className={cn(
        "grid auto-cols-fr grid-flow-col",
        responsive && (breakpoint === "lg" ? "hidden lg:grid" : "hidden sm:grid"),
      )}
    >
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex flex-col gap-2 pr-4 last:pr-0"
          >
            <span aria-hidden className="flex h-4 items-center">
              <Dot state={state} />
              {index < last ? (
                <span
                  className={cn(
                    "-mr-1 ml-3 h-0 flex-1 border-t-[1.5px]",
                    index < current ? "border-solid border-(--cat)" : "border-dashed border-ink",
                  )}
                />
              ) : null}
            </span>
            <span className={cn("meta", state === "current" ? "text-(--cat)" : "text-ink")}>
              {number(index)} · {step.label}
            </span>
            {step.description ? (
              <span className="text-sm leading-snug text-ink-soft">{step.description}</span>
            ) : null}
            <span className="sr-only">{t(state)}</span>
          </li>
        );
      })}
    </ol>
  );

  const vertical = (
    <ol
      aria-label={label}
      className={cn(
        "flex flex-col",
        responsive && (breakpoint === "lg" ? "lg:hidden" : "sm:hidden"),
      )}
    >
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        return (
          <li
            key={step.label}
            aria-current={state === "current" ? "step" : undefined}
            className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3.5 pb-5 last:pb-0"
          >
            <Dot state={state} className="mt-0.5" />
            {index < last ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-6 bottom-1 left-[7.25px] border-l-[1.5px]",
                  index < current ? "border-solid border-(--cat)" : "border-dashed border-ink",
                )}
              />
            ) : null}
            <span className="flex flex-col gap-1">
              <span className={cn("meta", state === "current" ? "text-(--cat)" : "text-ink")}>
                {number(index)} · {step.label}
              </span>
              {step.description ? (
                <span className="text-sm leading-snug text-ink-soft">{step.description}</span>
              ) : null}
              <span className="sr-only">{t(state)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className={cn(categoryClass(category), className)}>
      {orientation === "vertical" ? vertical : null}
      {orientation === "horizontal" ? horizontal : null}
      {responsive ? (
        <>
          {vertical}
          {horizontal}
        </>
      ) : null}
    </div>
  );
}
