import {
  InputFormatError,
  normalizeItemName,
  readQuantity,
  splitLines,
} from "./shared";

const FOOD_COLUMN = "food";
const QUANTITY_COLUMN = "quantity";

/** Zero-based positions of the required columns, read from the header row. */
interface ColumnPositions {
  foodIndex: number;
  quantityIndex: number;
}

/**
 * Reads the keeper usage log and totals the quantity used per food.
 * The file is trusted to be simple CSV: no quoted fields or embedded commas.
 */
export function parseUsage(csv: string): ReadonlyMap<string, number> {
  const [header = "", ...rows] = splitLines(csv);
  const { foodIndex, quantityIndex } = readHeader(header);
  const used = new Map<string, number>();

  rows.forEach((row, index) => {
    if (row.trim() === "") return;

    // Line 1 is the header, so the first row is line 2.
    const location = `line ${index + 2}`;
    const cells = row.split(",");
    const food = normalizeItemName(cells[foodIndex] ?? "");
    const quantity = readQuantity(cells[quantityIndex] ?? "");

    if (food === "") {
      throw new InputFormatError("usage", "Missing food name", { location });
    }
    if (!quantity.ok) {
      throw new InputFormatError("usage", quantity.message, { location });
    }
    used.set(food, (used.get(food) ?? 0) + quantity.value);
  });

  return used;
}

function readHeader(header: string): ColumnPositions {
  if (header.trim() === "") {
    throw new InputFormatError("usage", "Missing header row", {
      location: "line 1",
    });
  }

  const columns = header
    .split(",")
    .map((column) => column.trim().toLowerCase());

  return {
    foodIndex: findColumn(columns, FOOD_COLUMN),
    quantityIndex: findColumn(columns, QUANTITY_COLUMN),
  };
}

function findColumn(columns: string[], name: string): number {
  const index = columns.indexOf(name);
  if (index === -1) {
    throw new InputFormatError("usage", `Missing required column: ${name}`, {
      location: "line 1",
    });
  }
  return index;
}
