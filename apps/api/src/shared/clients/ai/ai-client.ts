import { env } from "../../../core/config/env";
import {
  AI_ERROR_CODES,
  type AiErrorResponse,
  AiServiceError,
} from "./ai-client.errors";

const AI_SERVICE_TIMEOUT_MS = 300_000;

export async function callAiService<T>(
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
    throw new AiServiceError({
      cause: error,
      code: AI_ERROR_CODES.SERVICE_UNAVAILABLE,
      message:
        "The AI service is unreachable. Start the apps/ai FastAPI service.",
      status: 503,
    });
  }

  const responseBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = (responseBody ?? {}) as Partial<AiErrorResponse>;

    throw new AiServiceError({
      code:
        failure.code === AI_ERROR_CODES.RATE_LIMIT
          ? AI_ERROR_CODES.RATE_LIMIT
          : AI_ERROR_CODES.PROVIDER_ERROR,
      message: failure.error ?? fallback,
      providerId: failure.providerId,
      providerModelId: failure.providerModelId,
      status: response.status,
    });
  }

  return responseBody as T;
}
