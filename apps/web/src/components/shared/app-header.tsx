import type { Icon } from "@phosphor-icons/react/lib";
import type { ReactNode } from "react";

import { AppIcon } from "@/components/ui/icon";

export function AppHeader({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon?: Icon;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          {icon && <AppIcon icon={icon} className="size-7 shrink-0" />}
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </header>
  );
}
