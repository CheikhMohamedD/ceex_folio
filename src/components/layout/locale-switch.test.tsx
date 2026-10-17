import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { basePath, LocaleSwitch } from "./locale-switch";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("basePath", () => {
  it.each([
    ["/", "/"],
    ["/en", "/"],
    ["/fr", "/"],
    ["/projets/seetalma", "/projets/seetalma"],
    ["/fr/projets/seetalma", "/projets/seetalma"],
    ["/en/projets/seetalma", "/projets/seetalma"],
    ["/en/colophon", "/"],
    ["/fr/blog/un-article", "/blog"],
  ])("%s donne %s", (input, expected) => {
    expect(basePath(input)).toBe(expected);
  });
});

describe("LocaleSwitch", () => {
  it("pointe vers la même page en anglais, y compris au rendu serveur (chemin réécrit)", () => {
    pathname.current = "/fr/projets/seetalma";
    render(<LocaleSwitch target="en" short="EN" label="EN, lire ce site en anglais" />);
    expect(screen.getByRole("link", { name: /^EN/ })).toHaveAttribute(
      "href",
      "/en/projets/seetalma",
    );
  });

  it("revient au français sans préfixe", () => {
    pathname.current = "/en/services";
    render(<LocaleSwitch target="fr" short="FR" label="FR, lire ce site en français" />);
    expect(screen.getByRole("link", { name: /^FR/ })).toHaveAttribute("href", "/services");
  });
});
