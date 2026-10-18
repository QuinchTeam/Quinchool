/**
 * Page buttons to show: always the first and last page, the current page and
 * one neighbour each side, with "gap" where pages are skipped.
 * e.g. pageItems(6, 20) -> [1, "gap", 5, 6, 7, "gap", 20]
 */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const [i, p] of sorted.entries()) {
    const previous = sorted[i - 1];
    // A single skipped page is shown as a number; a gap of one is silly.
    if (previous !== undefined && p - previous === 2) items.push(p - 1);
    else if (previous !== undefined && p - previous > 2) items.push("gap");
    items.push(p);
  }
  return items;
}
