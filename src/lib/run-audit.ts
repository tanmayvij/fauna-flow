import { parseDelivery } from "@/lib/parsers/delivery";
import { parseInventory } from "@/lib/parsers/inventory";
import { InputFormatError } from "@/lib/parsers/shared";
import { parseUsage } from "@/lib/parsers/usage";
import { reconcile } from "@/lib/reconcile";
import type { AuditFiles, AuditReport, InputProblem } from "@/types/audit";
import type { DeliveryWarning } from "@/types/parsers";

interface AuditSuccess {
  ok: true;
  report: AuditReport;
  warnings: readonly DeliveryWarning[];
}

interface AuditFailure {
  ok: false;
  error: InputProblem;
}

type AuditOutcome = AuditSuccess | AuditFailure;

/**
 * Parses the three files and reconciles them. Malformed input is an expected
 * outcome and comes back as a failure; anything else is a bug and is rethrown.
 */
export function runAudit(files: AuditFiles): AuditOutcome {
  try {
    const { delivered, warnings } = parseDelivery(files.delivery);
    const report = reconcile({
      delivered,
      used: parseUsage(files.usage),
      inventory: parseInventory(files.inventory),
    });

    return { ok: true, report, warnings };
  } catch (error) {
    if (!(error instanceof InputFormatError)) throw error;

    const { source, location, message } = error;
    return { ok: false, error: { source, location, message } };
  }
}
