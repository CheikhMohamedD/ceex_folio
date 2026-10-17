import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
  it("expose la progression aux lecteurs d'écran", () => {
    render(<Progress current={3} label="Question 3 sur 9" />);
    const bar = screen.getByRole("progressbar", { name: "Question 3 sur 9" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "9");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
  });

  it("borne la valeur entre 0 et le total", () => {
    render(<Progress current={12} total={9} label="Terminé" />);
    expect(screen.getByRole("progressbar", { name: "Terminé" })).toHaveAttribute(
      "aria-valuenow",
      "9",
    );
  });
});
