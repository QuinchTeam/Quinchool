import { GoogleAuth, type IdTokenClient } from "google-auth-library";

import { env } from "../../../core/config/env";
import {
  AI_ERROR_CODES,
  type AiErrorResponse,
  AiServiceError,
} from "./ai-client.errors";

const AI_SERVICE_TIMEOUT_MS = 300_000;

let idTokenClient: Promise<IdTokenClient> | undefined;

/**
 * On Cloud Run the AI service is private, so calls to it carry an ID token
 * minted for its URL and Cloud Run itself does the verifying. Locally the
 * service is plain http with nothing in front of it, so no token is needed.
 */
async function authorizationHeader(): Promise<Record<string, string>> {
  if (!env.AI_SERVICE_URL.startsWith("https://")) return {};

  idTokenClient ??= new GoogleAuth().getIdTokenClient(env.AI_SERVICE_URL);
  const client = await idTokenClient;
  const token = await client.idTokenProvider.fetchIdToken(env.AI_SERVICE_URL);

  return { Authorization: `Bearer ${token}` };
}

export async function callAiService<T>(
  path: string,
  body: unknown,
  fallback: string,
): Promise<T> {
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
}
