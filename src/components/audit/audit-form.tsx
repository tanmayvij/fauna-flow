"use client";

import {
  startTransition,
  useActionState,
  useState,
  type SubmitEvent,
} from "react";
import { runAuditAction } from "@/app/actions";
import { AUDIT_SOURCES } from "@/constants/audit-sources";
import { AUDIT_WEEK_COUNT } from "@/constants/audit-weeks";
import { FileDropzone } from "@/components/file-upload/file-dropzone";
import { Spinner } from "@/components/ui/spinner";
import { copyFileToMemory } from "@/lib/files";
import { getWeekOptions } from "@/lib/weeks";
import type { AuditActionState, AuditSourceId } from "@/types/audit";
import { AuditResults } from "./audit-results";
import { WeekSelect } from "./week-select";

type SelectedFiles = Record<AuditSourceId, File | null>;

const NO_FILES: SelectedFiles = {
  delivery: null,
  usage: null,
  inventory: null,
};

const IDLE: AuditActionState = { status: "idle" };

const SERVER_UNREACHABLE_MESSAGE =
  "Couldn't reach the server to run the audit. Check your connection and try again.";

export function AuditForm() {
  const [files, setFiles] = useState<SelectedFiles>(NO_FILES);
  const [weekId, setWeekId] = useState<string | null>(null);
  const [auditedWeek, setAuditedWeek] = useState<string | null>(null);
  const [result, runAudit, isRunning] = useActionState(auditFiles, IDLE);

  const isComplete = AUDIT_SOURCES.every((source) => files[source.id]);

  function setFile(id: AuditSourceId, file: File | null) {
    setFiles((current) => ({ ...current, [id]: file }));
  }

  async function auditFiles(
    previous: AuditActionState,
    selected: SelectedFiles,
  ): Promise<AuditActionState> {
    const formData = new FormData();
    for (const source of AUDIT_SOURCES) {
      const file = selected[source.id];
      if (!file) continue;

      // Copying first catches a file that changed on disk after it was
      // picked, which would otherwise make the upload itself fail.
      try {
        formData.set(source.id, await copyFileToMemory(file));
      } catch (error) {
        console.warn("audit.file_unreadable", { source: source.id, error });
        setFile(source.id, null);
        return {
          status: "error",
          message: `${source.title}: the file can no longer be read. It may have been changed, moved or deleted since it was selected. Please select it again.`,
        };
      }
    }

    try {
      return await runAuditAction(previous, formData);
    } catch (error) {
      console.error("audit.request_failed", error);
      return { status: "error", message: SERVER_UNREACHABLE_MESSAGE };
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      setAuditedWeek(selectedWeekRange(weekId));
      runAudit(files);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <WeekSelect value={weekId} onChange={setWeekId} />

        <div className="grid gap-4 md:grid-cols-3">
          {AUDIT_SOURCES.map((source) => (
            <FileDropzone
              key={source.id}
              title={source.title}
              description={source.description}
              extensions={source.extensions}
              file={files[source.id]}
              onFileChange={(file) => setFile(source.id, file)}
            />
          ))}
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-sm text-zinc-500">
            {isComplete
              ? "All files ready."
              : "Add all three files to run the audit."}
          </p>
          <button
            type="submit"
            disabled={!isComplete || isRunning}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            {isRunning ? (
              <>
                <Spinner />
                Running audit…
              </>
            ) : (
              "Run audit"
            )}
          </button>
        </div>
      </form>

      <div data-testid="audit-results" aria-live="polite" aria-busy={isRunning}>
        {result.status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          >
            {result.message}
          </p>
        )}
        {result.status === "success" && auditedWeek && (
          <AuditResults
            weekRange={auditedWeek}
            report={result.report}
            warnings={result.warnings}
          />
        )}
      </div>
    </div>
  );
}

function selectedWeekRange(weekId: string | null): string {
  const weeks = getWeekOptions(new Date(), AUDIT_WEEK_COUNT);
  return (weeks.find((week) => week.id === weekId) ?? weeks[0]).range;
}
