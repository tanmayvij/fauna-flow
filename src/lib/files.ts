const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
}

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

export function hasAllowedExtension(
  fileName: string,
  allowedExtensions: readonly string[],
): boolean {
  return allowedExtensions.includes(getFileExtension(fileName));
}

/**
 * Reads a picked file into memory. A picked file is only a reference to the
 * file on disk, and browsers refuse to read it once it has changed there, so
 * this rejects with `NotReadableError` if the file was edited, moved or deleted.
 */
export async function copyFileToMemory(file: File): Promise<File> {
  return new File([await file.arrayBuffer()], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
