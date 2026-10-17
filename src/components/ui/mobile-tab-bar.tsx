import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type MobileTabItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  current?: boolean;
};

type MobileTabBarProps = {
  label: string;
  items: MobileTabItem[];
  /** fixed : en bas d'écran sous 640 px · inline : aperçu dans une page */
  variant?: "fixed" | "inline";
  className?: string;
};

/**
 * Barre d'onglets mobile : 4 entrées au pouce, cibles de 56 px de haut.
 * Un trait rouge marque la section en cours, comme sous la barre du haut.
 */
export function MobileTabBar({ label, items, variant = "fixed", className }: MobileTabBarProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "border-t-[1.5px] border-ink bg-sheet grain",
        variant === "fixed" &&
          "fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] sm:hidden",
        className,
      )}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.current ? "location" : undefined}
              className="relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 pt-1 text-ink focus-visible:outline-offset-[-4px]"
            >
              {item.current ? (
                <span aria-hidden className="absolute inset-x-5 top-0 h-[3px] bg-stamp" />
              ) : null}
              <item.icon size={22} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
              <span className="font-mono text-xs font-medium tracking-[0.06em] uppercase">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
