import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AuditForm } from "@/components/audit/audit-form";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setToday(date: Date) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(date);
}

function upload(label: string, fileName: string) {
  const file = new File(["content"], fileName);
  fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
}

function weekSelect() {
  return screen.getByLabelText("Week") as HTMLSelectElement;
}

function weekOptionLabels() {
  return Array.from(weekSelect().options, (option) => option.textContent);
}

function runButton() {
  return screen.getByRole("button", { name: "Run audit" }) as HTMLButtonElement;
}

test("enables the audit only once all three files are selected", () => {
  render(<AuditForm />);
  expect(runButton().disabled).toBe(true);

  upload("Deliveries file", "delivery.txt");
  upload("Usage log file", "usage.csv");
  expect(runButton().disabled).toBe(true);

  upload("Inventory file", "inventory.json");
  expect(runButton().disabled).toBe(false);
  expect(screen.getByText("delivery.txt")).toBeTruthy();
});

test("rejects a file with the wrong format", () => {
  render(<AuditForm />);

  upload("Usage log file", "usage.json");

  expect(screen.getByRole("alert").textContent).toBe(
    "Only .csv files are accepted.",
  );
  expect(screen.queryByText("usage.json")).toBeNull();
});

test("removing a file returns the slot to its empty state", () => {
  render(<AuditForm />);
  upload("Inventory file", "inventory.json");

  fireEvent.click(screen.getByRole("button", { name: "Remove" }));

  expect(screen.queryByText("inventory.json")).toBeNull();
  expect(screen.getByLabelText("Inventory file")).toBeTruthy();
});

describe("week selection", () => {
  test("offers the current week up to today and the two before it", () => {
    setToday(new Date(2026, 9, 14, 9)); // Wednesday
    render(<AuditForm />);

    expect(weekOptionLabels()).toEqual([
      "This week · Oct 11 – Oct 14",
      "Last week · Oct 4 – Oct 10",
      "2 weeks ago · Sep 27 – Oct 3",
    ]);
  });

  test("shows only today as the current week on a Sunday", () => {
    setToday(new Date(2026, 9, 11, 9));
    render(<AuditForm />);

    expect(weekOptionLabels()[0]).toBe("This week · Oct 11");
  });

  test("defaults to the current week and accepts another choice", () => {
    setToday(new Date(2026, 9, 14, 9));
    render(<AuditForm />);
    expect(weekSelect().value).toBe("2026-10-11");

    fireEvent.change(weekSelect(), { target: { value: "2026-09-27" } });

    expect(weekSelect().value).toBe("2026-09-27");
  });
});
