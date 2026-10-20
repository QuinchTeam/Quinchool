import { FlowArrowIcon } from "@phosphor-icons/react/dist/ssr/FlowArrow";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import { AppHeader } from "@/components/shared/app-header";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

const tools: {
  description: string;
  href: string;
  icon: AppIconProps["icon"];
  title: string;
}[] = [
  {
    description: "Generate text from a prompt with a chosen model.",
    href: "/text-generation",
    icon: SparkleIcon,
    title: "Text Generation",
  },
  {
    description: "Build and run flows on a node canvas.",
    href: "/node-based-flow",
    icon: FlowArrowIcon,
    title: "Node Base Flow",
  },
];

export function ToolsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AppHeader
        icon={WrenchIcon}
        title="All Random Tools"
        description="Small tools that do not need a section of their own."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group block">
            <Card className="h-full transition-colors group-hover:bg-secondary">
              <CardContent className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <AppIcon icon={tool.icon} />
                </div>
                <div className="grid min-w-0 gap-1">
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
