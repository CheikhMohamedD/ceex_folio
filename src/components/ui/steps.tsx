import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type Step = { label: string; description?: string };
type State = "done" | "current" | "upcoming";
type Orientation = "horizontal" | "vertical" | "responsive";

type StepsProps = {
  /** Nom accessible de la liste. */
  label: string;
  steps: Step[];
  /** Index de l'étape en cours (0 = la première). */
  current: number;
  /** responsive : vertical sous le point de rupture, horizontal au-delà. */
  orientation?: Orientation;
  /** Point de rupture du mode responsive : 640 px (sm) ou 1 024 px (lg), pour 5 étapes. */
  breakpoint?: "sm" | "lg";
  category?: Category | "ink";
  className?: string;
};

/**
 * Une seule liste par orientation : en mode responsive, la CSS la fait passer de la
 * colonne à la rangée (trait du point suivant à droite au lieu de dessous). Le texte
 * n'est donc écrit qu'une fois dans la page.
 */
const LAYOUT = {
  vertical: {
    list: "flex flex-col",
    item: "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3.5 pb-5 last:pb-0",
    dot: "mt-0.5",
    line: "absolute top-6 bottom-1 left-[7.25px] border-l-[1.5px]",
    text: "gap-1",
  },
  horizontal: {
    list: "grid auto-cols-fr grid-flow-col",
    item: "relative grid gap-y-2 pr-4 last:pr-0",
    dot: "",
    line: "absolute top-[7.25px] right-3 left-7 border-t-[1.5px]",
    text: "gap-2",
  },
  sm: {
    list: "flex flex-col sm:grid sm:auto-cols-fr sm:grid-flow-col",
    item: "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3.5 pb-5 last:pb-0 sm:grid-cols-1 sm:gap-y-2 sm:pr-4 sm:pb-0 sm:last:pr-0",
    dot: "mt-0.5 sm:mt-0",
    line: "absolute top-6 bottom-1 left-[7.25px] border-l-[1.5px] sm:top-[7.25px] sm:right-3 sm:bottom-auto sm:left-7 sm:border-t-[1.5px] sm:border-l-0",
    text: "gap-1 sm:gap-2",
  },
  lg: {
    list: "flex flex-col lg:grid lg:auto-cols-fr lg:grid-flow-col",
    item: "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3.5 pb-5 last:pb-0 lg:grid-cols-1 lg:gap-y-2 lg:pr-4 lg:pb-0 lg:last:pr-0",
    dot: "mt-0.5 lg:mt-0",
    line: "absolute top-6 bottom-1 left-[7.25px] border-l-[1.5px] lg:top-[7.25px] lg:right-3 lg:bottom-auto lg:left-7 lg:border-t-[1.5px] lg:border-l-0",
    text: "gap-1 lg:gap-2",
  },
} as const;

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
  const t = useTranslations("ui.steps");
  const layout = LAYOUT[orientation === "responsive" ? breakpoint : orientation];
  const last = steps.length - 1;
  const number = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <div className={cn(categoryClass(category), className)}>
      <ol aria-label={label} className={layout.list}>
        {steps.map((step, index) => {
          const state = stateOf(index, current);
          return (
            <li
              key={step.label}
              aria-current={state === "current" ? "step" : undefined}
              className={layout.item}
            >
              <Dot state={state} className={layout.dot} />
              {index < last ? (
                <span
                  aria-hidden
                  className={cn(
                    layout.line,
                    index < current ? "border-solid border-(--cat)" : "border-dashed border-ink",
                  )}
                />
              ) : null}
              <span className={cn("flex flex-col", layout.text)}>
                <span className={cn("meta", state === "current" ? "text-(--cat)" : "text-ink")}>
                  {`${number(index)} · ${step.label}`}
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
    </div>
  );
}
