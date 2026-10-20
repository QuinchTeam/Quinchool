// Use localhost consistently; session cookies do not cross to 127.0.0.1.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// Cross-origin API requests need credentials to include the session cookie.
export const withCredentials = { credentials: "include" } as const;

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

// A 204 response has no envelope; expose it as data: undefined.
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

export async function readApiData<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  return (await readApiEnvelope<T>(response, fallbackMessage)).data;
}
