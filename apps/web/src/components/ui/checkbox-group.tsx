"use client";

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DragHandle,
  SortableList,
  useSortableItem,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";

function CheckboxGroup({ className, ...props }: CheckboxGroupPrimitive.Props) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
}

function CheckboxGroupItem({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return (
    <Label data-slot="checkbox-group-item" className="min-w-0 break-words">
      <Checkbox value={value} />
      {children}
    </Label>
  );
}

// Same group, plus drag handles. Items render in the order given; onReorder returns the new value order.
function SortableCheckboxGroup({
  className,
  items,
  onReorder,
  onValueChange,
  value,
  wrap = false,
}: {
  className?: string;
  items: { label: string; value: string }[];
  onReorder: (values: string[]) => void;
  onValueChange: (value: string[]) => void;
  value: string[];
  wrap?: boolean;
}) {
  const ids = items.map((item) => item.value);

  return (
    <CheckboxGroup value={value} onValueChange={(next) => onValueChange(next)}>
      <SortableList
        className={cn("grid gap-1", className)}
        ids={ids}
        wrap={wrap}
        onMove={(from, to) => {
          const next = [...ids];
          next.splice(to, 0, ...next.splice(from, 1));
          onReorder(next);
        }}
      >
        {items.map((item) => (
          <SortableCheckboxGroupItem key={item.value} {...item} />
        ))}
      </SortableList>
    </CheckboxGroup>
  );
}

function SortableCheckboxGroupItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { dragClassName, handleProps, isDragging, itemProps } =
    useSortableItem(value);

  return (
    <div
      {...itemProps}
      data-slot="sortable-checkbox-group-item"
      className={cn(
        // min-w-0 lets the item shrink inside a grid column so long labels wrap instead of overflowing.
        "flex min-w-0 items-center gap-1 rounded-lg p-1",
        dragClassName,
        isDragging && "bg-card ring-1 ring-border",
      )}
    >
      <DragHandle {...handleProps} label={label} />
      <CheckboxGroupItem value={value}>{label}</CheckboxGroupItem>
    </div>
  );
}

export { CheckboxGroup, CheckboxGroupItem, SortableCheckboxGroup };
