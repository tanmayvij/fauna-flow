import type { DeliveryWarning, QuantityResult } from "@/types/parsers";
import { normalizeItemName, readQuantity, splitLines } from "./shared";

interface ParsedDelivery {
  delivered: ReadonlyMap<string, number | null>; // Total delivered per item, or `null` when any of its values was unusable.
  warnings: readonly DeliveryWarning[];
}

const COMMENT_PREFIXES = ["#", "!"];
const QUOTES = ['"', "'"];

/**
 * Reads the properties-format delivery file. Values may be dirty, so a bad
 * value never throws: it marks the item unusable and is reported as a warning.
 */
export function parseDelivery(text: string): ParsedDelivery {
  const delivered = new Map<string, number | null>();
  const warnings: DeliveryWarning[] = [];

  splitLines(text).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === "" || isComment(line)) return;

    // A line without `=` is a key with an empty value.
    const [key, value = ""] = splitAtFirst(line, "=");
    const item = normalizeItemName(key);
    const quantity = readDeliveryValue(value);

    if (!quantity.ok) {
      warnings.push({ line: index + 1, item, message: quantity.message });
    }
    delivered.set(
      item,
      addDelivery(delivered.get(item), quantity.ok ? quantity.value : null),
    );
  });

  return { delivered, warnings };
}

function isComment(line: string): boolean {
  return COMMENT_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function splitAtFirst(line: string, separator: string): [string, string?] {
  const index = line.indexOf(separator);
  if (index === -1) return [line];
  return [line.slice(0, index), line.slice(index + 1)];
}

function readDeliveryValue(raw: string): QuantityResult {
  const value = raw.trim();
  const opening = value[0];

  if (!QUOTES.includes(opening)) return readQuantity(value);

  if (value.length < 2 || value.at(-1) !== opening) {
    return { ok: false, message: `Quantity has unmatched quotes: ${value}` };
  }
  return readQuantity(value.slice(1, -1));
}

/** Repeated deliveries add up, but one unusable value spoils the total. */
function addDelivery(
  total: number | null | undefined,
  quantity: number | null,
): number | null {
  if (total === null || quantity === null) return null;
  return (total ?? 0) + quantity;
}
