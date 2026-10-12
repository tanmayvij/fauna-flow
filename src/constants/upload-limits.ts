/**
 * Next.js rejects Server Action request bodies over 1 MB by default
 * (`serverActions.bodySizeLimit`), and that limit covers all three files
 * together. A small margin is kept for the multipart framing and the action
 * fields sent alongside the files.
 */
const NEXT_BODY_SIZE_LIMIT_BYTES = 1024 * 1024;
const REQUEST_OVERHEAD_BYTES = 16 * 1024;

export const MAX_UPLOAD_TOTAL_BYTES =
  NEXT_BODY_SIZE_LIMIT_BYTES - REQUEST_OVERHEAD_BYTES;
