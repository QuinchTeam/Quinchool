import {
  AiGenerativeIcon,
  WorkflowSquareIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
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
  icon: HugeiconsIconProps["icon"];
  title: string;
}[] = [
  {
    description: "Generate text from a prompt with a chosen model.",
    href: "/text-generation",
    icon: AiGenerativeIcon,
    title: "Text Generation",
  },
  {
    description: "Build and run flows on a node canvas.",
    href: "/node-based-flow",
    icon: WorkflowSquareIcon,
    title: "Node Base Flow",
  },
];

export function ToolsHub() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">All Random Tools</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group block">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardContent className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
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
