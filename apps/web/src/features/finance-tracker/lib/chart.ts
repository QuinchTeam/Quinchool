/**
 * Evenly spaced axis ticks from 0 that cover `max`, stepping by 1, 2, 2.5 or 5
 * times a power of ten. e.g. niceTicks(73_000) -> [0, 20000, 40000, 60000, 80000]
 */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((n) => n * power).find((s) => s >= rough) ??
    10 * power;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

/** Now as a Manila wall-clock key, comparable with summary bucket keys. */
export function manilaNowKey(now = new Date()) {
  // sv-SE formats as "YYYY-MM-DD HH:mm".
  return now
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
    .replace(" ", "T");
}
