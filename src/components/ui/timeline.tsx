import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type Entry = {
  /** Date ou repère affiché, en métadonnée. */
  date: string;
  /** Date machine (AAAA-MM-JJ) quand il s'agit d'une vraie date. */
  dateTime?: string;
  title: string;
  text?: string;
};

type TimelineProps = {
  label: string;
  entries: Entry[];
  category?: Category | "ink";
  className?: string;
};

/** Frise : points de 12 px reliés en tirets, date en métadonnée de couleur, texte court. */
export function Timeline({ label, entries, category, className }: TimelineProps) {
  const last = entries.length - 1;
  return (
    <ol aria-label={label} className={cn(categoryClass(category), "flex flex-col", className)}>
      {entries.map((entry, index) => (
        <li
          key={`${entry.date}-${entry.title}`}
          className={cn("relative pl-8", index < last && "pb-6")}
        >
          <span aria-hidden className="absolute top-1 left-0 size-3 rounded-full bg-(--cat)" />
          {index < last ? (
            <span
              aria-hidden
              className="absolute top-5 bottom-1 left-[5.25px] border-l-[1.5px] border-dashed border-ink-soft"
            />
          ) : null}
          <p className="meta text-(--cat)">
            {entry.dateTime ? <time dateTime={entry.dateTime}>{entry.date}</time> : entry.date}
          </p>
          <p className="mt-1 font-display text-lg leading-snug font-semibold">{entry.title}</p>
          {entry.text ? (
            <p className="mt-1 text-[0.9375rem] leading-normal text-ink-soft">{entry.text}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
