"use client";

import { CalendarIcon } from "@phosphor-icons/react/dist/ssr/Calendar";
import { ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { format, parse } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AppIcon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Match Input: same height, radius, and background in every state; no press shrink.
const TRIGGER_CLASS =
  "h-14 justify-start rounded-lg bg-card font-normal hover:bg-card active:scale-100 aria-expanded:bg-card dark:bg-input/30 dark:hover:bg-input/30 dark:aria-expanded:bg-input/30";
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

// Value uses the datetime-local format ("yyyy-MM-ddTHH:mm") so forms and schemas stay unchanged.
export function DateTimePicker({
  id,
  value,
  onChange,
  max,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  max?: Date;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const day = value.slice(0, 10) || format(new Date(), "yyyy-MM-dd");
  const time = value.slice(11, 16) || "00:00";
  const date = value ? parse(day, "yyyy-MM-dd", new Date()) : undefined;
  const hour24 = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  function setTime(hour: number, nextMinute: number, nextPeriod: string) {
    const nextHour = (hour % 12) + (nextPeriod === "PM" ? 12 : 0);
    onChange(
      `${day}T${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`,
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={`flex-1 ${TRIGGER_CLASS}`}
            />
          }
        >
          <AppIcon icon={CalendarIcon} />
          {date ? (
            format(date, "PPP")
          ) : (
            <span className="text-muted-foreground">Pick a date</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            disabled={max && { after: max }}
            onSelect={(selected) => {
              if (selected) {
                onChange(`${format(selected, "yyyy-MM-dd")}T${time}`);
                setOpen(false);
              }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              aria-label="Time"
              aria-invalid={invalid}
              className={`w-40 ${TRIGGER_CLASS}`}
            />
          }
        >
          <AppIcon icon={ClockIcon} />
          {format(parse(time, "HH:mm", new Date()), "h:mm a")}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto flex-row gap-1 p-2"
          align="end"
          // Focusing the first hour would scroll its column back to the top.
          initialFocus={false}
        >
          <TimeColumn
            label="Hour"
            options={HOURS.map((hour) => [hour, String(hour)])}
            selected={hour12}
            onSelect={(hour) => setTime(hour, minute, period)}
          />
          <TimeColumn
            label="Minute"
            options={MINUTES.map((value) => [
              value,
              String(value).padStart(2, "0"),
            ])}
            selected={minute}
            onSelect={(value) => setTime(hour12, value, period)}
          />
          <TimeColumn
            label="AM or PM"
            options={[
              [0, "AM"],
              [1, "PM"],
            ]}
            selected={period === "PM" ? 1 : 0}
            onSelect={(value) => setTime(hour12, minute, value ? "PM" : "AM")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TimeColumn({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: [number, string][];
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className="no-scrollbar relative flex max-h-64 flex-col gap-1 overflow-y-auto"
    >
      {options.map(([value, text]) => (
        <Button
          key={value}
          role="option"
          aria-selected={value === selected}
          variant={value === selected ? "default" : "ghost"}
          className="w-14 shrink-0"
          // Keep the current value visible when the popup opens.
          ref={
            value === selected
              ? (node) => {
                  // Wait a frame: the popup isn't laid out yet when it mounts.
                  requestAnimationFrame(() => {
                    const column = node?.parentElement;
                    if (node && column) {
                      column.scrollTop =
                        node.offsetTop -
                        column.clientHeight / 2 +
                        node.offsetHeight / 2;
                    }
                  });
                }
              : undefined
          }
          onClick={() => onSelect(value)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}
