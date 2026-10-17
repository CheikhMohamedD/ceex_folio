import { useId, type ComponentProps } from "react";

type SelectFieldProps = Omit<ComponentProps<"select">, "id" | "className"> & {
  label: string;
  options: ReadonlyArray<{ value: string | number; label: string }>;
};

/**
 * Liste déroulante au trait d'encre, comme Field. Le libellé est relié par htmlFor et
 * n'enveloppe pas la liste : sinon le texte des options entrerait dans son nom.
 */
export function SelectField({ label, options, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-[0.9375rem] font-semibold">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="min-h-12 w-full rounded-sheet border-[1.5px] border-ink bg-sheet px-3 text-base text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
