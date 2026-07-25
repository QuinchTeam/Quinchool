"use client";

import { ParagraphIcon } from "@hugeicons/core-free-icons";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";

import { NodeShell } from "./index";

export type PromptNodeData = {
  executionError?: string;
  executionState?: "running";
  text: string;
};
export type PromptFlowNode = Node<PromptNodeData, "prompt">;

export function PromptNode({ id, data }: NodeProps<PromptFlowNode>) {
  const { updateNodeData } = useReactFlow();

  return (
    <NodeShell
      active={data.executionState === "running"}
      id={id}
      icon={ParagraphIcon}
      label="Prompt"
    >
      <textarea
        className="nodrag nowheel h-24 max-h-60 w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
        placeholder="Text..."
        value={data.text}
      />
    </NodeShell>
  );
}
