"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";
import { AppIcon } from "@/components/ui/icon";
import { type ComponentProps, type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";
import { dropZoneClassName } from "@/lib/drop-zone";
import { cn } from "@/lib/utils";

export function SortableList({
  children,
  className,
  ids,
  onMove,
  wrap = false,
}: {
  children: ReactNode;
  className: string;
  ids: string[];
  onMove: (from: number, to: number) => void;
  wrap?: boolean;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
        }
      }}
    >
      <SortableContext
        items={ids}
        strategy={wrap ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className={cn(dropZoneClassName, className)}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({
  label,
  ...props
}: ComponentProps<typeof Button> & { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      title="Drag to reorder"
      {...props}
    >
      <AppIcon icon={DotsSixVerticalIcon} />
      <span className="sr-only">Reorder {label}</span>
    </Button>
  );
}

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
