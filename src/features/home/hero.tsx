import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Stamp } from "@/components/ui/stamp";
import type { CaseStudy } from "@/content/projects/load";
import { cn } from "@/lib/cn";
import { categoryClass } from "@/lib/design/categories";
import { HeroScene } from "@/features/hero-scene/hero-scene";
import type { SheetSpec } from "@/features/hero-scene/scene";
import { localizedPath } from "@/i18n/paths";
import type { Locale } from "@/i18n/routing";

/** Vignettes du collage : position sur une grille de 6 × 3, motif, et projet étiqueté. */
const TILES = [
  { area: "col-[1/3] row-[1/3]", pattern: "hatch", label: "seetalma", corner: "top" },
  { area: "col-[3/4] row-[1/2]", pattern: "kraft" },
  { area: "col-[4/6] row-[1/2]", pattern: "hatch" },
  { area: "col-[6/7] row-[1/4]", pattern: "hatch-reverse", label: "safar-2026", corner: "bottom" },
  { area: "col-[3/5] row-[2/3]", pattern: "hatch-reverse" },
  { area: "col-[5/6] row-[2/4]", pattern: "kraft" },
  { area: "col-[1/2] row-[3/4]", pattern: "kraft" },
  { area: "col-[2/5] row-[3/4]", pattern: "hatch", label: "ttc-erp", corner: "bottom" },
] as const;

const LETTERS = ["g", "o", "t", "f"] as const;

/**
 * Hero : collage de vignettes derrière la fiche centrale. Le sigle GOTF se lit
 * lettre par lettre ; le titre principal porte le nom, le métier et la ville.
 */
export async function Hero({ projects }: { projects: CaseStudy[] }) {
  const t = await getTranslations("home.hero");
  const locale = (await getLocale()) as Locale;
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  // Les mêmes vignettes, pour la scène 3D du desktop (n° 2).
  const sheets: SheetSpec[] = TILES.map((tile) => {
    const project = "label" in tile ? bySlug.get(tile.label) : undefined;
    if (!project || !("corner" in tile)) return { pattern: tile.pattern };
    return {
      pattern: tile.pattern,
      label: `N° ${project.number} · ${project.meta.title}`,
      category: `--cat-${project.category}`,
      corner: tile.corner,
      href: localizedPath(`/projets/${project.slug}`, locale),
    };
  });

  return (
    <section
      aria-labelledby="accueil-titre"
      data-motion="hero"
      className="relative overflow-hidden border-b-[1.5px] border-ink"
    >
      {/* Décor : les projets sont listés, et liés, dans Pro life. */}
      <div
        aria-hidden
        data-motion="hero-collage"
        className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-2 p-2 sm:gap-3 sm:p-3"
      >
        {TILES.map((tile, index) => {
          const project = "label" in tile ? bySlug.get(tile.label) : undefined;
          return (
            <div
              key={index}
              data-tile=""
              className={cn(
                "relative rounded-sheet border-[1.5px] border-ink",
                tile.area,
                tile.pattern === "kraft" ? "bg-kraft grain" : tile.pattern,
              )}
            >
              {project ? (
                <span
                  className={cn(
                    categoryClass(project.category),
                    "absolute left-3 hidden items-center gap-2 border border-ink bg-sheet px-2 py-1 meta text-ink sm:inline-flex",
                    "corner" in tile && tile.corner === "top" ? "top-3" : "bottom-3",
                  )}
                >
                  <span className="size-2 rounded-full bg-(--cat)" />
                  {`N° ${project.number} · ${project.meta.title}`}
                </span>
              ) : null}
            </div>
          );
        })}
        <HeroScene sheets={sheets} />
      </div>

      <div
        data-motion="hero-sheet"
        className="relative mx-auto flex max-w-7xl justify-center px-4 py-10 sm:px-6 sm:py-16 lg:min-h-[42.5rem] lg:items-center lg:px-20"
      >
        <Sheet
          raised
          className="relative flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-10 lg:px-12"
        >
          {/* N° 3 et 4, en CSS : visibles dès le chargement (globals.css, « Moments »). */}
          <Stamp double tilt={-4} className="motion-stamp self-start">
            {t("stamp")}
          </Stamp>
          <p className="sr-only">{t("gotf")}</p>
          {/* La typographie des lettres est posée sur la grille ; meta la remplace sous
              chaque lettre. */}
          <div
            aria-hidden
            className="grid max-w-xl grid-cols-4 gap-2 font-display text-[clamp(3.5rem,2rem+6.5vw,8.75rem)] leading-[0.85] font-bold uppercase"
          >
            {LETTERS.map((letter, index) => (
              <div key={letter} className="flex flex-col items-center gap-2">
                <span>{letter}</span>
                <span
                  className="motion-type meta text-ink-soft"
                  style={
                    {
                      "--chars": t(`letters.${letter}`).length,
                      "--index": index,
                    } as CSSProperties
                  }
                >
                  {t(`letters.${letter}`)}
                </span>
              </div>
            ))}
          </div>
          <h1
            id="accueil-titre"
            className="font-display text-[clamp(1.75rem,1.5rem+1.1vw,2.25rem)] leading-[1.15] font-semibold"
          >
            {t("title")}
          </h1>
          <p className="max-w-[60ch] text-body text-ink-soft">{t("lead")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/#reach-out">
              {t("start")}
              <ArrowRight size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            </ButtonLink>
            <ButtonLink href="/#pro-life" variant="secondary">
              {t("projects")}
            </ButtonLink>
          </div>
        </Sheet>
      </div>
    </section>
  );
}
