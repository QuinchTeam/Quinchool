"use client";

import { ModeToggle } from "@/components/shared/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BasicsShowcase } from "@/features/design-system/components/basics-showcase";
import { FormShowcase } from "@/features/design-system/components/form-showcase";
import { DisplayShowcase } from "@/features/design-system/components/display-showcase";
import { OverlaysShowcase } from "@/features/design-system/components/overlays-showcase";
import { FeedbackShowcase } from "@/features/design-system/components/feedback-showcase";

const sections = [
  { id: "buttons", label: "Button" },
  { id: "badges", label: "Badge" },
  { id: "avatars", label: "Avatar" },
  { id: "form", label: "Form" },
  { id: "toggles", label: "Toggle" },
  { id: "tabs", label: "Tabs" },
  { id: "card", label: "Card" },
  { id: "table", label: "Table" },
  { id: "pagination", label: "Pagination" },
  { id: "overlays", label: "Overlays" },
  { id: "toast", label: "Sonner" },
  { id: "feedback", label: "Feedback" },
  { id: "dither", label: "Dither" },
  { id: "sidebar", label: "Sidebar" },
];

export function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-10">
      <Card>
        <CardContent className="flex flex-col gap-10 sm:p-10">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-semibold">
                Design System
              </h1>
              <p className="text-sm text-muted-foreground">
                Every component in this project, in one place.
              </p>
            </div>
            <ModeToggle />
          </header>

          <nav className="flex flex-wrap gap-2">
            {sections.map((item) => (
              <Badge
                key={item.id}
                variant="outline"
                // biome-ignore lint/a11y/useAnchorContent: label is passed as Badge children and merged into the anchor via the render prop
                render={<a href={`#${item.id}`} />}
              >
                {item.label}
              </Badge>
            ))}
          </nav>

          <Separator />

          <BasicsShowcase />

          <Separator />

          <FormShowcase />

          <Separator />

          <DisplayShowcase />

          <Separator />

          <OverlaysShowcase />

          <Separator />

          <FeedbackShowcase />
        </CardContent>
      </Card>
    </div>
  );
}
