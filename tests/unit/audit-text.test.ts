import { describe, expect, test } from "vitest";
import {
  describeDeliveryWarning,
  describeInputError,
  describeSummary,
  formatDifference,
} from "@/lib/audit-text";

describe("describeSummary", () => {
  test.each([
    [{ ok: 3, discrepancies: 0, unknown: 0 }, "No discrepancies found"],
    [{ ok: 3, discrepancies: 1, unknown: 0 }, "1 discrepancy found"],
    [{ ok: 3, discrepancies: 2, unknown: 0 }, "2 discrepancies found"],
    [
      { ok: 3, discrepancies: 0, unknown: 1 },
      "No discrepancies found, 1 item with missing data",
    ],
    [
      { ok: 3, discrepancies: 1, unknown: 2 },
      "1 discrepancy found, 2 items with missing data",
    ],
    [{ ok: 0, discrepancies: 0, unknown: 0 }, "No discrepancies found"],
  ])("describes %o as %j", (summary, expected) => {
    expect(describeSummary(summary)).toBe(expected);
  });
});

describe("formatDifference", () => {
  test.each([
    [-7, "-7"],
    [3, "+3"],
    [0, "0"],
  ])("formats %i as %j", (difference, expected) => {
    expect(formatDifference(difference)).toBe(expected);
  });
});

describe("describeInputError", () => {
  test("names the file and the location", () => {
    expect(
      describeInputError({
        source: "usage",
        location: "line 3",
        message: "Quantity is empty",
      }),
    ).toBe("Usage log, line 3: Quantity is empty");
  });

  test("names only the file for a whole-file problem", () => {
    expect(
      describeInputError({
        source: "inventory",
        message: "File is not valid JSON",
      }),
    ).toBe("Inventory: File is not valid JSON");
  });
});

describe("describeDeliveryWarning", () => {
  test("names the line and the item", () => {
    expect(
      describeDeliveryWarning({
        line: 5,
        item: "lettuce",
        message: "Quantity is empty",
      }),
    ).toBe("Deliveries, line 5 · lettuce: Quantity is empty");
  });
});
