import { describe, expect, it } from "vitest";
import { formValues, GUIDED_FIELDS, type DirectField, type GuidedField } from "./fields";
import { directRequestSchema, fieldErrors, guidedRequestSchema } from "./schema";

const direct = {
  name: "Awa Ndiaye",
  email: "awa@example.sn",
  whatsapp: "",
  message: "Bonjour, je voudrais un site pour ma boutique.",
};

const guided = {
  projectType: "site",
  goal: "Une boutique en ligne pour vendre nos tissus et livrer à Dakar.",
  problem: "",
  audience: "Nos clientes, surtout sur téléphone.",
  context: "",
  constraints: "",
  budgetRange: "500k-2m",
  deadline: "quarter",
  successCriterion: "",
  name: "Awa Ndiaye",
  email: "",
  whatsapp: "+221 77 123 45 67",
};

function errorsOf<Field extends string>(
  result: { success: true } | { success: false; error: Parameters<typeof fieldErrors>[0] },
) {
  return result.success ? {} : fieldErrors<Field>(result.error);
}

describe("contact direct", () => {
  it("accepte une demande complète et vide les champs facultatifs", () => {
    const result = directRequestSchema.safeParse(direct);
    expect(result.success).toBe(true);
    expect(result.data?.whatsapp).toBeUndefined();
    expect(result.data?.email).toBe("awa@example.sn");
  });

  it("exige un nom, un message de 10 caractères et un moyen de répondre", () => {
    const result = directRequestSchema.safeParse({
      name: " ",
      email: "",
      whatsapp: "",
      message: "Salut",
    });
    expect(errorsOf<DirectField>(result)).toEqual({
      name: "required",
      message: "tooShort",
      email: "contactRequired",
    });
  });

  it("refuse un email ou un numéro mal formés", () => {
    const result = directRequestSchema.safeParse({ ...direct, email: "awa@", whatsapp: "77 12" });
    expect(errorsOf<DirectField>(result)).toEqual({ email: "email", whatsapp: "whatsapp" });
  });

  it("borne chaque champ à la longueur de sa colonne", () => {
    const result = directRequestSchema.safeParse({ ...direct, message: "a".repeat(2001) });
    expect(errorsOf<DirectField>(result)).toEqual({ message: "tooLong" });
  });

  it("accepte un numéro WhatsApp seul", () => {
    expect(
      directRequestSchema.safeParse({ ...direct, email: "", whatsapp: "+221 78 169 58 96" })
        .success,
    ).toBe(true);
  });
});

describe("parcours guidé", () => {
  it("accepte les réponses des neuf étapes", () => {
    const result = guidedRequestSchema.safeParse(guided);
    expect(result.success).toBe(true);
    expect(result.data?.problem).toBeUndefined();
  });

  it("refuse un choix hors liste et signale les réponses obligatoires", () => {
    const result = guidedRequestSchema.safeParse({
      ...guided,
      projectType: "",
      budgetRange: "beaucoup",
      goal: "",
    });
    expect(errorsOf<GuidedField>(result)).toEqual({
      projectType: "choice",
      budgetRange: "choice",
      goal: "required",
    });
  });
});

describe("formValues", () => {
  it("rend une chaîne pour chaque champ, vide quand il manque", () => {
    const data = new FormData();
    data.set("name", "Awa");
    const values = formValues(data, GUIDED_FIELDS);
    expect(values.name).toBe("Awa");
    expect(values.goal).toBe("");
    expect(Object.keys(values)).toHaveLength(GUIDED_FIELDS.length);
  });
});
