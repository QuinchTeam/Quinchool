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
    // Avoid tilt on wide rows because it pushes their edges outside the drop zone.
    dragClassName: cn(
      "transition-opacity",
      isDragging && "relative z-10 scale-101 cursor-grabbing shadow-2xl",
      active && !isDragging && "opacity-60",
    ),
    itemProps: {
      ref: setNodeRef,
      // Hide horizontal overflow during drag while keeping long lists vertically scrollable.
      "data-dragging": isDragging || undefined,
      // Translate without scaling so variable-width chips keep their shape.
      style: { transform: CSS.Translate.toString(transform), transition },
    },
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
  };
}
