/**
 * Text pasted from PDFs and docs arrives hard-wrapped and often with its own
 * bullet mark. A resume bullet is one line, so join the wraps and drop the mark.
 */
export function normalizePastedText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[•●▪◦*\-–—]\s*/, "");
}

const BULLET_MARK = /^[•●▪◦*\-–—]\s*/;

/**
 * Splits a pasted bullet list into one string per bullet. A line starting with
 * a bullet mark opens a new bullet; unmarked lines are hard wraps and join the
 * one above. Without any marks, each line is its own bullet.
 */
export function parsePastedBullets(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const marked = lines.some((line) => BULLET_MARK.test(line));
  const bullets: string[] = [];
  for (const line of lines) {
    if (!marked || BULLET_MARK.test(line) || !bullets.length) {
      bullets.push(line);
    } else {
      bullets[bullets.length - 1] += ` ${line}`;
    }
  }
  return bullets.map(normalizePastedText).filter(Boolean);
}
