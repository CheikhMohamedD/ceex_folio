import { useId, type ChangeEvent } from "react";
import { CircleAlert } from "lucide-react";

type ChoiceListProps<Value extends string> = {
  name: string;
  options: readonly Value[];
  labels: Record<Value, string>;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

/**
 * Choix unique en grandes cases (48 px au moins) : la question est la légende du
 * fieldset qui l'entoure. L'erreur est reliée à chaque bouton radio (aria-invalid ne
 * vaut pas pour un radio : data-invalid sert seulement à y mettre le focus).
 */
export function ChoiceList<Value extends string>({
  name,
  options,
  labels,
  value,
  onChange,
  error,
}: ChoiceListProps<Value>) {
  const errorId = `${useId()}-erreur`;
  return (
    <div className="flex flex-col gap-2.5">
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-sheet border-[1.5px] border-ink bg-sheet px-4 py-2.5 has-checked:bg-kraft has-focus-visible:shadow-[0_0_0_3px_var(--paper),0_0_0_5px_var(--stamp)]">
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                onChange={onChange}
                aria-describedby={error ? errorId : undefined}
                data-invalid={error ? true : undefined}
                className="size-5 shrink-0 accent-(--stamp-strong) focus-visible:outline-none"
              />
              <span className="text-body">{labels[option]}</span>
            </label>
          </li>
        ))}
      </ul>
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-error">
          <CircleAlert size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
