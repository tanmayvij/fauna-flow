"use server";

import { AUDIT_SOURCES } from "@/constants/audit-sources";
import { describeInputError } from "@/lib/audit-text";
import { hasAllowedExtension } from "@/lib/files";
import { runAudit } from "@/lib/run-audit";
import type { AuditActionState, AuditFiles, AuditSource } from "@/types/audit";

const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while running the audit. Please try again.";

class UploadError extends Error {}

/**
 * Runs the food audit on the three uploaded files. Problems with the input
 * come back as an error state for the form to show; they are never thrown.
 */
export async function runAuditAction(
  _previous: AuditActionState,
  formData: FormData,
): Promise<AuditActionState> {
  try {
    const outcome = runAudit(await readUploads(formData));

    if (!outcome.ok) {
      console.warn("audit.rejected", outcome.error);
      return { status: "error", message: describeInputError(outcome.error) };
    }

    console.info("audit.completed", {
      summary: outcome.report.summary,
      warningCount: outcome.warnings.length,
    });
    return {
      status: "success",
      report: outcome.report,
      warnings: outcome.warnings,
    };
  } catch (error) {
    if (error instanceof UploadError) {
      console.warn("audit.rejected", { message: error.message });
      return { status: "error", message: error.message };
    }

    console.error("audit.failed", error);
    return { status: "error", message: UNEXPECTED_ERROR_MESSAGE };
  }
}

async function readUploads(formData: FormData): Promise<AuditFiles> {
  const texts = await Promise.all(
    AUDIT_SOURCES.map((source) => readUpload(formData, source)),
  );

  return Object.fromEntries(
    AUDIT_SOURCES.map((source, index) => [source.id, texts[index]]),
  ) as AuditFiles;
}

async function readUpload(
  formData: FormData,
  { id, title, extensions }: AuditSource,
): Promise<string> {
  const file = formData.get(id);

  if (!(file instanceof File)) {
    throw new UploadError(`${title}: file is missing`);
  }
  if (file.size === 0) {
    throw new UploadError(`${title}: file is empty`);
  }
  if (!hasAllowedExtension(file.name, extensions)) {
    throw new UploadError(
      `${title}: only ${extensions.join(", ")} files are accepted`,
    );
  }

  return file.text();
}
