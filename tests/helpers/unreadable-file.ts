/**
 * A picked file that changed on disk afterwards. Browsers refuse to read such
 * a file, and every read rejects with `NotReadableError`.
 */
export function unreadableFile(name: string): File {
  const fail = () =>
    Promise.reject(
      new DOMException(
        "The requested file could not be read",
        "NotReadableError",
      ),
    );

  return Object.assign(new File(["stale"], name), {
    arrayBuffer: fail,
    bytes: fail,
    text: fail,
  });
}
