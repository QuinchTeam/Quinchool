"use client";

import { BrainIcon } from "@phosphor-icons/react/dist/ssr/Brain";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { MagicWandIcon } from "@phosphor-icons/react/dist/ssr/MagicWand";
import { ParagraphIcon } from "@phosphor-icons/react/dist/ssr/Paragraph";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import {
  Handle,
  type NodeTypes,
  Position,
  useNodeConnections,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EnhancerNode, type EnhancerNodeData } from "./enhancer-node";
import { PromptNode, type PromptNodeData } from "./prompt-node";
import {
  TextGeneratorNode,
  type TextGeneratorNodeData,
} from "./text-generator-node";

export const NODE_DRAG_MIME = "application/reactflow-type";

// Add node types here so toolbar options and canvas registration stay aligned.
export const NODE_CARDS = [
  { type: "prompt", label: "Prompt", icon: ParagraphIcon },
  { type: "enhancer", label: "Enhancer", icon: MagicWandIcon },
  { type: "textGenerator", label: "Text Generator", icon: BrainIcon },
] as const;

export type NodeCardType = (typeof NODE_CARDS)[number]["type"];

export type NodeData =
  | PromptNodeData
  | EnhancerNodeData
  | TextGeneratorNodeData;

export function createNodeData(type: NodeCardType): NodeData {
  switch (type) {
    case "prompt":
      return { text: "" };
    case "enhancer":
      return {
        enhancedPrompt: "",
        modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
        prompt: "",
      };
    case "textGenerator":
      return {
        generatedText: "",
        modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
        prompt: "",
      };
  }
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "truncate font-mono" : "truncate"}>{value}</span>
    </div>
  );
}

function ConnectionRow({ label, ids }: { label: string; ids: string[] }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground">
        {label} ({ids.length})
      </span>
      <span className="break-words font-mono">
        {ids.length ? ids.join(", ") : "—"}
      </span>
    </div>
  );
}

function NodeInfoPopover({ id }: { id: string }) {
  const connections = useNodeConnections({ id });

  // Subscribe to the store; getNode() snapshots do not update while a node is dragged.
  const nodeType = useStore((store) => store.nodeLookup.get(id)?.type ?? "—");
  const position = useStore((store) => {
    const node = store.nodeLookup.get(id);
    if (!node) {
      return "—";
    }
    const { x, y } = node.internals.positionAbsolute;
    return `${Math.round(x)}, ${Math.round(y)}`;
  });

  // Self-loops intentionally appear in both neighbor lists.
  const incoming = connections
    .filter((connection) => connection.target === id)
    .map((connection) => connection.source);
  const outgoing = connections
    .filter((connection) => connection.source === id)
    .map((connection) => connection.target);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className="nodrag"
            type="button"
            variant="ghost"
            size="icon-sm"
          />
        }
      >
        <AppIcon icon={InfoIcon} />
        <span className="sr-only">Node debug info</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="nowheel grid w-64 gap-2 text-xs">
        <InfoRow label="ID" value={id} mono />
        <InfoRow label="Type" value={nodeType} />
        <InfoRow label="Position" value={position} />
        <ConnectionRow label="Incoming" ids={incoming} />
        <ConnectionRow label="Outgoing" ids={outgoing} />
      </PopoverContent>
    </Popover>
  );
}

export function NodeShell({
  active = false,
  id,
  icon,
  label,
  children,
}: {
  active?: boolean;
  id: string;
  icon: AppIconProps["icon"];
  label: string;
  children: ReactNode;
}) {
  const { deleteElements } = useReactFlow();

  return (
    <div
      className={`w-64 rounded-xl border bg-card text-card-foreground shadow-sm ${
        active ? "animate-pulse ring-2 ring-primary" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <AppIcon icon={icon} size={16} />
        <span className="text-sm font-medium">{label}</span>
        <div className="ml-auto flex items-center">
          <NodeInfoPopover id={id} />
          <Button
            className="nodrag"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteElements({ nodes: [{ id }] })}
          >
            <AppIcon icon={XIcon} />
            <span className="sr-only">Remove {label} node</span>
          </Button>
        </div>
      </div>
      <div className="p-3">{children}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  enhancer: EnhancerNode,
  textGenerator: TextGeneratorNode,
};
