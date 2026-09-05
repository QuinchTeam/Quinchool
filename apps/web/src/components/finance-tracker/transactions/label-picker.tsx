"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useFinanceLabels } from "@/hooks/use-finance-tracker/use-labels";
import type { TransactionType } from "@/lib/finance-tracker/types";

export function LabelPicker({
  id,
  type,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: {
  id: string;
  type: TransactionType;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
}) {
  const labels = useFinanceLabels(type, value);
  const names = (labels.data ?? []).map((label) => label.name);
  const custom = value.trim();
  const isNew =
    custom &&
    !names.some((name) => name.toLowerCase() === custom.toLowerCase());
  const items = isNew ? [custom, ...names] : names;

  return (
    <div className="grid gap-1">
      <Combobox
        items={items}
        filter={null}
        inputValue={value}
        onInputValueChange={onChange}
        value={value}
        onValueChange={(name) => {
          if (name) onChange(name);
        }}
      >
        <ComboboxInput
          id={id}
          maxLength={120}
          onBlur={onBlur}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          autoComplete="off"
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {labels.isFetching ? "Loading labels..." : "No saved labels"}
          </ComboboxEmpty>
          <ComboboxList>
            {(name: string) => (
              <ComboboxItem key={name} value={name} className="break-words">
                {isNew && name === custom ? `Use "${name}"` : name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {labels.isError && (
        <p role="status" className="text-xs text-destructive">
          Saved labels unavailable.
        </p>
      )}
    </div>
  );
}
