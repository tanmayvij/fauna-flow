import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { AuditResults } from "@/components/audit/audit-results";
import type { AuditReport } from "@/types/audit";
import type { DeliveryWarning } from "@/types/parsers";

afterEach(cleanup);

const REPORT: AuditReport = {
  lines: [
    {
      item: "banana",
      status: "discrepancy",
      expected: 25,
      actual: 18,
      difference: -7,
    },
    { item: "fish", status: "ok", expected: 5, actual: 5 },
    { item: "lettuce", status: "unknown", reason: "invalid-delivery" },
  ],
  summary: { ok: 1, discrepancies: 1, unknown: 1 },
};

const WEEK = "Oct 4 – Oct 10";

const WARNINGS: DeliveryWarning[] = [
  { line: 5, item: "lettuce", message: "Quantity is empty" },
];

function bodyRows() {
  return screen.getAllByRole("row").slice(1);
}

function rowFor(item: string) {
  const row = bodyRows().find(
    (candidate) =>
      within(candidate).queryByRole("rowheader")?.textContent === item,
  );
  if (!row) throw new Error(`No row for ${item}`);
  return row;
}

function cellTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
}

test("titles the report and summarises it", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={WARNINGS} />);

  expect(screen.getByRole("heading", { name: "Audit report" })).toBeTruthy();
  expect(
    screen.getByText("1 discrepancy found, 1 item with missing data"),
  ).toBeTruthy();
});

test("shows the week that was audited", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(screen.getByText("Week: Oct 4 – Oct 10")).toBeTruthy();
});

test("lists one row per item, in report order", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(
    bodyRows().map((row) => within(row).getByRole("rowheader").textContent),
  ).toEqual(["banana", "fish", "lettuce"]);
});

test("labels the columns", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(
    screen.getAllByRole("columnheader").map((header) => header.textContent),
  ).toEqual(["Item", "Status", "Expected", "Counted", "Difference"]);
});

test("shows a discrepancy with its signed difference", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(cellTexts(rowFor("banana"))).toEqual([
    "Discrepancy",
    "25",
    "18",
    "-7",
  ]);
});

test("shows a matching item as OK", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(cellTexts(rowFor("fish"))).toEqual(["OK", "5", "5", "0"]);
});

test("shows an unknown item with its reason and no numbers", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(cellTexts(rowFor("lettuce"))).toEqual([
    "UnknownInvalid delivery quantity",
    "—",
    "—",
    "—",
  ]);
  expect(
    within(rowFor("lettuce")).getByText("Invalid delivery quantity"),
  ).toBeTruthy();
});

test("explains an unsafe calculation without displaying rounded numbers", () => {
  const report: AuditReport = {
    lines: [{ item: "banana", status: "unknown", reason: "unsafe-arithmetic" }],
    summary: { ok: 0, discrepancies: 0, unknown: 1 },
  };
  render(<AuditResults weekRange={WEEK} report={report} warnings={[]} />);

  expect(cellTexts(rowFor("banana"))).toEqual([
    "UnknownCalculation exceeds the safe integer range",
    "—",
    "—",
    "—",
  ]);
});

test("lists delivery file warnings when there are any", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={WARNINGS} />);

  const list = screen.getByRole("list", { name: "Delivery file warnings" });
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual(["Deliveries, line 5 · lettuce: Quantity is empty"]);
});

test("leaves out the delivery file warnings when there are none", () => {
  render(<AuditResults weekRange={WEEK} report={REPORT} warnings={[]} />);

  expect(
    screen.queryByRole("list", { name: "Delivery file warnings" }),
  ).toBeNull();
});

test("says so when there is nothing to audit", () => {
  render(
    <AuditResults
      weekRange={WEEK}
      report={{ lines: [], summary: { ok: 0, discrepancies: 0, unknown: 0 } }}
      warnings={[]}
    />,
  );

  expect(screen.getByText("No items to audit.")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});
