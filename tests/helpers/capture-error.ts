/** Runs `run` and returns what it threw, so tests can assert on error fields. */
export function captureError(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to throw, but it returned normally");
}
