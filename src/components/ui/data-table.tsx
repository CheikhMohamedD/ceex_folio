import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn = {
  key: string;
  header: string;
  /** Valeur mise en avant (Space Grotesk 600). */
  emphasis?: boolean;
};

export type DataTableRow = {
  id: string;
  icon?: LucideIcon;
  cells: Record<string, ReactNode>;
};

type DataTableProps = {
  caption: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  className?: string;
};

/**
 * Tableau : en-têtes mono, filets fins, icône en première colonne. Sous 768 px, chaque
 * ligne devient une carte empilée : jamais de tableau qui déborde, et aucun contenu en
 * double, c'est le même tableau qui change de mise en page.
 *
 * Les rôles ARIA explicites gardent la sémantique de tableau que certains navigateurs
 * retirent quand l'affichage CSS change. Dans la carte, chaque valeur porte l'intitulé
 * de sa colonne, masqué aux lecteurs d'écran : ils annoncent déjà l'en-tête.
 */
export function DataTable({ caption, columns, rows, className }: DataTableProps) {
  const [first, ...others] = columns;
  if (!first) return null;

  return (
    <table role="table" className={cn("dt", className)}>
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup" className="dt-head">
        <tr role="row">
          {columns.map((column) => (
            <th key={column.key} role="columnheader" scope="col" className="dt-column">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup" className="dt-body">
        {rows.map((row) => (
          <tr key={row.id} role="row" className="dt-row">
            <th role="rowheader" scope="row" className="dt-rowheader">
              <span className="flex items-center gap-2.5">
                {row.icon ? (
                  <row.icon
                    size={20}
                    strokeWidth={1.5}
                    absoluteStrokeWidth
                    aria-hidden
                    className="shrink-0"
                  />
                ) : null}
                {row.cells[first.key]}
              </span>
            </th>
            {others.map((column) => (
              <td
                key={column.key}
                role="cell"
                className={column.emphasis ? "dt-cell dt-cell-strong" : "dt-cell"}
              >
                <span aria-hidden className="dt-label">
                  {column.header}
                </span>
                {row.cells[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
