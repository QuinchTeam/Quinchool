"use client";

import { MagicWandIcon } from "@phosphor-icons/react/dist/ssr/MagicWand";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";

import { TextModelSelector } from "@/components/shared/text-model-selector";
import { Button } from "@/components/ui/button";
import { usePromptEnhancer } from "@/features/node-based-builder/hooks/use-prompt-enhancer";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

import { NodeShell } from "./index";

export type EnhancerNodeData = {
  enhancedPrompt: string;
  executionError?: string;
  executionState?: "running";
  modelId: TextGenerationModelId;
  prompt: string;
};
export type EnhancerFlowNode = Node<EnhancerNodeData, "enhancer">;

export function EnhancerNode({ id, data }: NodeProps<EnhancerFlowNode>) {
  const { updateNodeData } = useReactFlow();
  const enhancePrompt = usePromptEnhancer();

  const runEnhancer = () => {
    const prompt = data.prompt.trim();
    if (!prompt) {
      return;
    }

    enhancePrompt.mutate(
      { modelId: data.modelId, prompt },
      {
        onSuccess: ({ enhancedPrompt }) =>
          updateNodeData(id, { enhancedPrompt }),
      },
    );
  };

  return (
    <NodeShell
      active={data.executionState === "running"}
      id={id}
      icon={MagicWandIcon}
      label="Enhancer"
    >
      <div className="grid gap-3">
        <div className="nodrag nowheel">
          <TextModelSelector
            label="Model"
            inCanvas
            value={data.modelId}
            onValueChange={(modelId) =>
              updateNodeData(id, {
                enhancedPrompt: "",
                executionError: undefined,
                modelId,
              })
            }
          />
        </div>
        <textarea
          className="nodrag nowheel h-24 max-h-60 w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
          onChange={(event) =>
            updateNodeData(id, {
              enhancedPrompt: "",
              executionError: undefined,
              prompt: event.target.value,
            })
          }
          placeholder="Put your prompt..."
          value={data.prompt}
        />
        <Button
          className="nodrag"
          disabled={!data.prompt.trim()}
          loading={enhancePrompt.isPending}
          loadingText="Enhancing..."
          onClick={runEnhancer}
          type="button"
        >
          Run
        </Button>
        {data.executionError || enhancePrompt.isError ? (
          <p className="text-xs text-destructive" role="alert">
            {data.executionError ??
              enhancePrompt.error?.message ??
              "Failed to enhance prompt"}
          </p>
        ) : null}
        {data.enhancedPrompt ? (
          <div className="nodrag nowheel max-h-60 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-2 text-xs">
            {data.enhancedPrompt}
          </div>
        ) : null}
      </div>
    </NodeShell>
  );
}
