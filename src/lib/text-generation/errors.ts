import { ApiError as GoogleApiError } from "@google/genai";
import OpenAI from "openai";
import type { TextGenerationProviderId } from "@/lib/text-generation/types";

export const TEXT_GENERATION_ERROR_CODES = {
  RATE_LIMIT: "rate_limit",
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

export function mapTextGenerationProviderError({
  error,
  providerId,
  providerModelId,
}: {
  error: unknown;
  providerId: TextGenerationProviderId;
  providerModelId: string;
}): unknown {
  if (isProviderRateLimitError(error)) {
    return new TextGenerationError({
      cause: error,
      code: TEXT_GENERATION_ERROR_CODES.RATE_LIMIT,
      message:
        readProviderErrorMessage(error) ?? "Provider rate limit exceeded.",
      providerId,
      providerModelId,
      status: 429,
    });
  }

  return error;
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

function isProviderRateLimitError(error: unknown): boolean {
  return (
    (error instanceof OpenAI.APIError || error instanceof GoogleApiError) &&
    error.status === 429
  );
}

function readProviderErrorMessage(error: unknown): string | undefined {
  return error instanceof OpenAI.APIError || error instanceof GoogleApiError
    ? error.message
    : undefined;
}
