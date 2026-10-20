import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { AppIcon } from "@/components/ui/icon";

export function FormErrors({
  errors,
}: {
  errors: { label: string; message: string }[];
}) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      className="grid gap-2 rounded-lg border border-destructive bg-muted/50 p-4 ring-3 ring-destructive/25"
    >
      <p className="flex items-center gap-3 text-sm font-semibold">
        <AppIcon
          icon={WarningIcon}
          className="size-5 shrink-0 text-destructive"
        />
        Fix {errors.length} {errors.length === 1 ? "field" : "fields"} before
        saving
      </p>
      <ul className="ml-8 grid list-disc gap-1.5 pl-4 text-sm marker:text-muted-foreground">
        {errors.map(({ label, message }) => (
          <li key={`${label}:${message}`}>
            <span className="font-medium">{label}:</span>{" "}
            <span className="text-muted-foreground">{message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
