// Show boundary pages and current neighbors; use gaps only for wider jumps.
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const [i, p] of sorted.entries()) {
    const previous = sorted[i - 1];
    if (previous !== undefined && p - previous === 2) items.push(p - 1);
    else if (previous !== undefined && p - previous > 2) items.push("gap");
    items.push(p);
  }
  return items;
}
