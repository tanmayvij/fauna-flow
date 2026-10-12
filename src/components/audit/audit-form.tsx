"use client";

import { useState, type SubmitEvent } from "react";
import { AUDIT_SOURCES, type AuditSourceId } from "@/constants/audit-sources";
import { FileDropzone } from "@/components/file-upload/file-dropzone";
import { WeekSelect } from "./week-select";

type SelectedFiles = Record<AuditSourceId, File | null>;

const NO_FILES: SelectedFiles = {
  delivery: null,
  usage: null,
  inventory: null,
};

export function AuditForm() {
  const [files, setFiles] = useState<SelectedFiles>(NO_FILES);
  const [weekId, setWeekId] = useState<string | null>(null);

  const isComplete = AUDIT_SOURCES.every((source) => files[source.id]);

  function setFile(id: AuditSourceId, file: File | null) {
    setFiles((current) => ({ ...current, [id]: file }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: process reconciliation
  }

  return (
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
          disabled={!isComplete}
          className="h-11 rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          Run audit
        </button>
      </div>
    </form>
  );
}
