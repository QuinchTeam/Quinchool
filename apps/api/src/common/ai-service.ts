import { env } from "../config/env";
import {
  TEXT_GENERATION_ERROR_CODES,
  TextGenerationError,
  type TextGenerationErrorResponse,
} from "../text-generation/errors";

const AI_SERVICE_TIMEOUT_MS = 300_000;

export async function callAIService<T>(
  path: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${env.AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(AI_SERVICE_TIMEOUT_MS),
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new TextGenerationError({
      cause: error,
      code: TEXT_GENERATION_ERROR_CODES.SERVICE_UNAVAILABLE,
      message:
        "The AI service is unreachable. Start the apps/ai FastAPI service.",
      status: 503,
    });
  }

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = (responseBody ??
      {}) as Partial<TextGenerationErrorResponse>;

    throw new TextGenerationError({
      code:
        failure.code === TEXT_GENERATION_ERROR_CODES.RATE_LIMIT
          ? TEXT_GENERATION_ERROR_CODES.RATE_LIMIT
          : TEXT_GENERATION_ERROR_CODES.PROVIDER_ERROR,
      message: failure.error ?? fallback,
      providerId: failure.providerId,
      providerModelId: failure.providerModelId,
      status: response.status,
    });
  }

  return responseBody as T;
}
