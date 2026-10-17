/**
 * Where the NestJS API lives, for the browser to call directly.
 *
 * Spell the host as localhost rather than 127.0.0.1: the session cookie is set
 * on localhost and is not sent to 127.0.0.1, and the two also count as
 * different sites for SameSite purposes.
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Every API request needs the session cookie, which the browser only sends
 * cross-origin when asked.
 */
export const withCredentials = { credentials: "include" } as const;

/** One failed API call, from the `{ error }` envelope in docs/conventions/api-responses.md. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: { field?: string; code: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiEnvelope<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
  links?: Record<string, string>;
}

/**
 * Reads an API response: the whole `{ data, meta, links }` envelope on
 * success, an ApiError on failure. A 204 reads as `{ data: undefined }`.
 */
export async function readApiEnvelope<T, M = Record<string, unknown>>(
  response: Response,
  fallbackMessage: string,
): Promise<ApiEnvelope<T, M>> {
  if (response.status === 204) return { data: undefined as T };

  const body = (await response.json().catch(() => null)) as
    | (ApiEnvelope<T, M> & {
        error?: {
          code: string;
          message: string;
          details?: ApiError["details"];
        };
      })
    | null;

  if (!response.ok || !body) {
    throw new ApiError(
      body?.error?.message ?? fallbackMessage,
      response.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.details,
    );
  }

  return body;
}

/** Same as readApiEnvelope, for the common case that only needs `data`. */
export async function readApiData<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  return (await readApiEnvelope<T>(response, fallbackMessage)).data;
}
