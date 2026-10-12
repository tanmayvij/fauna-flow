import { useId } from "react";
import { STATUS_LABELS, UNKNOWN_REASON_LABELS } from "@/constants/audit-report";
import {
  describeDeliveryWarning,
  describeSummary,
  formatDifference,
} from "@/lib/audit-text";
import type { AuditLine, AuditReport } from "@/types/audit";
import type { DeliveryWarning } from "@/types/parsers";

interface AuditResultsProps {
  weekRange: string;
  report: AuditReport;
  warnings: readonly DeliveryWarning[];
}

interface ReportRowProps {
  line: AuditLine;
}

interface StatusBadgeProps {
  status: AuditLine["status"];
}

interface DataWarningsProps {
  warnings: readonly DeliveryWarning[];
}

const NO_VALUE = "—";

const BADGE_STYLES: Record<AuditLine["status"], string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  discrepancy: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  unknown: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

const NUMBER_CELL = "px-4 py-3 text-right tabular-nums";

export function AuditResults({
  weekRange,
  report,
  warnings,
}: AuditResultsProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex flex-col gap-1">
        <h2
          id={headingId}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Audit report
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Week: {weekRange}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {describeSummary(report.summary)}
        </p>
      </header>

      {report.lines.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No items to audit.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Item
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Expected
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Counted
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-900 dark:divide-zinc-900 dark:text-zinc-50">
              {report.lines.map((line) => (
                <ReportRow key={line.item} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {warnings.length > 0 && <DataWarnings warnings={warnings} />}
    </section>
  );
}

function ReportRow({ line }: ReportRowProps) {
  return (
    <tr>
      <th scope="row" className="px-4 py-3 font-medium capitalize">
        {line.item}
      </th>
      <td className="px-4 py-3">
        <StatusBadge status={line.status} />
        {line.status === "unknown" && (
          <p className="mt-1 text-xs text-zinc-500">
            {UNKNOWN_REASON_LABELS[line.reason]}
          </p>
        )}
      </td>
      {line.status === "unknown" ? (
        <>
          <td className={NUMBER_CELL}>{NO_VALUE}</td>
          <td className={NUMBER_CELL}>{NO_VALUE}</td>
          <td className={NUMBER_CELL}>{NO_VALUE}</td>
        </>
      ) : (
        <>
          <td className={NUMBER_CELL}>{line.expected}</td>
          <td className={NUMBER_CELL}>{line.actual}</td>
          <td
            className={`${NUMBER_CELL} ${line.status === "discrepancy" ? "font-semibold text-red-700 dark:text-red-400" : ""}`}
          >
            {formatDifference(
              line.status === "discrepancy" ? line.difference : 0,
            )}
          </td>
        </>
      )}
    </tr>
  );
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DataWarnings({ warnings }: DataWarningsProps) {
  const headingId = useId();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <h3
        id={headingId}
        className="text-sm font-semibold text-amber-900 dark:text-amber-200"
      >
        Delivery file warnings
      </h3>
      <ul
        aria-labelledby={headingId}
        className="list-disc pl-5 text-sm text-amber-900 dark:text-amber-200"
      >
        {warnings.map((warning) => (
          <li key={warning.line}>{describeDeliveryWarning(warning)}</li>
        ))}
      </ul>
    </div>
  );
}
