import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FolderTabs } from "./folder-tabs";

const tabs = [
  { id: "all", label: "Tous", count: 6 },
  { id: "web", label: "Web", count: 3, category: "web" as const },
  { id: "mobile", label: "Mobile", count: 2, category: "mobile" as const },
];

const panels = {
  all: <p>Six dossiers</p>,
  web: <p>Trois dossiers web</p>,
  mobile: <p>Deux dossiers mobiles</p>,
};

describe("FolderTabs", () => {
  it("relie chaque onglet à son panneau", () => {
    render(<FolderTabs label="Filtrer les projets" tabs={tabs} panels={panels} />);
    expect(screen.getByRole("tablist", { name: "Filtrer les projets" })).toBeInTheDocument();
    const [all, web] = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    expect(all).toHaveAttribute("aria-selected", "true");
    expect(all).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", all?.id);
    expect(panel).toHaveTextContent("Six dossiers");
    // Un seul arrêt de tabulation dans la liste d'onglets.
    expect(all).toHaveAttribute("tabindex", "0");
    expect(web).toHaveAttribute("tabindex", "-1");
  });

  it("suit le motif tabs de l'APG au clavier", async () => {
    const user = userEvent.setup();
    render(<FolderTabs label="Filtrer les projets" tabs={tabs} panels={panels} />);
    const [all, web, mobile] = screen.getAllByRole("tab");

    await user.click(all!);
    await user.keyboard("{ArrowRight}");
    expect(web).toHaveFocus();
    expect(web).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Trois dossiers web");

    await user.keyboard("{End}");
    expect(mobile).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(all).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(mobile).toHaveFocus();
    await user.keyboard("{Home}");
    expect(all).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Six dossiers");
  });

  it("ouvre l'onglet demandé par défaut", () => {
    render(<FolderTabs label="Filtrer" tabs={tabs} panels={panels} defaultTab="mobile" />);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Mobile");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Deux dossiers mobiles");
  });
});
