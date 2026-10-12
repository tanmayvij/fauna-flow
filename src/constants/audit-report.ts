import type { AuditLine, UnknownReason } from "@/types/audit";

export const STATUS_LABELS = Object.freeze({
  ok: "OK",
  discrepancy: "Discrepancy",
  unknown: "Unknown",
} as const satisfies Record<AuditLine["status"], string>);

/** Why an item couldn't be judged, shown under its Unknown status. */
export const UNKNOWN_REASON_LABELS = Object.freeze({
  "invalid-delivery": "Invalid delivery quantity",
  "missing-delivery": "No delivery record",
  "missing-inventory": "No inventory count",
  "unsafe-arithmetic": "Calculation exceeds the safe integer range",
} as const satisfies Record<UnknownReason, string>);
