import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";

describe("Field", () => {
  it("relie l'aide et l'erreur au champ", () => {
    render(
      <Field
        multiline
        label="Message"
        hint="Quelques mots suffisent."
        error="Écris ton message."
        name="message"
      />,
    );
    const control = screen.getByLabelText("Message");
    expect(control.tagName).toBe("TEXTAREA");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription("Quelques mots suffisent. Écris ton message.");
  });

  it("reste neutre sans aide ni erreur", () => {
    render(<Field label="Email ou WhatsApp" name="contact" type="text" />);
    const control = screen.getByLabelText("Email ou WhatsApp");
    expect(control.tagName).toBe("INPUT");
    expect(control).not.toHaveAttribute("aria-invalid");
    expect(control).not.toHaveAttribute("aria-describedby");
  });
});
