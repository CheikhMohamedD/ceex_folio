// @vitest-environment node
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "./messages/fr.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Array<[string, string]> {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : flatten(value, path);
  });
}

const entries = flatten(messages as Tree);

/** Une valeur d'exemple par argument ICU : un nombre pour {x, number}, un texte sinon. */
function sampleValues(message: string): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  for (const [, name, type] of message.matchAll(/\{\s*(\w+)\s*(?:,\s*(\w+))?/g)) {
    if (name) values[name] = type === "number" || type === "plural" ? 1 : "exemple";
  }
  return values;
}

describe("messages français", () => {
  it("sont tous des messages ICU valides et non vides", () => {
    const errors: string[] = [];
    const t = createTranslator({
      locale: "fr",
      messages,
      onError: (error) => errors.push(error.message),
    });
    for (const [key, value] of entries) {
      expect(value.trim(), key).not.toBe("");
      t(key as never, sampleValues(value) as never);
    }
    expect(errors).toEqual([]);
  });

  it("gardent les espaces insécables de la typographie française", () => {
    const offenders = entries.filter(([, value]) => / [:;?!»]|« /.test(value)).map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});
