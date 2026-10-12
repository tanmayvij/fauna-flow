import { describe, expect, test } from "vitest";
import { reconcile } from "@/lib/reconcile";

type Quantities<T> = Record<string, T>;

function audit({
  delivered = {},
  used = {},
  inventory = {},
}: {
  delivered?: Quantities<number | null>;
  used?: Quantities<number>;
  inventory?: Quantities<number>;
}) {
  return reconcile({
    delivered: new Map(Object.entries(delivered)),
    used: new Map(Object.entries(used)),
    inventory: new Map(Object.entries(inventory)),
  });
}

function onlyLine(input: Parameters<typeof audit>[0]) {
  const { lines } = audit(input);
  expect(lines).toHaveLength(1);
  return lines[0];
}

describe("reconcile", () => {
  describe("expected stock is delivered minus used", () => {
    test("is OK when the count matches", () => {
      expect(
        onlyLine({
          delivered: { fish: 100 },
          used: { fish: 95 },
          inventory: { fish: 5 },
        }),
      ).toEqual({ item: "fish", status: "ok", expected: 5, actual: 5 });
    });

    test("flags a shortage with a negative difference", () => {
      expect(
        onlyLine({
          delivered: { banana: 50 },
          used: { banana: 25 },
          inventory: { banana: 18 },
        }),
      ).toEqual({
        item: "banana",
        status: "discrepancy",
        expected: 25,
        actual: 18,
        difference: -7,
      });
    });

    test("flags a surplus with a positive difference", () => {
      expect(
        onlyLine({
          delivered: { hay: 200 },
          used: { hay: 95 },
          inventory: { hay: 108 },
        }),
      ).toEqual({
        item: "hay",
        status: "discrepancy",
        expected: 105,
        actual: 108,
        difference: 3,
      });
    });

    test("treats an item with no usage entries as unused", () => {
      expect(
        onlyLine({ delivered: { meat: 75 }, inventory: { meat: 75 } }),
      ).toEqual({ item: "meat", status: "ok", expected: 75, actual: 75 });
    });

    test("is OK when nothing was delivered, used or left", () => {
      expect(
        onlyLine({ delivered: { lettuce: 0 }, inventory: { lettuce: 0 } }),
      ).toEqual({ item: "lettuce", status: "ok", expected: 0, actual: 0 });
    });

    test("reports usage above delivery as a discrepancy without clamping", () => {
      expect(
        onlyLine({
          delivered: { fish: 10 },
          used: { fish: 15 },
          inventory: { fish: 0 },
        }),
      ).toEqual({
        item: "fish",
        status: "discrepancy",
        expected: -5,
        actual: 0,
        difference: 5,
      });
    });
  });

  describe("missing data", () => {
    test("is unknown when the delivered quantity was unusable", () => {
      expect(
        onlyLine({ delivered: { lettuce: null }, inventory: { lettuce: 0 } }),
      ).toEqual({
        item: "lettuce",
        status: "unknown",
        reason: "invalid-delivery",
      });
    });

    test("is unknown when the item was never delivered", () => {
      expect(
        onlyLine({ used: { carrots: 5 }, inventory: { carrots: 3 } }),
      ).toEqual({
        item: "carrots",
        status: "unknown",
        reason: "missing-delivery",
      });
    });

    test("is unknown when the item has no inventory count", () => {
      expect(onlyLine({ delivered: { meat: 75 }, used: { meat: 38 } })).toEqual(
        {
          item: "meat",
          status: "unknown",
          reason: "missing-inventory",
        },
      );
    });

    test("reports the delivery problem first when several are present", () => {
      expect(onlyLine({ delivered: { meat: null } })).toMatchObject({
        reason: "invalid-delivery",
      });
      expect(onlyLine({ used: { meat: 3 } })).toMatchObject({
        reason: "missing-delivery",
      });
    });
  });

  describe("line order", () => {
    test("follows inventory order, then other items by first appearance", () => {
      const { lines } = audit({
        delivered: { fish: 1, ham: 1, banana: 1, kale: 1 },
        used: { oats: 1, kale: 1, banana: 1 },
        inventory: { banana: 0, fish: 1 },
      });

      expect(lines.map((line) => line.item)).toEqual([
        "banana",
        "fish",
        "ham",
        "kale",
        "oats",
      ]);
    });
  });

  describe("summary", () => {
    test("counts each status", () => {
      const { summary } = audit({
        delivered: { banana: 50, fish: 100, hay: 200, lettuce: null },
        used: { banana: 25, fish: 95, hay: 95 },
        inventory: { banana: 18, fish: 5, hay: 100, lettuce: 0 },
      });

      expect(summary).toEqual({ ok: 1, discrepancies: 2, unknown: 1 });
    });

    test("is empty when there is nothing to audit", () => {
      expect(audit({})).toEqual({
        lines: [],
        summary: { ok: 0, discrepancies: 0, unknown: 0 },
      });
    });
  });

  describe("side effects", () => {
    test("does not modify its inputs", () => {
      const input = {
        delivered: new Map<string, number | null>([["banana", 50]]),
        used: new Map([["banana", 25]]),
        inventory: new Map([["banana", 18]]),
      };

      reconcile(input);

      expect(input).toEqual({
        delivered: new Map([["banana", 50]]),
        used: new Map([["banana", 25]]),
        inventory: new Map([["banana", 18]]),
      });
    });

    test("returns a fresh result on every call", () => {
      const input = {
        delivered: new Map([["banana", 50]]),
        used: new Map([["banana", 25]]),
        inventory: new Map([["banana", 18]]),
      };

      const first = reconcile(input);
      const second = reconcile(input);

      expect(second).toEqual(first);
      expect(second).not.toBe(first);
      expect(second.lines).not.toBe(first.lines);
      expect(second.summary).not.toBe(first.summary);
    });
  });

  test("solves the sample from the brief", () => {
    const report = audit({
      delivered: {
        banana: 50,
        fish: 100,
        hay: 200,
        meat: 75,
        lettuce: null,
        carrots: 20,
      },
      used: { banana: 25, fish: 95, hay: 95, meat: 38, carrots: 13 },
      inventory: {
        banana: 18,
        fish: 5,
        hay: 105,
        meat: 37,
        carrots: 7,
        lettuce: 0,
      },
    });

    expect(report).toEqual({
      lines: [
        {
          item: "banana",
          status: "discrepancy",
          expected: 25,
          actual: 18,
          difference: -7,
        },
        { item: "fish", status: "ok", expected: 5, actual: 5 },
        { item: "hay", status: "ok", expected: 105, actual: 105 },
        { item: "meat", status: "ok", expected: 37, actual: 37 },
        { item: "carrots", status: "ok", expected: 7, actual: 7 },
        { item: "lettuce", status: "unknown", reason: "invalid-delivery" },
      ],
      summary: { ok: 4, discrepancies: 1, unknown: 1 },
    });
  });
});
