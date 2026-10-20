// Use ApiResponse only when the response needs meta or links.
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

// Error metadata is client-visible; never include internal details.
export interface ApiErrorPayload extends ApiErrorBody {
  meta?: Record<string, unknown>;
}
