import { expect, test } from "vitest";
import { runAudit } from "@/lib/run-audit";

test("quoted CSV cannot create a false shortage or a separate quoted item", () => {
  expect(
    runAudit({
      delivery: "banana=50",
      usage: '"food","quantity"\n"banana","25"',
      inventory: '[{"item":"banana","quantity":25}]',
    }),
  ).toEqual({
    ok: true,
    report: {
      lines: [{ item: "banana", status: "ok", expected: 25, actual: 25 }],
      summary: { ok: 1, discrepancies: 0, unknown: 0 },
    },
    warnings: [],
  });
});

test("the rounded false-OK regression returns an explicit input failure", () => {
  expect(
    runAudit({
      delivery: `banana=${Number.MAX_SAFE_INTEGER}\nbanana=1\nbanana=1`,
      usage: `food,quantity\nbanana,${Number.MAX_SAFE_INTEGER}\nbanana,1`,
      inventory: '[{"item":"banana","quantity":0}]',
    }),
  ).toEqual({
    ok: false,
    error: {
      source: "usage",
      location: "line 3",
      message: "banana: Total quantity exceeds the safe integer range",
    },
  });
});

test("delivery overflow produces UNKNOWN with a warning through the pipeline", () => {
  expect(
    runAudit({
      delivery: `banana=${Number.MAX_SAFE_INTEGER}\nbanana=1\nbanana=1`,
      usage: "food,quantity",
      inventory: '[{"item":"banana","quantity":0}]',
    }),
  ).toMatchObject({
    ok: true,
    report: {
      lines: [
        { item: "banana", status: "unknown", reason: "invalid-delivery" },
      ],
      summary: { ok: 0, discrepancies: 0, unknown: 1 },
    },
    warnings: [
      {
        line: 2,
        item: "banana",
        message: "Total quantity exceeds the safe integer range",
      },
    ],
  });
});
