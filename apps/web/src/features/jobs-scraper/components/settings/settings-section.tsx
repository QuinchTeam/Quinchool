import type { Icon } from "@phosphor-icons/react/lib";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppIcon } from "@/components/ui/icon";

export function SettingsSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description?: string;
  icon: Icon;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AppIcon
            icon={icon}
            className="size-6 shrink-0 -translate-y-px text-muted-foreground"
          />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-6">{children}</CardContent>
    </Card>
  );
}
