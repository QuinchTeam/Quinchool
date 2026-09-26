import { apiUrl, withCredentials } from "@/lib/api";

export class FinanceApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FinanceApiError";
  }
}

export async function financeRequest<T>(
  path = "",
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(apiUrl(`/finance-tracker${path}`), {
    ...withCredentials,
    ...init,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new FinanceApiError(
      body?.error ?? "Finance request failed. Please try again.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
