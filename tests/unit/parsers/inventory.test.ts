import { describe, expect, test } from "vitest";
import { InputFormatError } from "@/lib/parsers/shared";
import { parseInventory } from "@/lib/parsers/inventory";
import { captureError } from "../../helpers/capture-error";

describe("parseInventory", () => {
  test("keeps items in the order they appear", () => {
    const json = JSON.stringify([
      { item: "meat", quantity: 37 },
      { item: "banana", quantity: 18 },
      { item: "lettuce", quantity: 0 },
    ]);

    expect([...parseInventory(json)]).toEqual([
      ["meat", 37],
      ["banana", 18],
      ["lettuce", 0],
    ]);
  });

  test("returns nothing for an empty list", () => {
    expect(parseInventory("[]")).toEqual(new Map());
  });

  test("treats item names case-insensitively", () => {
    const json = JSON.stringify([{ item: " Banana ", quantity: 18 }]);

    expect(parseInventory(json)).toEqual(new Map([["banana", 18]]));
  });

  test("adds up repeated counts of the same item", () => {
    const json = JSON.stringify([
      { item: "banana", quantity: 10 },
      { item: "banana", quantity: 8 },
    ]);

    expect(parseInventory(json)).toEqual(new Map([["banana", 18]]));
  });

  describe("malformed input", () => {
    test.each([
      ["invalid JSON", "[{ item: banana }"],
      ["a non-array root", '{ "banana": 18 }'],
    ])("rejects %s", (_, json) => {
      const error = captureError(() => parseInventory(json));

      expect(error).toBeInstanceOf(InputFormatError);
      expect(error).toMatchObject({ source: "inventory" });
    });

    test.each([
      ["a missing item", { quantity: 18 }],
      ["an empty item", { item: " ", quantity: 18 }],
      ["a missing quantity", { item: "banana" }],
      ["a string quantity", { item: "banana", quantity: "18" }],
      ["a negative quantity", { item: "banana", quantity: -1 }],
      ["a decimal quantity", { item: "banana", quantity: 1.5 }],
      ["a non-object entry", "banana"],
    ])("rejects an entry with %s, naming its index", (_, entry) => {
      // A valid entry first, so the error must name the bad entry's real index.
      const json = JSON.stringify([{ item: "fish", quantity: 5 }, entry]);
      const error = captureError(() => parseInventory(json));

      expect(error).toBeInstanceOf(InputFormatError);
      expect(error).toMatchObject({ source: "inventory", location: "index 1" });
    });
  });
});
