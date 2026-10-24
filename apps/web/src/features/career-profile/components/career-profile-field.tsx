"use client";

import { type ComponentProps, useId } from "react";
import { type FieldPathByValue, useController } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StringListInput } from "@/features/career-profile/components/string-list-input";
import { useAvailableSkills } from "@/features/career-profile/hooks/use-available-skills";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { normalizePastedText } from "@/features/career-profile/lib/normalize-pasted-text";

type Values = CareerProfileValues;

function FieldError({ id, message }: { id?: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function CareerProfileField({
  label,
  multiline = false,
  name,
  optional = false,
  ...props
}: Pick<
  ComponentProps<typeof Input>,
  | "aria-label"
  | "autoComplete"
  | "disabled"
  | "inputMode"
  | "placeholder"
  | "required"
  | "type"
  | "variant"
> & {
  label: string;
  multiline?: boolean;
  name: FieldPathByValue<Values, string>;
  optional?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const { field, fieldState } = useController<Values>({ name });
  const control = {
    ...field,
    ...props,
    id,
    value: (field.value as string | undefined) ?? "",
    "aria-invalid": fieldState.invalid || undefined,
    "aria-describedby": fieldState.error ? errorId : undefined,
  };

  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </Label>
      {multiline ? (
        <Textarea
          {...control}
          onPaste={(event) => {
            event.preventDefault();
            const target = event.currentTarget;
            // setRangeText leaves the caret at the end of the pasted text.
            target.setRangeText(
              normalizePastedText(event.clipboardData.getData("text")),
              target.selectionStart,
              target.selectionEnd,
              "end",
            );
            field.onChange(target.value);
          }}
        />
      ) : (
        <Input {...control} />
      )}
      <FieldError id={errorId} message={fieldState.error?.message} />
    </div>
  );
}

export function SkillsField({
  ariaLabel,
  name,
  placeholder,
  restricted = false,
}: {
  ariaLabel: string;
  name: FieldPathByValue<Values, string[]>;
  placeholder: string;
  restricted?: boolean;
}) {
  const { field, fieldState } = useController<Values>({ name });
  const availableSkills = useAvailableSkills();

  return (
    <div className="grid content-start gap-2">
      <Label>Skills</Label>
      <StringListInput
        allowedValues={restricted ? availableSkills : undefined}
        ariaLabel={ariaLabel}
        invalid={fieldState.invalid}
        placeholder={placeholder}
        value={field.value as string[]}
        onChange={field.onChange}
      />
      <FieldError message={fieldState.error?.message} />
    </div>
  );
}

export function CurrentField({
  label,
  name,
}: {
  label: string;
  name: FieldPathByValue<Values, boolean>;
}) {
  const id = useId();
  const { field } = useController<Values>({ name });

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={field.value as boolean}
        onCheckedChange={field.onChange}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
