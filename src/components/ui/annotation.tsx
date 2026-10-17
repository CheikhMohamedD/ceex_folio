import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Arrow = "right" | "left" | "down" | "down-left" | "down-right";

type Shape = { width: number; height: number; line: string; head: string };

// Flèches dessinées à la main : un trait courbe et une pointe ouverte.
const shapes: Record<Arrow, Shape> = {
  right: { width: 44, height: 22, line: "M2 13 C 12 6, 26 16, 40 9", head: "M33 4 L40 9 L34 16" },
  left: { width: 44, height: 22, line: "M42 13 C 32 6, 18 16, 4 9", head: "M11 4 L4 9 L10 16" },
  down: { width: 24, height: 42, line: "M11 2 C 5 12, 16 24, 11 38", head: "M5 31 L11 38 L17 31" },
  "down-right": {
    width: 38,
    height: 36,
    line: "M3 4 C 14 6, 26 14, 31 29",
    head: "M24 27 L31 31 L33 23",
  },
  "down-left": {
    width: 38,
    height: 36,
    line: "M35 4 C 24 6, 12 14, 7 29",
    head: "M14 27 L7 31 L5 23",
  },
};

function DrawnArrow({ direction }: { direction: Arrow }) {
  const shape = shapes[direction];
  return (
    <svg
      aria-hidden
      width={shape.width}
      height={shape.height}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={shape.line} />
      <path d={shape.head} />
    </svg>
  );
}

type AnnotationProps = {
  children: ReactNode;
  arrow?: Arrow;
  /** Inclinaison en degrés. */
  tilt?: number;
  className?: string;
};

/**
 * Annotation : note manuscrite en Caveat 600, couleur stamp. Jamais sous 24 px,
 * pour que le rouge du tampon reste lisible (3,9:1, seuil du grand texte).
 * Deux annotations par écran au plus.
 */
export function Annotation({ children, arrow, tilt = -3, className }: AnnotationProps) {
  const before = arrow === "left";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-hand text-annotation font-semibold text-stamp",
        className,
      )}
      style={{ rotate: `${tilt}deg` }}
    >
      {arrow && before ? <DrawnArrow direction={arrow} /> : null}
      <span>{children}</span>
      {arrow && !before ? <DrawnArrow direction={arrow} /> : null}
    </span>
  );
}
