import { InputFormatError, normalizeItemName } from "./shared";

interface InventoryEntry {
  item: string;
  quantity: number;
}

/** Reads the end-of-week stock count: a JSON array of `{ item, quantity }`. */
export function parseInventory(json: string): ReadonlyMap<string, number> {
  const entries = readEntries(json);
  const inventory = new Map<string, number>();

  entries.forEach((entry, index) => {
    const { item, quantity } = readEntry(entry, `index ${index}`);
    inventory.set(item, (inventory.get(item) ?? 0) + quantity);
  });

  return inventory;
}

function readEntries(json: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new InputFormatError("inventory", "File is not valid JSON", {
      cause: error,
    });
  }

  if (!Array.isArray(data)) {
    throw new InputFormatError("inventory", "Expected a list of items");
  }
  return data;
}

function readEntry(entry: unknown, location: string): InventoryEntry {
  if (!isRecord(entry)) {
    throw new InputFormatError("inventory", "Entry is not an object", {
      location,
    });
  }

  const { item, quantity } = entry;

  if (typeof item !== "string" || item.trim() === "") {
    throw new InputFormatError("inventory", "Entry has no item name", {
      location,
    });
  }
  if (quantity === undefined) {
    throw new InputFormatError("inventory", "Entry has no quantity", {
      location,
    });
  }
  if (
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  ) {
    throw new InputFormatError(
      "inventory",
      `Quantity is not a non-negative whole number: ${JSON.stringify(quantity)}`,
      { location },
    );
  }

  return { item: normalizeItemName(item), quantity };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
