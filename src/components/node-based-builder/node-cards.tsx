"use client";

import {
  Cancel01Icon,
  InformationCircleIcon,
  ParagraphIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import {
  Handle,
  type Node,
  type NodeProps,
  type NodeTypes,
  Position,
  useNodeConnections,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Drag-and-drop payload key shared with the toolbar. A button sets the node
// type here on drag start; the canvas reads it on drop.
export const NODE_DRAG_MIME = "application/reactflow-type";

// Every spawnable card is described once here so the toolbar, the drag/drop
// canvas and the nodeTypes map all stay in sync. Add a new card = add a row.
export const NODE_CARDS = [
  { type: "prompt", label: "Prompt", icon: ParagraphIcon },
] as const;

export type NodeCardType = (typeof NODE_CARDS)[number]["type"];

// Fresh data for a newly spawned node of a given type.
export function createNodeData(type: NodeCardType): PromptNode["data"] {
  switch (type) {
    case "prompt":
      return { text: "" };
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

function NodeShell({
  id,
  icon,
  label,
  children,
}: {
  id: string;
  icon: HugeiconsIconProps["icon"];
  label: string;
  children: ReactNode;
}) {
  const { deleteElements } = useReactFlow();

  return (
    <div className="w-64 rounded-xl border bg-card text-card-foreground shadow-sm">
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

// ─── Prompt ──────────────────────────────────────────────────────────────────

export type PromptNode = Node<{ text: string }, "prompt">;

function PromptCard({ id, data }: NodeProps<PromptNode>) {
  const { updateNodeData } = useReactFlow();

  return (
    <NodeShell id={id} icon={ParagraphIcon} label="Prompt">
      <textarea
        // nodrag/nowheel let the textarea scroll and select without the canvas
        // hijacking the gesture to pan/zoom the node.
        className="nodrag nowheel h-24 max-h-60 w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
        placeholder="Text..."
        value={data.text}
      />
    </NodeShell>
  );
}

export const nodeTypes: NodeTypes = {
  prompt: PromptCard,
};
