import {
  type ApiEnvelope,
  apiUrl,
  readApiEnvelope,
  withCredentials,
} from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

const FALLBACK_ERROR = "Finance request failed. Please try again.";

export async function financeRequest<T>(
  path = "",
  init: RequestInit = {},
): Promise<T> {
  return (await financeEnvelopeRequest<T>(path, init)).data;
}

export async function financeEnvelopeRequest<T, M = Record<string, unknown>>(
  path = "",
  init: RequestInit = {},
): Promise<ApiEnvelope<T, M>> {
  return observeOperation("finance-tracker.request", async () => {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("Content-Type", "application/json");
    const response = await apiFetch(apiUrl(`/finance-tracker${path}`), {
      ...withCredentials,
      ...init,
      headers,
      cache: "no-store",
    });
    return readApiEnvelope<T, M>(response, FALLBACK_ERROR);
  });
}
