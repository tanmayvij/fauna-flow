import type { AuditLine, UnknownReason } from "@/types/audit";

export const STATUS_LABELS: Record<AuditLine["status"], string> = {
  ok: "OK",
  discrepancy: "Discrepancy",
  unknown: "Unknown",
};

/** Why an item couldn't be judged, shown under its Unknown status. */
export const UNKNOWN_REASON_LABELS: Record<UnknownReason, string> = {
  "invalid-delivery": "Invalid delivery quantity",
  "missing-delivery": "No delivery record",
  "missing-inventory": "No inventory count",
  "unsafe-arithmetic": "Calculation exceeds the safe integer range",
};
