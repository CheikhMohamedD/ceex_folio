import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type ProjectCardProps = {
  /** « 01 », « 02 »… */
  number: string;
  category: Category;
  /** Nom de la catégorie, lu par les lecteurs d'écran à la place du point de couleur. */
  categoryLabel: string;
  /** Type de projet : « Plateforme web », « App mobile »… */
  type: string;
  /** Stack, affichée sur la fiche à la une. */
  stack?: string[];
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  /** Chiffre clé, en pastille kraft. */
  figure?: string;
  featured?: boolean;
  /** Tampon posé sur l'image (« À la une »). */
  badge?: ReactNode;
  /** Visuel ; à défaut, des hachures papier. */
  media?: ReactNode;
  className?: string;
};

/**
 * Fiche : carte projet avec sa référence mono (point de catégorie, numéro, type).
 * Toute la carte est cliquable par le lien du titre ; au survol et au focus,
 * elle se soulève avec l'ombre nette.
 */
export function ProjectCard({
  number,
  category,
  categoryLabel,
  type,
  stack = [],
  title,
  summary,
  href,
  ctaLabel,
  figure,
  featured = false,
  badge,
  media,
  className,
}: ProjectCardProps) {
  const reference = [`N° ${number}`, type, ...(featured ? stack : [])].join(" · ");

  return (
    <article
      className={cn(
        categoryClass(category),
        "group relative flex rounded-sheet border-[1.5px] border-ink transition-[translate,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-sheet has-[a:focus-visible]:-translate-y-0.5 has-[a:focus-visible]:shadow-sheet has-[a:focus-visible]:outline-[2.5px] has-[a:focus-visible]:outline-offset-[3px] has-[a:focus-visible]:outline-focus motion-reduce:transition-none",
        featured
          ? "flex-col gap-6 bg-sheet p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-7"
          : "gap-4 bg-paper p-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-sheet border-[1.5px] border-ink hatch",
          featured
            ? "aspect-[16/10] lg:aspect-auto lg:min-h-72"
            : "aspect-[4/3] w-24 self-start sm:w-36",
        )}
      >
        {media}
        {badge ? <div className="absolute top-3 left-3">{badge}</div> : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p className="flex items-start gap-2 meta text-ink-soft">
          <span aria-hidden className="mt-[0.3em] size-2 shrink-0 rounded-full bg-(--cat)" />
          <span>
            <span className="sr-only">{categoryLabel} · </span>
            {reference}
          </span>
        </p>
        <h3
          className={cn(
            "font-display font-semibold",
            featured ? "text-[clamp(1.75rem,1.5rem+1vw,2.125rem)] leading-tight" : "text-card",
          )}
        >
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <p
          className={cn(
            "text-ink-soft",
            featured ? "text-body" : "text-[0.9375rem] leading-normal",
          )}
        >
          {summary}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {figure ? (
            <span className="rounded-full border border-ink bg-kraft px-2.5 py-0.5 meta text-ink">
              {figure}
            </span>
          ) : null}
          <span
            aria-hidden
            className="font-display text-[0.9375rem] font-semibold text-stamp-strong"
          >
            {ctaLabel} →
          </span>
        </div>
      </div>
    </article>
  );
}
