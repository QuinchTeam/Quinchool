// Restricted lists delete whole chips; free-text lists reopen the last chip for editing.
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
