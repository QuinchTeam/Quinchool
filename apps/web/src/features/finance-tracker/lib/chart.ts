// Round tick spacing to 1, 2, 2.5, 5, or 10 times a power of ten.
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

export function manilaNowKey(now = new Date()) {
  // sv-SE produces sortable YYYY-MM-DD HH:mm wall-clock labels.
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
