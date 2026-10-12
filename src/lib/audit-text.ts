import { AUDIT_SOURCES } from "@/constants/audit-sources";
import type { AuditSourceId, AuditSummary, InputProblem } from "@/types/audit";
import type { DeliveryWarning } from "@/types/parsers";

/** e.g. "1 discrepancy found, 2 items with missing data". */
export function describeSummary({
  discrepancies,
  unknown,
}: AuditSummary): string {
  const found =
    discrepancies === 0
      ? "No discrepancies found"
      : `${discrepancies} ${pluralize(discrepancies, "discrepancy", "discrepancies")} found`;

  if (unknown === 0) return found;
  return `${found}, ${unknown} ${pluralize(unknown, "item", "items")} with missing data`;
}

/** Signed, so a surplus reads as "+3" next to a shortage's "-7". */
export function formatDifference(difference: number): string {
  return difference > 0 ? `+${difference}` : String(difference);
}

/** e.g. "Usage log, line 3: Quantity is empty". */
export function describeInputError({
  source,
  location,
  message,
}: InputProblem): string {
  const where = location
    ? `${sourceTitle(source)}, ${location}`
    : sourceTitle(source);
  return `${where}: ${message}`;
}

/** e.g. "Deliveries, line 5 · lettuce: Quantity is empty". */
export function describeDeliveryWarning({
  line,
  item,
  message,
}: DeliveryWarning): string {
  return `${sourceTitle("delivery")}, line ${line} · ${item}: ${message}`;
}

function sourceTitle(id: AuditSourceId): string {
  return AUDIT_SOURCES.find((source) => source.id === id)?.title ?? id;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
