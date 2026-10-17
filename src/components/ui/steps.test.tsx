import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render";
import { Steps } from "./steps";

const steps = [
  { label: "Tu envoies", description: "ta demande" },
  { label: "Je réponds" },
  { label: "On en parle" },
];

describe("Steps", () => {
  it("marque l'étape en cours et annonce l'état de chaque étape", () => {
    renderWithIntl(<Steps label="Après ta demande" steps={steps} current={1} />);
    const items = within(screen.getByRole("list", { name: "Après ta demande" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(3);
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).toHaveTextContent("étape terminée");
    expect(items[1]).toHaveTextContent("étape en cours");
    expect(items[2]).toHaveTextContent("étape à venir");
  });

  it("numérote les étapes sur deux chiffres", () => {
    renderWithIntl(<Steps label="Plan" steps={steps} current={0} />);
    expect(screen.getByText("01 · Tu envoies")).toBeInTheDocument();
    expect(screen.getByText("03 · On en parle")).toBeInTheDocument();
  });

  it("n'écrit qu'une liste en mode responsive, en colonne puis en rangée", () => {
    renderWithIntl(<Steps label="Plan" steps={steps} current={0} orientation="responsive" />);
    const lists = screen.getAllByRole("list", { name: "Plan" });
    expect(lists).toHaveLength(1);
    expect(lists[0]).toHaveClass("flex-col", "sm:grid");
    expect(screen.getAllByText("01 · Tu envoies")).toHaveLength(1);
  });
});
