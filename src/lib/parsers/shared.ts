import type { AuditSourceId } from "@/types/audit";
import type { QuantityResult } from "@/types/parsers";

interface InputFormatErrorOptions {
  /** Where in the file, e.g. `line 3` or `index 1`; absent for whole-file problems. */
  location?: string;
  cause?: unknown;
}

/** Thrown when an input file can't be read, naming where the problem is. */
export class InputFormatError extends Error {
  readonly location?: string;

  constructor(
    readonly source: AuditSourceId,
    message: string,
    { location, cause }: InputFormatErrorOptions = {},
  ) {
    super(message, { cause });
    this.name = "InputFormatError";
    this.location = location;
  }
}

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

/** Adds validated quantities without allowing an inexact total to escape. */
export function addQuantities(total: number, quantity: number): QuantityResult {
  const value = total + quantity;
  if (!Number.isSafeInteger(value)) {
    return {
      ok: false,
      message: "Total quantity exceeds the safe integer range",
    };
  }
  return { ok: true, value };
}

/** Splits text into lines, accepting Windows line endings and a leading BOM. */
export function splitLines(text: string): string[] {
  const content = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  return content.split(/\r?\n/);
}
