import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { categoryClass, type Category } from "@/lib/design/categories";

type OpenFolderProps = {
  /** Nom porté par la languette : la catégorie, ou le nom de la rubrique. */
  label: string;
  icon?: LucideIcon;
  /** Couleur de la languette et du cadre ; encre par défaut. */
  category?: Category | "ink";
  children: ReactNode;
  as?: "div" | "section" | "article";
  "aria-labelledby"?: string;
  className?: string;
};

/**
 * Dossier ouvert : une feuille à languette. L'onglet garde le rayon de 8 px des
 * onglets de dossier ; le cadre prend la couleur de la catégorie.
 */
export function OpenFolder({
  label,
  icon: Icon,
  category = "ink",
  children,
  as: Tag = "div",
  className,
  ...aria
}: OpenFolderProps) {
  return (
    <Tag
      className={cn(
        categoryClass(category),
        "relative mt-[2.625rem] rounded-sheet border-[1.5px] border-(--cat) bg-sheet p-4 sm:p-8 lg:p-10",
        className,
      )}
      {...aria}
    >
      <div className="absolute -top-[2.625rem] -left-[1.5px] flex h-[2.625rem] max-w-[calc(100%+3px)] items-center gap-3 rounded-t-tab bg-(--cat) grain px-5 text-on-fill">
        {Icon ? (
          <>
            <Icon
              size={20}
              strokeWidth={1.5}
              absoluteStrokeWidth
              aria-hidden
              className="shrink-0"
            />
            <span aria-hidden className="h-5 w-[1.5px] shrink-0 bg-current opacity-50" />
          </>
        ) : null}
        <span className="truncate meta">{label}</span>
      </div>
      {children}
    </Tag>
  );
}
