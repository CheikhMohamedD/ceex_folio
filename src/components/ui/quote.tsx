import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type QuoteProps = {
  /** Le texte cité, sans guillemets : le composant ajoute les guillemets français. */
  children: string;
  source?: string;
  category?: Category | "ink";
  className?: string;
};

/**
 * Citation : un grand guillemet décoratif dans la couleur de la catégorie, masqué
 * aux lecteurs d'écran ; le texte garde ses guillemets français « ».
 */
export function Quote({ children, source, category, className }: QuoteProps) {
  return (
    <figure
      className={cn(
        categoryClass(category),
        "flex flex-col gap-1 rounded-sheet bg-(--cat-wash) px-6 pt-4 pb-5",
        className,
      )}
    >
      <span
        aria-hidden
        className="block h-[0.42em] font-display text-quote-mark font-bold text-(--cat)"
      >
        “
      </span>
      <blockquote className="font-quote text-quote font-medium">
        <p>{`« ${children} »`}</p>
      </blockquote>
      {source ? <figcaption className="mt-2 meta text-ink-soft">— {source}</figcaption> : null}
    </figure>
  );
}
