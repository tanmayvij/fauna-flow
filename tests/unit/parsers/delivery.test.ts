import { describe, expect, test } from "vitest";
import { parseDelivery } from "@/lib/parsers/delivery";

function deliveredFrom(text: string) {
  return parseDelivery(text).delivered;
}

describe("parseDelivery", () => {
  test("accepts an accumulated total at the safe integer boundary", () => {
    expect(
      deliveredFrom("banana=9007199254740990\nbanana=1").get("banana"),
    ).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("marks an overflowing total unknown and never restores a partial total", () => {
    expect(
      parseDelivery(
        `banana=${Number.MAX_SAFE_INTEGER}\nbanana=1\nbanana=1\nfish=5`,
      ),
    ).toEqual({
      delivered: new Map([
        ["banana", null],
        ["fish", 5],
      ]),
      warnings: [
        {
          line: 2,
          item: "banana",
          message: "Total quantity exceeds the safe integer range",
        },
      ],
    });
  });

  describe("valid values", () => {
    test.each([
      ["banana=50", 50],
      ["banana=0", 0],
      ['carrots="20"', 20],
      ["carrots='20'", 20],
      ["  banana  =  50  ", 50],
      ["banana=\t50\t", 50],
    ])("reads %j as %i", (line, expected) => {
      const { delivered, warnings } = parseDelivery(line);

      expect([...delivered.values()]).toEqual([expected]);
      expect(warnings).toEqual([]);
    });
  });

  describe("invalid values", () => {
    test.each([
      ["empty", "lettuce=", "Quantity is empty"],
      ["empty double quotes", 'lettuce=""', "Quantity is empty"],
      ["empty single quotes", "lettuce=''", "Quantity is empty"],
      ["whitespace only", "lettuce=   ", "Quantity is empty"],
      [
        "non-numeric",
        "lettuce=abc",
        "Quantity is not a non-negative whole number: abc",
      ],
      [
        "negative",
        "lettuce=-5",
        "Quantity is not a non-negative whole number: -5",
      ],
      [
        "decimal",
        "lettuce=2.5",
        "Quantity is not a non-negative whole number: 2.5",
      ],
      [
        "unit suffix",
        "lettuce=50kg",
        "Quantity is not a non-negative whole number: 50kg",
      ],
      [
        "quoted non-numeric",
        'lettuce="abc"',
        "Quantity is not a non-negative whole number: abc",
      ],
      ["unbalanced quote", 'lettuce="20', 'Quantity has unmatched quotes: "20'],
      [
        "mismatched quotes",
        "lettuce=\"20'",
        "Quantity has unmatched quotes: \"20'",
      ],
    ])("marks a %s value as unusable and warns", (_, line, message) => {
      const { delivered, warnings } = parseDelivery(line);

      expect(delivered).toEqual(new Map([["lettuce", null]]));
      expect(warnings).toEqual([{ line: 1, item: "lettuce", message }]);
    });

    test("reports the line number of each invalid value", () => {
      const { warnings } = parseDelivery(
        ["banana=50", "", "lettuce=", "fish=lots"].join("\n"),
      );

      expect(warnings).toEqual([
        { line: 3, item: "lettuce", message: "Quantity is empty" },
        {
          line: 4,
          item: "fish",
          message: "Quantity is not a non-negative whole number: lots",
        },
      ]);
    });
  });

  describe("file structure", () => {
    test("skips blank lines and comments", () => {
      const text = [
        "# delivery for week 41",
        "",
        "banana=50",
        "   ",
        "! legacy comment style",
        "fish=100",
      ].join("\n");

      expect(deliveredFrom(text)).toEqual(
        new Map([
          ["banana", 50],
          ["fish", 100],
        ]),
      );
    });

    test("handles Windows line endings", () => {
      expect(deliveredFrom("banana=50\r\nfish=100\r\n")).toEqual(
        new Map([
          ["banana", 50],
          ["fish", 100],
        ]),
      );
    });

    test("ignores a leading byte order mark", () => {
      expect(deliveredFrom("\uFEFFbanana=50")).toEqual(
        new Map([["banana", 50]]),
      );
    });

    test("returns nothing for an empty file", () => {
      expect(parseDelivery("")).toEqual({ delivered: new Map(), warnings: [] });
    });

    test("keeps items in the order they first appear", () => {
      const delivered = deliveredFrom("meat=1\nbanana=2\nhay=3\nbanana=4");

      expect([...delivered.keys()]).toEqual(["meat", "banana", "hay"]);
    });
  });

  describe("item names", () => {
    test("treats names case-insensitively", () => {
      expect(deliveredFrom("Banana=5\nBANANA=5\nbanana=5")).toEqual(
        new Map([["banana", 15]]),
      );
    });
  });

  describe("repeated items", () => {
    test("adds up every delivery of the same item", () => {
      expect(deliveredFrom("banana=50\nbanana=10")).toEqual(
        new Map([["banana", 60]]),
      );
    });

    test("marks the item unusable if any of its deliveries is invalid", () => {
      const { delivered, warnings } = parseDelivery(
        "banana=50\nbanana=\nbanana=10",
      );

      expect(delivered).toEqual(new Map([["banana", null]]));
      expect(warnings).toEqual([
        { line: 2, item: "banana", message: "Quantity is empty" },
      ]);
    });

    test("warns about every invalid delivery of the same item", () => {
      const { warnings } = parseDelivery("banana=\nbanana=abc");

      expect(warnings).toEqual([
        { line: 1, item: "banana", message: "Quantity is empty" },
        {
          line: 2,
          item: "banana",
          message: "Quantity is not a non-negative whole number: abc",
        },
      ]);
    });
  });

  test("reads the sample delivery from the brief", () => {
    const text = [
      "banana=50",
      "fish=100",
      "hay=200",
      "meat=75",
      "lettuce=",
      'carrots="20"',
    ].join("\n");

    const { delivered, warnings } = parseDelivery(text);

    expect([...delivered]).toEqual([
      ["banana", 50],
      ["fish", 100],
      ["hay", 200],
      ["meat", 75],
      ["lettuce", null],
      ["carrots", 20],
    ]);
    expect(warnings).toEqual([
      { line: 5, item: "lettuce", message: "Quantity is empty" },
    ]);
  });
});
