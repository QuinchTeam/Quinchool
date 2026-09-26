"use client";

import {
  Cancel01Icon,
  AiBrain01Icon,
  InformationCircleIcon,
  MagicWand01Icon,
  ParagraphIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
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

// Drag-and-drop payload key shared with the toolbar. A button sets the node
// type here on drag start; the canvas reads it on drop.
export const NODE_DRAG_MIME = "application/reactflow-type";

// Every spawnable card is described once here so the toolbar, the drag/drop
// canvas and the nodeTypes map all stay in sync. Add a new card = add a row.
export const NODE_CARDS = [
  { type: "prompt", label: "Prompt", icon: ParagraphIcon },
  { type: "enhancer", label: "Enhancer", icon: MagicWand01Icon },
  { type: "textGenerator", label: "Text Generator", icon: AiBrain01Icon },
] as const;

export type NodeCardType = (typeof NODE_CARDS)[number]["type"];

// Fresh data for a newly spawned node of a given type.
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

// ─── Info ────────────────────────────────────────────────────────────────────
// Debug inspector: the node's own id/type/position plus the ids it is wired to.

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

  // Subscribe to the store so type/position stay live. getNode() is an
  // imperative snapshot — dragging a node only transforms its wrapper and never
  // re-renders this component, so the position would otherwise freeze. Selecting
  // primitives means only this node re-renders, and only when its value changes.
  const nodeType = useStore((store) => store.nodeLookup.get(id)?.type ?? "—");
  const position = useStore((store) => {
    const node = store.nodeLookup.get(id);
    if (!node) {
      return "—";
    }
    const { x, y } = node.internals.positionAbsolute;
    return `${Math.round(x)}, ${Math.round(y)}`;
  });

  // A connection lists this node as either source or target; the other end is
  // the neighbour. Self-loops intentionally show in both lists.
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
        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
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

// ─── Shell ───────────────────────────────────────────────────────────────────
// Shared chrome for every card: a target handle on the left, a source handle on
// the right, a titled header and a body slot. Cards only supply their body.

export function NodeShell({
  active = false,
  id,
  icon,
  label,
  children,
}: {
  active?: boolean;
  id: string;
  icon: HugeiconsIconProps["icon"];
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
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
        <span className="text-sm font-medium">{label}</span>
        <div className="ml-auto flex items-center">
          <NodeInfoPopover id={id} />
          <Button
            // nodrag stops the click from grabbing and dragging the node.
            className="nodrag"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteElements({ nodes: [{ id }] })}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
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
