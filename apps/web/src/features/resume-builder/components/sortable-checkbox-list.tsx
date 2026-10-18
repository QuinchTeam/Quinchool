"use client";

import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { SortableList } from "@/features/career-profile/components/sortable-list";
import { useSortableItem } from "@/features/career-profile/hooks/use-sortable-item";
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
  // Same drag feel as the career profile: lift, fade siblings, outline the zone.
  const { dragClassName, handleProps, isDragging, itemProps } = useSortableItem(
    item.id,
  );
  return (
    <div
      {...itemProps}
      className={cn(
        "flex items-start gap-1 rounded-lg p-1",
        dragClassName,
        isDragging && "bg-card ring-1 ring-border",
      )}
    >
      <Button
        {...handleProps}
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        title="Drag to reorder"
      >
        <AppIcon icon={DotsSixVerticalIcon} />
        <span className="sr-only">Reorder {item.label}</span>
      </Button>
      <CheckboxLabel item={item} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function CheckboxLabel({
  item,
  onCheckedChange,
}: {
  item: SortableCheckboxItem;
  onCheckedChange: (id: string, checked: boolean) => void;
}) {
  const checkboxId = `resume-content-${item.id.replaceAll(":", "-")}`;
  return (
    <>
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
    </>
  );
}

export function SortableCheckboxList({
  columns = false,
  items,
  onCheckedChange,
  onReorder,
}: {
  /** Short labels (skills) sit 3 per row; long ones (bullets) stay one per row. */
  columns?: boolean;
  items: SortableCheckboxItem[];
  onCheckedChange: (id: string, checked: boolean) => void;
  onReorder: (ids: string[]) => void;
}) {
  const layout = cn("grid gap-1", columns && "grid-cols-3");
  const ids = items.map((item) => item.id);
  return (
    <SortableList
      className={layout}
      ids={ids}
      wrap={columns}
      onMove={(from, to) => {
        const next = [...ids];
        next.splice(to, 0, ...next.splice(from, 1));
        onReorder(next);
      }}
    >
      {items.map((item) => (
        <SortableCheckboxRow
          item={item}
          key={item.id}
          onCheckedChange={onCheckedChange}
        />
      ))}
    </SortableList>
  );
}
