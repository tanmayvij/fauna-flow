import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { runAuditAction } from "@/app/actions";
import { parseUsage } from "@/lib/parsers/usage";
import {
  SAMPLE_DELIVERY,
  SAMPLE_INVENTORY,
  SAMPLE_USAGE,
} from "../sample-data/sample-files";

// The real parser, wrapped so a test can see whether parsing ran or make it fail.
vi.mock("@/lib/parsers/usage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/parsers/usage")>();
  return { parseUsage: vi.fn(actual.parseUsage) };
});

const IDLE = { status: "idle" } as const;

const SAMPLE_FILES = {
  delivery: new File([SAMPLE_DELIVERY], "delivery.txt"),
  usage: new File([SAMPLE_USAGE], "usage.csv"),
  inventory: new File([SAMPLE_INVENTORY], "inventory.json"),
};

function formWith(files: Partial<Record<string, File>>) {
  const formData = new FormData();
  for (const [name, file] of Object.entries(files)) {
    if (file) formData.set(name, file);
  }
  return formData;
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(parseUsage).mockClear();
});

describe("runAuditAction", () => {
  test("returns the report and warnings for valid files", async () => {
    const state = await runAuditAction(IDLE, formWith(SAMPLE_FILES));

    expect(state).toMatchObject({
      status: "success",
      report: { summary: { ok: 4, discrepancies: 1, unknown: 1 } },
      warnings: [{ line: 5, item: "lettuce", message: "Quantity is empty" }],
    });
    expect(console.info).toHaveBeenCalledWith("audit.completed", {
      summary: { ok: 4, discrepancies: 1, unknown: 1 },
      warningCount: 1,
    });
  });

  describe("rejects an unusable upload", () => {
    test.each([
      [
        "a missing file",
        { ...SAMPLE_FILES, usage: undefined },
        "Usage log: file is missing",
      ],
      [
        "an empty file",
        { ...SAMPLE_FILES, inventory: new File([], "inventory.json") },
        "Inventory: file is empty",
      ],
      [
        "a file with the wrong extension",
        { ...SAMPLE_FILES, delivery: new File(["banana=1"], "delivery.csv") },
        "Deliveries: only .txt files are accepted",
      ],
    ])("such as %s", async (_, files, message) => {
      const state = await runAuditAction(IDLE, formWith(files));

      expect(state).toEqual({ status: "error", message });
      expect(console.warn).toHaveBeenCalledWith("audit.rejected", { message });
      expect(parseUsage).not.toHaveBeenCalled();
    });

    test("such as a text field in place of a file", async () => {
      const formData = formWith(SAMPLE_FILES);
      formData.set("usage", "food,quantity");

      expect(await runAuditAction(IDLE, formData)).toEqual({
        status: "error",
        message: "Usage log: file is missing",
      });
    });
  });

  test("explains a malformed file, naming the file and line", async () => {
    const files = {
      ...SAMPLE_FILES,
      usage: new File(["food,quantity\nbanana,lots"], "usage.csv"),
    };

    const state = await runAuditAction(IDLE, formWith(files));

    expect(state).toEqual({
      status: "error",
      message:
        "Usage log, line 2: Quantity is not a non-negative whole number: lots",
    });
    expect(console.warn).toHaveBeenCalledWith("audit.rejected", {
      source: "usage",
      location: "line 2",
      message: "Quantity is not a non-negative whole number: lots",
    });
  });

  test("treats a bug as unexpected, not as bad input: logs it and hides it", async () => {
    const bug = new TypeError("unexpected");
    vi.mocked(parseUsage).mockImplementationOnce(() => {
      throw bug;
    });

    const state = await runAuditAction(IDLE, formWith(SAMPLE_FILES));

    expect(state).toEqual({
      status: "error",
      message:
        "Something went wrong while running the audit. Please try again.",
    });
    expect(console.error).toHaveBeenCalledWith("audit.failed", bug);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
