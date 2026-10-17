import { cn } from "@/lib/cn";

/**
 * Échantillon de couleur à valeur fixe : il montre la teinte claire ou sombre
 * telle quelle, quel que soit le thème affiché.
 */
export function Swatch({ hex, className }: { hex: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-sm normal-case", className)}>
      <span
        aria-hidden
        className="inline-block size-5 shrink-0 rounded-[1px] border border-ink"
        style={{ backgroundColor: hex }}
      />
      {hex.toUpperCase()}
    </span>
  );
}
