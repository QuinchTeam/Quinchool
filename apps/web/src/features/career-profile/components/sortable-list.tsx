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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  /** Layout for the item container, e.g. "grid gap-5". */
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
