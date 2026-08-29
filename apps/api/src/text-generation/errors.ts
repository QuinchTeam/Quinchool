import type { TextGenerationProviderId } from "./types";

export const TEXT_GENERATION_ERROR_CODES = {
  PROVIDER_ERROR: "provider_error",
  RATE_LIMIT: "rate_limit",
  SERVICE_UNAVAILABLE: "service_unavailable",
} as const;

export type TextGenerationErrorCode =
  (typeof TEXT_GENERATION_ERROR_CODES)[keyof typeof TEXT_GENERATION_ERROR_CODES];

export interface TextGenerationErrorResponse {
  code: TextGenerationErrorCode;
  error: string;
  providerId?: TextGenerationProviderId;
  providerModelId?: string;
}

export class TextGenerationError extends Error {
  code: TextGenerationErrorCode;
  providerId?: TextGenerationProviderId;
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
    code: TextGenerationErrorCode;
    message: string;
    providerId?: TextGenerationProviderId;
    providerModelId?: string;
    status: number;
  }) {
    super(message, { cause });
    this.name = "TextGenerationError";
    this.code = code;
    this.providerId = providerId;
    this.providerModelId = providerModelId;
    this.status = status;
  }
}

export function getTextGenerationErrorResponse(
  error: unknown,
): { body: TextGenerationErrorResponse; status: number } | null {
  if (!(error instanceof TextGenerationError)) {
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
