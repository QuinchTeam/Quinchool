/**
 * The response envelope from docs/conventions/api-responses.md. Controllers
 * return plain values and the ResponseInterceptor wraps them in `{ data }`;
 * return an ApiResponse only when the response also carries `meta` or `links`.
 */
export class ApiResponse<T, M = Record<string, unknown>> {
  constructor(
    readonly data: T,
    readonly meta?: M,
    readonly links?: Record<string, string>,
  ) {}
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

/**
 * The payload to throw inside any HttpException. `meta` is optional context
 * for the client (an id to quote in a bug report), never internal details.
 */
export interface ApiErrorPayload extends ApiErrorBody {
  meta?: Record<string, unknown>;
}
