"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function useSortableItem(id: string) {
  const {
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
    itemProps: {
      ref: setNodeRef,
      // Translate, not Transform: scaling distorts variable-width chips.
      style: { transform: CSS.Translate.toString(transform), transition },
    },
    handleProps: { ref: setActivatorNodeRef, ...attributes, ...listeners },
  };
}
