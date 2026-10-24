"use client";

import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { AppIcon } from "@/components/ui/icon";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DragHandle,
  SortableList,
  useSortableItem,
} from "@/components/ui/sortable";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { ImportBulletsDialog } from "@/features/career-profile/components/import-bullets-dialog";
import { cn } from "@/lib/utils";
import { CareerProfileField } from "@/features/career-profile/components/career-profile-field";

type Values = CareerProfileValues;
type BulletsPath = `${"experiences" | "projects"}.${number}.bullets`;

export function BulletsField({
  itemLabel,
  name,
}: {
  itemLabel: string;
  name: BulletsPath;
}) {
  const { append, fields, move, remove } = useFieldArray<Values, BulletsPath>({
    name,
  });
  const { getValues } = useFormContext<Values>();

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Bullets</Label>
        <div className="flex flex-wrap gap-2">
          <ImportBulletsDialog
            onImport={(bullets) => {
              // Replace the blank new-entry placeholder when pasting bullets.
              if (fields.length === 1 && !getValues(`${name}.0.text`).trim())
                remove(0);
              append(bullets.map((text) => ({ text })));
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ text: "" })}
          >
            <AppIcon icon={PlusCircleIcon} />
            Add bullet
          </Button>
        </div>
      </div>
      <SortableList
        className="grid gap-3"
        ids={fields.map((bullet) => bullet.id)}
        onMove={move}
      >
        {fields.map((bullet, index) => (
          <BulletRow
            key={bullet.id}
            id={bullet.id}
            label={`${itemLabel} bullet ${index + 1}`}
            name={`${name}.${index}.text`}
            removable={fields.length > 1}
            onRemove={() => remove(index)}
            title={`Bullet ${index + 1}`}
          />
        ))}
      </SortableList>
    </div>
  );
}

function BulletRow({
  id,
  label,
  name,
  onRemove,
  removable,
  title,
}: {
  id: string;
  label: string;
  name: `${BulletsPath}.${number}.text`;
  onRemove: () => void;
  removable: boolean;
  title: string;
}) {
  const { dragClassName, handleProps, isDragging, itemProps } =
    useSortableItem(id);

  return (
    <div
      {...itemProps}
      className={cn(
        // Keep padding at rest so lifting a row does not shift its layout.
        "-mx-2 flex items-start gap-2 rounded-lg p-2",
        dragClassName,
        isDragging && "bg-card ring-1 ring-border",
      )}
    >
      <div className="mt-7">
        <DragHandle label={label.toLowerCase()} {...handleProps} />
      </div>
      <div className="flex-1">
        <CareerProfileField
          aria-label={label}
          label={title}
          multiline
          name={name}
          placeholder="Shipped a feature that cut checkout time by 30%."
          required
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="mt-7"
        disabled={!removable}
        onClick={onRemove}
      >
        <AppIcon icon={TrashIcon} />
        <span className="sr-only">Remove bullet</span>
      </Button>
    </div>
  );
}
