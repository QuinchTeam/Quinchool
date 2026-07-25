export function isAbortedConnectionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === "aborted" &&
    (error as NodeJS.ErrnoException).code === "ECONNRESET"
  );
}
