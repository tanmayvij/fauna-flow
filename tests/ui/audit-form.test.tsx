import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, assert, describe, expect, test, vi } from "vitest";
import { runAuditAction } from "@/app/actions";
import { AuditForm } from "@/views/audit-form";
import type { AuditActionState } from "@/types/audit";
import { unreadableFile } from "../helpers/unreadable-file";

vi.mock("@/app/actions", () => ({ runAuditAction: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.mocked(runAuditAction).mockReset();
  vi.restoreAllMocks();
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

describe("running the audit", () => {
  const SUCCESS: AuditActionState = {
    status: "success",
    report: {
      lines: [
        {
          item: "banana",
          status: "discrepancy",
          expected: 25,
          actual: 18,
          difference: -7,
        },
      ],
      summary: { ok: 0, discrepancies: 1, unknown: 0 },
    },
    warnings: [],
  };

  function uploadAll() {
    upload("Deliveries file", "delivery.txt");
    upload("Usage log file", "usage.csv");
    upload("Inventory file", "inventory.json");
  }

  /** Makes the action wait until the test resolves it with a result. */
  function holdAction() {
    let finish: (state: AuditActionState) => void = () => {};
    vi.mocked(runAuditAction).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    return (state: AuditActionState) => act(async () => finish(state));
  }

  test("sends the three selected files", async () => {
    vi.mocked(runAuditAction).mockResolvedValue(SUCCESS);
    render(<AuditForm />);
    uploadAll();

    fireEvent.click(runButton());

    await waitFor(() => expect(runAuditAction).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(runAuditAction).mock.lastCall?.[1];
    assert(formData);
    expect(
      ["delivery", "usage", "inventory"].map(
        (name) => (formData.get(name) as File).name,
      ),
    ).toEqual(["delivery.txt", "usage.csv", "inventory.json"]);
    expect(await (formData.get("usage") as File).text()).toBe("content");
  });

  test("asks for a file again if it can no longer be read", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<AuditForm />);
    upload("Deliveries file", "delivery.txt");
    upload("Inventory file", "inventory.json");
    fireEvent.change(screen.getByLabelText("Usage log file"), {
      target: { files: [unreadableFile("usage.csv")] },
    });

    fireEvent.click(runButton());

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Usage log: the file can no longer be read. It may have been changed, moved or deleted since it was selected. Please select it again.",
    );
    expect(runAuditAction).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("audit.file_unreadable", {
      source: "usage",
      error: expect.objectContaining({ name: "NotReadableError" }),
    });
    expect(screen.queryByText("usage.csv")).toBeNull();
    expect(screen.getByText("delivery.txt")).toBeTruthy();
    expect(runButton().disabled).toBe(true);
  });

  test("explains when the server can't be reached", async () => {
    const failure = new TypeError("Failed to fetch");
    vi.mocked(runAuditAction).mockRejectedValue(failure);
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<AuditForm />);
    uploadAll();

    fireEvent.click(runButton());

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Couldn't reach the server to run the audit. Check your connection and try again.",
    );
    expect(console.error).toHaveBeenCalledWith("audit.request_failed", failure);
    expect(runButton().disabled).toBe(false);
  });

  test("shows a spinner and blocks resubmitting while the audit runs", async () => {
    const finish = holdAction();
    render(<AuditForm />);
    uploadAll();

    fireEvent.click(runButton());

    const pendingButton = (await screen.findByRole("button", {
      name: "Running audit…",
    })) as HTMLButtonElement;
    expect(pendingButton.disabled).toBe(true);
    expect(screen.getByTestId("audit-results").getAttribute("aria-busy")).toBe(
      "true",
    );

    await finish(SUCCESS);

    expect(runButton().disabled).toBe(false);
    expect(screen.getByTestId("audit-results").getAttribute("aria-busy")).toBe(
      "false",
    );
  });

  test("renders the report once the audit finishes", async () => {
    const finish = holdAction();
    render(<AuditForm />);
    uploadAll();
    fireEvent.click(runButton());

    await finish(SUCCESS);

    expect(screen.getByRole("heading", { name: "Audit report" })).toBeTruthy();
    expect(screen.getByText("1 discrepancy found")).toBeTruthy();
  });

  describe("audited week", () => {
    test("shows the current week when no other week was chosen", async () => {
      setToday(new Date(2026, 9, 14, 9)); // Wednesday
      const finish = holdAction();
      render(<AuditForm />);
      uploadAll();
      fireEvent.click(runButton());

      await finish(SUCCESS);

      expect(screen.getByText("Week: Oct 11 – Oct 14")).toBeTruthy();
    });

    test("shows the week chosen when the audit was run", async () => {
      setToday(new Date(2026, 9, 14, 9));
      const finish = holdAction();
      render(<AuditForm />);
      uploadAll();
      fireEvent.change(weekSelect(), { target: { value: "2026-10-04" } });
      fireEvent.click(runButton());

      await finish(SUCCESS);

      expect(screen.getByText("Week: Oct 4 – Oct 10")).toBeTruthy();
    });

    test("keeps the audited week when the selection changes afterwards", async () => {
      setToday(new Date(2026, 9, 14, 9));
      const finish = holdAction();
      render(<AuditForm />);
      uploadAll();
      fireEvent.click(runButton());
      await finish(SUCCESS);

      fireEvent.change(weekSelect(), { target: { value: "2026-09-27" } });

      expect(screen.getByText("Week: Oct 11 – Oct 14")).toBeTruthy();
    });
  });

  test("keeps the previous report's week until a new run finishes", async () => {
    setToday(new Date(2026, 9, 14, 9));
    const finishFirst = holdAction();
    render(<AuditForm />);
    uploadAll();
    fireEvent.click(runButton());
    await finishFirst(SUCCESS);

    const finishSecond = holdAction();
    fireEvent.change(weekSelect(), { target: { value: "2026-10-04" } });
    fireEvent.click(runButton());
    await screen.findByRole("button", { name: "Running audit…" });

    expect(screen.getByText("Week: Oct 11 – Oct 14")).toBeTruthy();

    await finishSecond(SUCCESS);

    expect(screen.getByText("Week: Oct 4 – Oct 10")).toBeTruthy();
  });

  test("shows why the audit could not run", async () => {
    const finish = holdAction();
    render(<AuditForm />);
    uploadAll();
    fireEvent.click(runButton());

    await finish({
      status: "error",
      message: "Usage log, line 3: Quantity is empty",
    });

    expect(screen.getByRole("alert").textContent).toBe(
      "Usage log, line 3: Quantity is empty",
    );
    expect(screen.queryByRole("heading", { name: "Audit report" })).toBeNull();
  });
});
