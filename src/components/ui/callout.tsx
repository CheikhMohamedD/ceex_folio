import { ArrowRight, NotebookPen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type CalloutItem = { icon: LucideIcon; text: ReactNode };

type CalloutProps = {
  /** Étiquette de la languette, par exemple « Pourquoi ça compte ». */
  label: string;
  /** outline : contour · wash : lavis de catégorie · solid : plein, une fois par page au plus */
  variant?: "outline" | "wash" | "solid";
  category?: Category | "ink";
  items?: CalloutItem[];
  children?: ReactNode;
  className?: string;
};

/** Encadré : une boîte à languette d'étiquette, avec une liste à icônes ou du texte. */
export function Callout({
  label,
  variant = "outline",
  category,
  items,
  children,
  className,
}: CalloutProps) {
  const id = useId();
  return (
    <aside
      aria-labelledby={id}
      className={cn(
        categoryClass(category),
        "relative mt-7 rounded-sheet border-[1.5px] px-5 pt-4 pb-3",
        variant === "outline" && "border-ink bg-sheet text-ink",
        variant === "wash" && "border-(--cat) bg-(--cat-wash) text-ink",
        variant === "solid" && "border-(--cat) bg-(--cat) text-on-fill",
        className,
      )}
    >
      <p
        id={id}
        className={cn(
          "absolute -top-7 -left-[1.5px] flex h-7 items-center rounded-t-[6px] px-3 meta text-on-fill",
          variant === "wash" ? "bg-(--cat)" : "bg-ink",
        )}
      >
        {label}
      </p>
      {items ? (
        <ul className="flex flex-col">
          {items.map((item, index) => (
            <li
              key={index}
              className={cn(
                "grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 py-2.5 text-[0.9375rem] leading-normal",
                index > 0 && "border-t border-dotted",
                variant === "solid" ? "border-on-fill/50" : "border-ink-soft",
              )}
            >
              <item.icon
                size={20}
                strokeWidth={1.5}
                absoluteStrokeWidth
                aria-hidden
                className="mt-0.5"
              />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-1 text-[0.9375rem] leading-normal">{children}</div>
      )}
    </aside>
  );
}

type NoteProps = {
  label: string;
  children: ReactNode;
  href?: string;
  linkLabel?: string;
  icon?: LucideIcon;
  className?: string;
};

/** Note de terrain : version courte de l'encadré, qui renvoie vers une page. */
export function Note({
  label,
  children,
  href,
  linkLabel,
  icon: Icon = NotebookPen,
  className,
}: NoteProps) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "flex flex-col gap-2.5 rounded-sheet border-[1.5px] border-ink bg-sheet px-5 py-4",
        className,
      )}
    >
      <p className="flex items-center gap-2.5 meta text-stamp-strong">
        <Icon size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        {label}
      </p>
      <div className="text-[1.0625rem] leading-snug font-medium">{children}</div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-1.5 self-start ink-link text-[0.9375rem]"
        >
          {linkLabel}
          <ArrowRight size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        </Link>
      ) : null}
    </aside>
  );
}
