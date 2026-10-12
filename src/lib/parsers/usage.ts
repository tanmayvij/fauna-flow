import { CsvError, parse } from "csv-parse/sync";
import {
  addQuantities,
  InputFormatError,
  normalizeItemName,
  readQuantity,
} from "./shared";

const FOOD_COLUMN = "food";
const QUANTITY_COLUMN = "quantity";

/** Zero-based positions of the required columns, read from the header row. */
interface ColumnPositions {
  foodIndex: number;
  quantityIndex: number;
}

interface UsageRecord {
  cells: string[];
  /** Physical line on which the CSV record ends (including multiline fields). */
  line: number;
}

/**
 * Reads the keeper usage log and totals the quantity used per food.
 * CSV syntax is decoded before applying the food and quantity rules.
 */
export function parseUsage(csv: string): ReadonlyMap<string, number> {
  const [header, ...rows] = readRecords(csv);
  const { foodIndex, quantityIndex } = readHeader(header?.cells ?? []);
  const used = new Map<string, number>();

  rows.forEach(({ cells, line }) => {
    const location = `line ${line}`;
    const food = normalizeItemName(cells[foodIndex] ?? "");
    const quantity = readQuantity(cells[quantityIndex] ?? "");

    if (food === "") {
      throw new InputFormatError("usage", "Missing food name", { location });
    }
    if (!quantity.ok) {
      throw new InputFormatError("usage", quantity.message, { location });
    }
    const total = addQuantities(used.get(food) ?? 0, quantity.value);
    if (!total.ok) {
      throw new InputFormatError("usage", `${food}: ${total.message}`, {
        location,
      });
    }
    used.set(food, total.value);
  });

  return used;
}

/** Keep the CSV library's syntax and location handling at the input boundary. */
function readRecords(csv: string): UsageRecord[] {
  const records: UsageRecord[] = [];
  try {
    parse(csv, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      on_record(cells: string[], info) {
        records.push({ cells, line: info.lines });
        return null;
      },
    });
  } catch (error) {
    if (!(error instanceof CsvError)) throw error;
    throw new InputFormatError("usage", `Invalid CSV: ${error.message}`, {
      location:
        typeof error.lines === "number" ? `line ${error.lines}` : undefined,
      cause: error,
    });
  }
  return records;
}

function readHeader(header: string[]): ColumnPositions {
  if (header.length === 0) {
    throw new InputFormatError("usage", "Missing header row", {
      location: "line 1",
    });
  }

  const columns = header.map((column) => column.trim().toLowerCase());

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
