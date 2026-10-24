import { GoogleAuth, type IdTokenClient } from "google-auth-library";

import { env } from "../../../core/config/env";
import { observeDomain } from "../../../core/observability/logger";
import {
  AI_ERROR_CODES,
  type AiErrorResponse,
  AiServiceError,
} from "./ai-client.errors";

const AI_SERVICE_TIMEOUT_MS = 300_000;

let idTokenClient: Promise<IdTokenClient> | undefined;

// Cloud Run requires an audience-bound ID token; local HTTP calls need none.
async function authorizationHeader(): Promise<Record<string, string>> {
  if (!env.AI_SERVICE_URL.startsWith("https://")) return {};

  idTokenClient ??= new GoogleAuth().getIdTokenClient(env.AI_SERVICE_URL);
  const client = await idTokenClient;
  const token = await client.idTokenProvider.fetchIdToken(env.AI_SERVICE_URL);

  return { Authorization: `Bearer ${token}` };
}

type AiStreamEvent<T> =
  | { type: "step"; step: string; count: number | null }
  | { type: "result"; result: T }
  | { type: "error"; error: string; status: number };

// For NDJSON endpoints: step lines go to onStep, the result line resolves, an error line throws.
export async function streamAiService<T>(
  path: string,
  body: unknown,
  fallback: string,
  onStep: (step: string, count: number | null) => Promise<void>,
): Promise<T> {
  return observeDomain("ai.request", async () => {
    let response: Response;

    try {
      response = await fetch(`${env.AI_SERVICE_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authorizationHeader()),
        },
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

    if (!response.ok || !response.body) {
      throw new AiServiceError({
        code: AI_ERROR_CODES.PROVIDER_ERROR,
        message: fallback,
        status: response.status,
      });
    }

    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines.filter(Boolean)) {
        const event = JSON.parse(line) as AiStreamEvent<T>;

        if (event.type === "result") return event.result;
        if (event.type === "error") {
          throw new AiServiceError({
            code:
              event.status === 429
                ? AI_ERROR_CODES.RATE_LIMIT
                : AI_ERROR_CODES.PROVIDER_ERROR,
            message: event.error,
            status: event.status,
          });
        }
        await onStep(event.step, event.count);
      }
    }

    // Stream closed without a result: the AI service crashed or was cut off.
    throw new AiServiceError({
      code: AI_ERROR_CODES.PROVIDER_ERROR,
      message: fallback,
      status: 502,
    });
  });
}

export async function callAiService<T>(
  path: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  return observeDomain("ai.request", async () => {
    let response: Response;

    try {
      response = await fetch(`${env.AI_SERVICE_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authorizationHeader()),
        },
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
  });
}
