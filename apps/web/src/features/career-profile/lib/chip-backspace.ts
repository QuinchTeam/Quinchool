/**
 * Backspace in an empty chip input: the last chip comes back as editable text
 * minus its last character. Restricted lists only accept known values, so
 * a half-typed chip could never be re-added; there the chip goes whole.
 */
export function chipBackspace(
  chips: string[],
  restricted: boolean,
): { chips: string[]; draft: string } {
  const last = chips.at(-1);
  if (last === undefined) return { chips, draft: "" };
  return {
    chips: chips.slice(0, -1),
    draft: restricted ? "" : last.slice(0, -1),
  };
}
