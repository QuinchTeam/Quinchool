export const AI_ERROR_CODES = {
  PROVIDER_ERROR: "provider_error",
  RATE_LIMIT: "rate_limit",
  SERVICE_UNAVAILABLE: "service_unavailable",
} as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

export interface AiErrorResponse {
  code: AiErrorCode;
  error: string;
  providerId?: string;
  providerModelId?: string;
}

export class AiServiceError extends Error {
  code: AiErrorCode;
  providerId?: string;
  providerModelId?: string;
  status: number;

  constructor({
    cause,
    code,
    message,
    providerId,
    providerModelId,
    status,
  }: {
    cause?: unknown;
    code: AiErrorCode;
    message: string;
    providerId?: string;
    providerModelId?: string;
    status: number;
  }) {
    super(message, { cause });
    this.name = "AiServiceError";
    this.code = code;
    this.providerId = providerId;
    this.providerModelId = providerModelId;
    this.status = status;
  }
}

export function getAiErrorResponse(
  error: unknown,
): { body: AiErrorResponse; status: number } | null {
  if (!(error instanceof AiServiceError)) {
    return null;
  }

  return {
    body: {
      code: error.code,
      error: error.message,
      providerId: error.providerId,
      providerModelId: error.providerModelId,
    },
    status: error.status,
  };
}
