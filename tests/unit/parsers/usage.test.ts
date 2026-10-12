import { describe, expect, test } from "vitest";
import { InputFormatError } from "@/lib/parsers/shared";
import { parseUsage } from "@/lib/parsers/usage";
import { captureError } from "../../helpers/capture-error";

function csv(...rows: string[]) {
  return ["food,quantity", ...rows].join("\n");
}

describe("parseUsage", () => {
  test.each([
    ['food,quantity\n"banana",25', "banana", 25],
    ['"quantity","food"\n"25"," Banana "', "banana", 25],
    ['food,quantity\n"fruit, mix",8', "fruit, mix", 8],
    ['food,quantity\n"keeper""s mix",8', 'keeper"s mix', 8],
    ['food,quantity\n"fruit\nmix",8', "fruit\nmix", 8],
    ['\uFEFFfood,quantity\r\n"banana","25"\r\n', "banana", 25],
  ])("parses valid CSV %j", (text, food, quantity) => {
    expect([...parseUsage(text)]).toEqual([[food, quantity]]);
  });

  test("keeps physical line numbers after multiline records and blank lines", () => {
    const error = captureError(() =>
      parseUsage('food,quantity\n"fruit\nmix",8\n\nbanana,lots'),
    );
    expect(error).toMatchObject({ source: "usage", location: "line 5" });
  });

  test("reports malformed CSV as a located input error", () => {
    const error = captureError(() => parseUsage('food,quantity\n"banana,8'));
    expect(error).toBeInstanceOf(InputFormatError);
    expect(error).toMatchObject({ source: "usage", location: "line 2" });
  });

  test("accepts an accumulated total at the safe integer boundary", () => {
    expect(
      parseUsage(csv(`banana,${Number.MAX_SAFE_INTEGER - 1}`, "banana,1")).get(
        "banana",
      ),
    ).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("rejects usage overflow at the row that crosses the boundary", () => {
    const error = captureError(() =>
      parseUsage(
        csv(`banana,${Number.MAX_SAFE_INTEGER}`, "banana,1", "banana,1"),
      ),
    );
    expect(error).toBeInstanceOf(InputFormatError);
    expect(error).toMatchObject({
      source: "usage",
      location: "line 3",
      message: "banana: Total quantity exceeds the safe integer range",
    });
  });

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
      ["empty", ",5"],
      ["blank", "   ,5"],
    ])("rejects a row whose food name is %s", (_, row) => {
      const error = captureError(() => parseUsage(csv("fish,2", row)));

      expect(error).toBeInstanceOf(InputFormatError);
      expect(error).toMatchObject({
        source: "usage",
        location: "line 3",
        message: "Missing food name",
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
