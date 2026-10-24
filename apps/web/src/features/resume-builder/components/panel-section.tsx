import type { Icon } from "@phosphor-icons/react/lib";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { AppIcon } from "@/components/ui/icon";
import { VisibilityToggle } from "@/features/resume-builder/components/visibility-toggle";
import { cn } from "@/lib/utils";

export function PanelSection({
  children,
  empty,
  hidden,
  icon,
  onToggle,
  title,
}: {
  children: ReactNode;
  empty: boolean;
  hidden: boolean;
  icon: Icon;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-t p-4">
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <h3
          className={cn(
            "flex items-center gap-2 text-base font-semibold",
            hidden && "opacity-50",
          )}
        >
          <AppIcon icon={icon} className="size-4 text-muted-foreground" />
          {title}
        </h3>
        {!empty && (
          <VisibilityToggle hidden={hidden} label={title} onToggle={onToggle} />
        )}
      </div>
      {empty ? (
        <EmptyState
          icon={icon}
          title={`No ${title} Yet`}
          description="Add them in your career profile to show them here."
        />
      ) : (
        <div className={cn("grid gap-4", hidden && "opacity-50")}>
          {children}
        </div>
      )}
    </section>
  );
}
