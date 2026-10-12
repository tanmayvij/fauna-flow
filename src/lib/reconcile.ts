interface ReconcileInput {
  /** Total delivered per item; `null` when a delivery value was unusable. */
  delivered: ReadonlyMap<string, number | null>;
  used: ReadonlyMap<string, number>;
  inventory: ReadonlyMap<string, number>;
}

type UnknownReason =
  "invalid-delivery" | "missing-delivery" | "missing-inventory";

interface OkLine {
  item: string;
  status: "ok";
  expected: number;
  actual: number;
}

interface DiscrepancyLine {
  item: string;
  status: "discrepancy";
  expected: number;
  actual: number;
  /** Actual minus expected: negative is a shortage, positive a surplus. */
  difference: number;
}

interface UnknownLine {
  item: string;
  status: "unknown";
  reason: UnknownReason;
}

type AuditLine = OkLine | DiscrepancyLine | UnknownLine;

interface AuditSummary {
  ok: number;
  discrepancies: number;
  unknown: number;
}

interface AuditReport {
  lines: readonly AuditLine[];
  summary: AuditSummary;
}

/**
 * Compares what should be left (delivered − used) with what was counted.
 * Items without reliable data are reported as unknown.
 */
export function reconcile(input: ReconcileInput): AuditReport {
  const lines = itemsInReportOrder(input).map((item) =>
    reconcileItem(item, input),
  );

  return { lines, summary: summarize(lines) };
}

/** Inventory order first, then items seen only in deliveries or usage. */
function itemsInReportOrder({
  delivered,
  used,
  inventory,
}: ReconcileInput): string[] {
  return [
    ...new Set([...inventory.keys(), ...delivered.keys(), ...used.keys()]),
  ];
}

function reconcileItem(item: string, input: ReconcileInput): AuditLine {
  // Delivery problems are checked first, so they're the reason reported.
  const delivered = input.delivered.get(item);
  if (delivered === null) {
    return { item, status: "unknown", reason: "invalid-delivery" };
  }
  if (delivered === undefined) {
    return { item, status: "unknown", reason: "missing-delivery" };
  }

  const actual = input.inventory.get(item);
  if (actual === undefined) {
    return { item, status: "unknown", reason: "missing-inventory" };
  }

  const expected = delivered - (input.used.get(item) ?? 0);
  const difference = actual - expected;

  if (difference === 0) return { item, status: "ok", expected, actual };
  return { item, status: "discrepancy", expected, actual, difference };
}

function summarize(lines: readonly AuditLine[]): AuditSummary {
  const countOf = (status: AuditLine["status"]) =>
    lines.filter((line) => line.status === status).length;

  return {
    ok: countOf("ok"),
    discrepancies: countOf("discrepancy"),
    unknown: countOf("unknown"),
  };
}
