"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

export function useSortableItem(id: string) {
  const {
    active,
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return {
    isDragging,
    // Same feel as wallet cards: lift the picked-up item, fade its siblings.
    // No tilt and a tiny scale: on full-width items even 1deg swings the ends
    // tens of pixels past the drop zone.
    dragClassName: cn(
      "transition-opacity",
      isDragging && "relative z-10 scale-101 cursor-grabbing shadow-2xl",
      active && !isDragging && "opacity-60",
    ),
    itemProps: {
      ref: setNodeRef,
      // The dashboard panel hides its horizontal scrollbar while dragging, but
      // keeps vertical scroll so long lists can still be reached.
      "data-dragging": isDragging || undefined,
      // Translate, not Transform: scaling distorts variable-width chips.
      style: { transform: CSS.Translate.toString(transform), transition },
    },
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
  };
}
