// Join hard wraps and strip bullet markers from pasted PDF text.
export function normalizePastedText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[•●▪◦*\-–—]\s*/, "");
}

const BULLET_MARK = /^[•●▪◦*\-–—]\s*/;

// Unmarked lines continue a bullet; without any markers, each line becomes a bullet.
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
