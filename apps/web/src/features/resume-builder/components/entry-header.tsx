import { VisibilityToggle } from "@/features/resume-builder/components/visibility-toggle";
import { cn } from "@/lib/utils";

export function EntryHeader({
  hidden,
  onToggle,
  subtitle,
  title,
}: {
  hidden: boolean;
  onToggle: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className={cn("min-w-0", hidden && "opacity-50")}>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <VisibilityToggle hidden={hidden} label={title} onToggle={onToggle} />
    </div>
  );
}
