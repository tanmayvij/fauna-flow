import type { AuditSourceId } from "@/constants/audit-sources";

/** Thrown when an input file can't be read, naming where the problem is. */
export class InputFormatError extends Error {
  /** Where in the file, e.g. `line 3` or `index 1`; absent for whole-file problems. */
  readonly location?: string;

  constructor(
    readonly source: AuditSourceId,
    message: string,
    { location, cause }: { location?: string; cause?: unknown } = {},
  ) {
    super(message, { cause });
    this.name = "InputFormatError";
    this.location = location;
  }
}

export type QuantityResult =
  { ok: true; value: number } | { ok: false; message: string };

const WHOLE_NUMBER = /^\d+$/;

const BYTE_ORDER_MARK = "\uFEFF";

/** Item names match across files regardless of case or surrounding spaces. */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

export function readQuantity(raw: string): QuantityResult {
  const value = raw.trim();

  if (value === "") return { ok: false, message: "Quantity is empty" };

  if (!WHOLE_NUMBER.test(value) || !Number.isSafeInteger(Number(value))) {
    return {
      ok: false,
      message: `Quantity is not a non-negative whole number: ${value}`,
    };
  }

  return { ok: true, value: Number(value) };
}

/** Splits text into lines, accepting Windows line endings and a leading BOM. */
export function splitLines(text: string): string[] {
  const content = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  return content.split(/\r?\n/);
}
