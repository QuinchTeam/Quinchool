/**
 * Dashed outline on a sortable container while one of its own items is lifted
 * (`data-dragging` on a direct child), so nested lists only light up their own zone.
 */
export const dropZoneClassName =
  "rounded-lg outline-2 outline-offset-4 outline-transparent outline-dashed transition-colors has-[>[data-dragging]]:outline-primary/50";
