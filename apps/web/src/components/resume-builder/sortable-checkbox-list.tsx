"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SortableCheckboxItem = {
  checked: boolean;
  id: string;
  label: string;
};

function SortableCheckboxRow({
  item,
  onCheckedChange,
}: {
  item: SortableCheckboxItem;
  onCheckedChange: (id: string, checked: boolean) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });
  const checkboxId = `resume-content-${item.id.replaceAll(":", "-")}`;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-start gap-1 rounded-sm bg-card py-0.5",
        isDragging && "relative z-10 bg-muted shadow-sm",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} />
        <span className="sr-only">Reorder {item.label}</span>
      </Button>
      <Checkbox
        id={checkboxId}
        className="mt-1"
        checked={item.checked}
        onCheckedChange={(checked) => onCheckedChange(item.id, checked)}
      />
      <Label
        className="cursor-pointer pt-0.5 font-normal text-xs leading-snug"
        htmlFor={checkboxId}
      >
        {item.label}
      </Label>
    </div>
  );
}

export function SortableCheckboxList({
  items,
  onCheckedChange,
  onReorder,
}: {
  items: SortableCheckboxItem[];
  onCheckedChange: (id: string, checked: boolean) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex).map((item) => item.id));
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {items.map((item) => (
            <SortableCheckboxRow
              item={item}
              key={item.id}
              onCheckedChange={onCheckedChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
