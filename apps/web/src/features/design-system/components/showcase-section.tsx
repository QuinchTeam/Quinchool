import type * as React from "react";
import { cn } from "@/lib/utils";

export function ShowcaseSection({
  id,
  title,
  description,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-20">
      <div>
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        {children}
      </div>
    </section>
  );
}
