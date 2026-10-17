import { render, screen, within } from "@testing-library/react";
import { Smartphone } from "lucide-react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

const columns = [
  { key: "width", header: "Largeur" },
  { key: "columns", header: "Colonnes", emphasis: true },
  { key: "gutter", header: "Gouttière" },
];

const rows = [
  { id: "phone", icon: Smartphone, cells: { width: "Dès 360 px", columns: "4", gutter: "16 px" } },
  { id: "tablet", cells: { width: "Dès 640 px", columns: "8", gutter: "24 px" } },
];

describe("DataTable", () => {
  it("donne un vrai tableau, avec légende et en-têtes de ligne", () => {
    render(<DataTable caption="Points de rupture" columns={columns} rows={rows} />);
    const table = screen.getByRole("table", { name: "Points de rupture" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getByRole("rowheader", { name: "Dès 360 px" })).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it("ne duplique aucun contenu et garde l'intitulé de chaque valeur pour les cartes mobiles", () => {
    render(<DataTable caption="Points de rupture" columns={columns} rows={rows} />);
    expect(screen.getAllByText("Dès 360 px")).toHaveLength(1);
    const cells = within(screen.getByRole("table")).getAllByRole("cell");
    expect(cells).toHaveLength(4);
    // L'intitulé visible sur mobile est masqué aux lecteurs d'écran, qui lisent l'en-tête.
    const label = cells[0]?.querySelector("[aria-hidden='true']");
    expect(label).toHaveTextContent("Colonnes");
    expect(label).toHaveClass("dt-label");
    expect(cells[1]).toHaveTextContent("Gouttière16 px");
  });

  it("ne rend rien sans colonne", () => {
    const { container } = render(<DataTable caption="Vide" columns={[]} rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
