import { Link } from "@/i18n/link";
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
        "fiche",
        featured
          ? "flex-col gap-6 bg-sheet p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-7"
          : "gap-4 bg-paper p-4",
        className,
      )}
    >
      <div
        className={cn(
          "fiche-media",
          featured
            ? "aspect-[16/10] lg:aspect-auto lg:min-h-72"
            : "aspect-[4/3] w-24 self-start sm:w-36",
        )}
      >
        {media}
        {badge ? <div className="absolute top-3 left-3">{badge}</div> : null}
      </div>

      <div className="fiche-body">
        <p className="fiche-ref">
          <span aria-hidden className="cat-dot" />
          <span>
            <span className="sr-only">{`${categoryLabel} · `}</span>
            {reference}
          </span>
        </p>
        <h3
          className={cn(
            "font-display font-semibold",
            featured ? "text-[clamp(1.75rem,1.5rem+1vw,2.125rem)] leading-tight" : "text-card",
          )}
        >
          <Link href={href} className="stretched-link">
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
        <div className="fiche-foot">
          {figure ? <span className="pill">{figure}</span> : null}
          <span aria-hidden className="fiche-cta">
            {`${ctaLabel} →`}
          </span>
        </div>
      </div>
    </article>
  );
}
