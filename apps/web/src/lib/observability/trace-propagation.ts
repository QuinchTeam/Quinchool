export function apiTracePropagationTargets(apiBaseUrl: string): RegExp[] {
  const base = apiBaseUrl.replace(/\/$/, "");
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [new RegExp(`^${escaped}(?:/|$)`)];
}
