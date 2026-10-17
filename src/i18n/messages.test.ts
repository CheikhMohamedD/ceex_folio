// @vitest-environment node
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import fr from "./messages/fr.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : flatten(value, path);
  });
}

/** Une valeur d'exemple par argument ICU : un nombre pour {x, number}, un texte sinon. */
function sampleValues(message: string): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  for (const [, name, type] of message.matchAll(/\{\s*(\w+)\s*(?:,\s*(\w+))?/g)) {
    if (name) values[name] = type === "number" || type === "plural" ? 1 : "exemple";
  }
  return values;
}

function invalidMessages(locale: "fr" | "en", messages: Tree): string[] {
  const errors: string[] = [];
  const t = createTranslator({
    locale,
    messages,
    onError: (error) => errors.push(error.message),
  });
  for (const [key, value] of flatten(messages)) {
    if (value.trim() === "") errors.push(`${key} est vide`);
    t(key as never, sampleValues(value) as never);
  }
  return errors;
}

/** Le colophon (et le plan des phases qu'il montre) n'existe qu'en français. */
const FRENCH_ONLY = ["colophon.", "phases."];

describe("messages français", () => {
  const entries = flatten(fr as Tree);

  it("sont tous des messages ICU valides et non vides", () => {
    expect(invalidMessages("fr", fr as Tree)).toEqual([]);
  });

  it("gardent les espaces insécables de la typographie française", () => {
    const offenders = entries.filter(([, value]) => / [:;?!»]|« /.test(value)).map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});

describe("messages anglais", () => {
  const frKeys = new Set(flatten(fr as Tree).map(([key]) => key));
  const enKeys = new Set(flatten(en as Tree).map(([key]) => key));

  it("sont tous des messages ICU valides et non vides", () => {
    expect(invalidMessages("en", en as Tree)).toEqual([]);
  });

  it("traduisent chaque clé du site, colophon excepté", () => {
    const missing = [...frKeys].filter(
      (key) => !enKeys.has(key) && !FRENCH_ONLY.some((prefix) => key.startsWith(prefix)),
    );
    expect(missing).toEqual([]);
  });

  it("n'ont aucune clé que le français n'a pas", () => {
    expect([...enKeys].filter((key) => !frKeys.has(key))).toEqual([]);
  });
});
