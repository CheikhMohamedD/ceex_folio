import { CircleAlert } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Common = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

type InputFieldProps = Common & { multiline?: false } & Omit<ComponentProps<"input">, "className">;
type TextareaFieldProps = Common & { multiline: true } & Omit<
    ComponentProps<"textarea">,
    "className"
  >;

const control =
  "w-full rounded-sheet border-[1.5px] border-ink bg-sheet px-3.5 text-base text-ink placeholder:text-ink-soft focus-visible:shadow-[0_0_0_3px_var(--paper),0_0_0_5px_var(--stamp)] focus-visible:outline-none aria-[invalid=true]:border-error";

/**
 * Champ : trait d'encre, anneau stamp au focus clavier. 16 px de texte au moins,
 * pour que le téléphone ne zoome pas. L'aide et l'erreur sont reliées au champ
 * par aria-describedby.
 */
export function Field(props: InputFieldProps | TextareaFieldProps) {
  const { label, hint, error, className, multiline, ...controlProps } = props;
  const id = useId();
  const hintId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  const a11y = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="font-display text-[0.9375rem] font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...(controlProps as ComponentProps<"textarea">)}
          {...a11y}
          className={cn(control, "min-h-32 resize-y py-3")}
        />
      ) : (
        <input
          {...(controlProps as ComponentProps<"input">)}
          {...a11y}
          className={cn(control, "min-h-12")}
        />
      )}
      {hint ? (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-error">
          <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
