"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { BrowserIcon } from "@phosphor-icons/react/dist/ssr/Browser";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/ssr/Envelope";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeClosedIcon } from "@phosphor-icons/react/dist/ssr/EyeClosed";
import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { PhoneIcon } from "@phosphor-icons/react/dist/ssr/Phone";
import type * as React from "react";
import { useState } from "react";

import { AppIcon } from "@/components/ui/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

// Links use inputMode, not type="url", so "github.com/me" without a scheme stays valid.
const iconVariants = {
  email: { icon: EnvelopeIcon, props: { type: "email" } },
  phone: { icon: PhoneIcon, props: { type: "tel" } },
  link: { icon: BrowserIcon, props: { inputMode: "url" } },
  location: { icon: MapPinIcon, props: {} },
} as const;

// Shown only while the browser has autofilled the field.
const autofillTag = (
  <span className="hidden rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary group-has-[input:autofill]/input-group:inline-block">
    autofilled
  </span>
);

type InputProps = React.ComponentProps<"input"> & {
  variant?: keyof typeof iconVariants | "password" | "date";
};

function Input({
  className,
  variant,
  "data-slot": _slot,
  ...props
}: InputProps & { "data-slot"?: string }) {
  if (variant === "password")
    return <PasswordInput className={className} {...props} />;
  if (variant === "date") return <DateInput className={className} {...props} />;
  const iconVariant = variant ? iconVariants[variant] : undefined;
  // Every input renders as a group so the autofill check has a slot to live in.
  return (
    <InputGroup className={className}>
      <InputGroupInput {...iconVariant?.props} {...props} />
      {iconVariant && (
        <InputGroupAddon className="self-stretch border-r pr-3">
          <AppIcon icon={iconVariant.icon} />
        </InputGroupAddon>
      )}
      {/* Hidden addon so an empty slot does not pad the right edge. */}
      <InputGroupAddon
        align="inline-end"
        className="hidden group-has-[input:autofill]/input-group:flex"
      >
        {autofillTag}
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Bare styled input. Only InputGroupInput should use this; pages use Input. */
function InputBase({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-lg border border-input bg-card px-4 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup className={className}>
      <InputGroupInput type={visible ? "text" : "password"} {...props} />
      <InputGroupAddon
        align="inline-end"
        className="self-stretch border-l pl-2"
      >
        {autofillTag}
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <AppIcon icon={visible ? EyeClosedIcon : EyeIcon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

// Pass type="month" for month-only fields; defaults to a full date.
function DateInput({
  className,
  type = "date",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        type={type}
        className="[&::-webkit-calendar-picker-indicator]:hidden"
        {...props}
      />
      <InputGroupAddon
        align="inline-end"
        className="self-stretch border-l pl-2"
      >
        {autofillTag}
        <InputGroupButton
          size="icon-xs"
          aria-label="Open calendar"
          disabled={props.disabled}
          onClick={(event) =>
            event.currentTarget
              .closest("[data-slot=input-group]")
              ?.querySelector("input")
              ?.showPicker()
          }
        >
          <AppIcon icon={CalendarBlankIcon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { Input, InputBase };
