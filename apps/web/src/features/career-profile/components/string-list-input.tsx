"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { SortableList } from "@/features/career-profile/components/sortable-list";
import { useSortableItem } from "@/features/career-profile/hooks/use-sortable-item";
import { cn } from "@/lib/utils";

function Chip({ onRemove, value }: { onRemove: () => void; value: string }) {
  const { handleProps, isDragging, itemProps } = useSortableItem(value);

  return (
    <span
      {...handleProps}
      {...itemProps}
      // The whole chip is the drag handle.
      ref={(node) => {
        itemProps.ref(node);
        handleProps.ref(node);
      }}
      className={cn(
        "inline-flex cursor-grab touch-none items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/20 active:cursor-grabbing",
        isDragging && "relative z-10 shadow-sm",
      )}
    >
      {value}
      <button
        type="button"
        className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
        onClick={onRemove}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
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
      <div
        className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20"
        aria-invalid={invalid || undefined}
      >
        <SortableList
          ids={value}
          wrap
          onMove={(from, to) => onChange(arrayMove(value, from, to))}
        >
          {value.map((entry) => (
            <Chip
              key={entry}
              value={entry}
              onRemove={() =>
                onChange(value.filter((candidate) => candidate !== entry))
              }
            />
          ))}
        </SortableList>
        <input
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label={ariaLabel}
          list={allowedValues ? suggestionsId : undefined}
          placeholder={value.length ? "" : placeholder}
          value={draft}
          onBlur={() => addValues(draft)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addValues(draft);
            }
          }}
        />
      </div>
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
