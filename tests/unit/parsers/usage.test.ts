import { describe, expect, test } from "vitest";
import { InputFormatError } from "@/lib/parsers/shared";
import { parseUsage } from "@/lib/parsers/usage";
import { captureError } from "../../helpers/capture-error";

function csv(...rows: string[]) {
  return ["food,quantity", ...rows].join("\n");
}

describe("parseUsage", () => {
  test("adds up every entry for the same food", () => {
    expect(parseUsage(csv("banana,8", "banana,12", "banana,5"))).toEqual(
      new Map([["banana", 25]]),
    );
  });

  test("totals interleaved foods, in the order they first appear", () => {
    const used = parseUsage(
      csv("hay,1", "banana,2", "hay,3", "fish,4", "banana,5"),
    );

    expect([...used]).toEqual([
      ["hay", 4],
      ["banana", 7],
      ["fish", 4],
    ]);
  });

  test("finds columns by header name, not position", () => {
    expect(parseUsage("quantity,food\n8,banana\n12,banana")).toEqual(
      new Map([["banana", 20]]),
    );
  });

  test("treats food names case-insensitively", () => {
    expect(parseUsage(csv("Banana,8", " banana ,2"))).toEqual(
      new Map([["banana", 10]]),
    );
  });

  test("returns nothing when only the header is present", () => {
    expect(parseUsage("food,quantity")).toEqual(new Map());
  });

  test("tolerates blank lines, a trailing newline and Windows line endings", () => {
    expect(parseUsage("food,quantity\r\nbanana,8\r\n\r\nfish,2\r\n")).toEqual(
      new Map([
        ["banana", 8],
        ["fish", 2],
      ]),
    );
  });

  describe("malformed input", () => {
    test.each([
      [
        "non-numeric",
        "banana,lots",
        "Quantity is not a non-negative whole number: lots",
      ],
      [
        "negative",
        "banana,-3",
        "Quantity is not a non-negative whole number: -3",
      ],
      [
        "decimal",
        "banana,1.5",
        "Quantity is not a non-negative whole number: 1.5",
      ],
      ["empty", "banana,", "Quantity is empty"],
    ])("rejects a %s quantity with its line number", (_, row, message) => {
      const error = captureError(() => parseUsage(csv("fish,2", row)));

      expect(error).toBeInstanceOf(InputFormatError);
      expect(error).toMatchObject({
        source: "usage",
        location: "line 3",
        message,
      });
    });

    test.each([
      [
        "food column",
        "item,quantity\nbanana,8",
        "Missing required column: food",
      ],
      [
        "quantity column",
        "food,amount\nbanana,8",
        "Missing required column: quantity",
      ],
      ["header", "", "Missing header row"],
    ])("rejects a file missing the %s", (_, text, message) => {
      const error = captureError(() => parseUsage(text));

      expect(error).toBeInstanceOf(InputFormatError);
      expect(error).toMatchObject({
        source: "usage",
        location: "line 1",
        message,
      });
    });
  });
});
