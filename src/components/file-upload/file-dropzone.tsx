"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";
import { MAX_UPLOAD_TOTAL_BYTES } from "@/constants/upload-limits";
import { formatFileSize, hasAllowedExtension } from "@/lib/files";

interface FileDropzoneProps {
  title: string;
  description: string;
  extensions: readonly string[];
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function FileDropzone({
  title,
  description,
  extensions,
  file,
  onFileChange,
}: FileDropzoneProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedLabel = extensions.join(", ");

  function selectFile(candidate: File | undefined) {
    if (!candidate) return;

    if (!hasAllowedExtension(candidate.name, extensions)) {
      setError(`Only ${allowedLabel} files are accepted.`);
      return;
    }

    if (candidate.size > MAX_UPLOAD_TOTAL_BYTES) {
      setError(
        `File is too large (${formatFileSize(candidate.size)}). The maximum is ${formatFileSize(MAX_UPLOAD_TOTAL_BYTES)}.`,
      );
      return;
    }

    setError(null);
    onFileChange(candidate);
  }

  function clearFile() {
    setError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {allowedLabel}
        </span>
      </header>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm text-zinc-900 dark:text-zinc-50">
              {file.name}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {formatFileSize(file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-zinc-300 dark:hover:bg-emerald-900/60"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-8 text-center transition-colors hover:border-zinc-400 has-[:focus-visible]:border-emerald-600 data-dragging:border-emerald-600 data-dragging:bg-emerald-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:data-dragging:bg-emerald-950/40"
        >
          <Image
            src="/icons/upload.svg"
            alt=""
            width={28}
            height={28}
            className="mb-1"
          />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Drop a file or <span className="underline">browse</span>
          </span>
          <span id={hintId} className="text-xs text-zinc-500">
            {allowedLabel} only
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={extensions.join(",")}
            aria-label={`${title} file`}
            aria-describedby={hintId}
            aria-invalid={error !== null}
            onChange={(event) => selectFile(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
