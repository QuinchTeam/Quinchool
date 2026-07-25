"use client";

import { AiBrain01Icon } from "@hugeicons/core-free-icons";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";

import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
import { useTextGeneration } from "@/hooks/use-text-generation";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

import { NodeShell } from "./index";

export type TextGeneratorNodeData = {
  executionError?: string;
  executionState?: "running";
  generatedText: string;
  modelId: TextGenerationModelId;
  prompt: string;
};
export type TextGeneratorFlowNode = Node<
  TextGeneratorNodeData,
  "textGenerator"
>;

export function TextGeneratorNode({
  id,
  data,
}: NodeProps<TextGeneratorFlowNode>) {
  const { updateNodeData } = useReactFlow();
  const generateText = useTextGeneration();

  const runGeneration = () => {
    const prompt = data.prompt.trim();
    if (!prompt) {
      return;
    }

    generateText.mutate(
      { modelId: data.modelId, prompt },
      {
        onSuccess: ({ text }) => updateNodeData(id, { generatedText: text }),
      },
    );
  };

  return (
    <NodeShell
      active={data.executionState === "running"}
      id={id}
      icon={AiBrain01Icon}
      label="Text Generator"
    >
      <div className="grid gap-3">
        <div className="nodrag nowheel">
          <TextModelSelector
            inCanvas
            label="Model"
            value={data.modelId}
            onValueChange={(modelId) =>
              updateNodeData(id, {
                executionError: undefined,
                generatedText: "",
                modelId,
              })
            }
          />
        </div>
        <textarea
          className="nodrag nowheel h-24 max-h-60 w-full resize-none rounded-md border bg-background px-2 py-1.5 text-xs leading-relaxed outline-none placeholder:text-muted-foreground"
          onChange={(event) =>
            updateNodeData(id, {
              executionError: undefined,
              generatedText: "",
              prompt: event.target.value,
            })
          }
          placeholder="Write what you want to generate."
          value={data.prompt}
        />
        <Button
          className="nodrag"
          disabled={!data.prompt.trim() || generateText.isPending}
          onClick={runGeneration}
          type="button"
        >
          {generateText.isPending ? "Generating..." : "Generate"}
        </Button>
        {data.executionError || generateText.isError ? (
          <p className="text-xs text-destructive" role="alert">
            {data.executionError ??
              generateText.error?.message ??
              "Failed to generate text"}
          </p>
        ) : null}
        {data.generatedText ? (
          <div className="nodrag nowheel max-h-60 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-2 text-xs">
            {data.generatedText}
          </div>
        ) : null}
      </div>
    </NodeShell>
  );
}
