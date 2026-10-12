import type { AUDIT_SOURCE_IDS } from "@/constants/audit-sources";
import type { DeliveryWarning } from "./parsers";

export type AuditSourceId = (typeof AUDIT_SOURCE_IDS)[number];

export interface AuditSource {
  readonly id: AuditSourceId;
  readonly title: string;
  readonly description: string;
  readonly extensions: readonly string[];
}

export type UnknownReason =
  | "invalid-delivery"
  | "missing-delivery"
  | "missing-inventory"
  | "unsafe-arithmetic";

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

export type AuditLine = OkLine | DiscrepancyLine | UnknownLine;

export interface AuditSummary {
  ok: number;
  discrepancies: number;
  unknown: number;
}

export interface AuditReport {
  lines: readonly AuditLine[];
  summary: AuditSummary;
}

/** The raw text of each uploaded file. */
export type AuditFiles = Record<AuditSourceId, string>;

/** Where an input file is malformed, in a form that can be shown or logged. */
export interface InputProblem {
  source: AuditSourceId;
  location?: string | undefined;
  message: string;
}

interface IdleState {
  status: "idle";
}

interface SuccessState {
  status: "success";
  report: AuditReport;
  warnings: readonly DeliveryWarning[];
}

interface ErrorState {
  status: "error";
  message: string;
}

/** What the audit Server Action hands back to the form. */
export type AuditActionState = IdleState | SuccessState | ErrorState;
