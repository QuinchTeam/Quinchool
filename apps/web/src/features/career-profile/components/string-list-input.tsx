"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AppIcon } from "@/components/ui/icon";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useId, useState } from "react";
import { toast } from "sonner";
import { SortableList, useSortableItem } from "@/components/ui/sortable";
import { chipBackspace } from "@/features/career-profile/lib/chip-backspace";
import { cn } from "@/lib/utils";

function Chip({
  onRemove,
  selected,
  value,
}: {
  onRemove: () => void;
  selected: boolean;
  value: string;
}) {
  const { dragClassName, handleProps, isDragging, itemProps } =
    useSortableItem(value);

  return (
    <span
      {...handleProps}
      {...itemProps}
      ref={(node) => {
        itemProps.ref(node);
        handleProps.ref(node);
      }}
      className={cn(
        "inline-flex cursor-grab touch-none items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/20 active:cursor-grabbing",
        dragClassName,
        isDragging && "bg-card",
        selected && "border-primary bg-primary/15",
      )}
    >
      {value}
      <button
        type="button"
        className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
        onClick={onRemove}
      >
        <AppIcon icon={XIcon} className="size-3" />
        <span className="sr-only">Remove {value}</span>
      </button>
    </span>
  );
}

export function StringListInput({
  allowedValues,
  ariaLabel,
  invalid,
  onChange,
  placeholder,
  value,
}: {
  allowedValues?: string[];
  ariaLabel: string;
  invalid?: boolean;
  onChange: (value: string[]) => void;
  placeholder: string;
  value: string[];
}) {
  const [draft, setDraft] = useState("");
  // Ctrl/Cmd+A in an empty input selects all chips; Backspace clears them.
  const [allSelected, setAllSelected] = useState(false);
  const suggestionsId = useId();

  function addValues(input: string) {
    const additions = input
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!additions.length) {
      return;
    }

    const next = [...value];

    for (const addition of additions) {
      const canonicalValue = allowedValues?.find(
        (allowedValue) =>
          allowedValue.toLocaleLowerCase() === addition.toLocaleLowerCase(),
      );

      if (allowedValues && !canonicalValue) {
        toast.error(`Add "${addition}" to a skill group first`);
        continue;
      }

      const entry = canonicalValue ?? addition;

      if (
        !next.some(
          (existing) =>
            existing.toLocaleLowerCase() === entry.toLocaleLowerCase(),
        )
      ) {
        next.push(entry);
      }
    }

    onChange(next);
    setDraft("");
  }

  return (
    <>
      <InputGroup className="h-auto min-h-14 flex-wrap gap-2 px-4 py-2">
        <SortableList
          className="flex flex-wrap gap-2 empty:hidden"
          ids={value}
          wrap
          onMove={(from, to) => onChange(arrayMove(value, from, to))}
        >
          {value.map((entry) => (
            <Chip
              key={entry}
              value={entry}
              selected={allSelected}
              onRemove={() =>
                onChange(value.filter((candidate) => candidate !== entry))
              }
            />
          ))}
        </SortableList>
        <InputGroupInput
          className="h-10 min-w-32 px-0"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          list={allowedValues ? suggestionsId : undefined}
          placeholder={value.length ? "" : placeholder}
          value={draft}
          onBlur={() => {
            setAllSelected(false);
            addValues(draft);
          }}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            const erase = event.key === "Backspace" || event.key === "Delete";
            if (allSelected) {
              setAllSelected(false);
              if (erase) {
                event.preventDefault();
                onChange([]);
                return;
              }
            }
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "a" &&
              !draft &&
              value.length
            ) {
              event.preventDefault();
              setAllSelected(true);
            } else if (event.key === "Backspace" && !draft && value.length) {
              event.preventDefault();
              const next = chipBackspace(value, Boolean(allowedValues));
              onChange(next.chips);
              setDraft(next.draft);
            } else if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addValues(draft);
            }
          }}
        />
      </InputGroup>
      {allowedValues && (
        <datalist id={suggestionsId}>
          {allowedValues.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </>
  );
}
