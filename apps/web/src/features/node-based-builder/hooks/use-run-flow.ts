"use client";

import { useCallback } from "react";

import type { EnhancerNodeData } from "@/features/node-based-builder/components/nodes/enhancer-node";
import type { PromptNodeData } from "@/features/node-based-builder/components/nodes/prompt-node";
import type { TextGeneratorNodeData } from "@/features/node-based-builder/components/nodes/text-generator-node";
import { usePromptEnhancer } from "@/features/node-based-builder/hooks/use-prompt-enhancer";
import { useFlowStore } from "@/features/node-based-builder/store/flow-store";
import { useTextGeneration } from "@/hooks/use-text-generation";
import { logWarn } from "@/lib/observability/logger";
import { observeOperation } from "@/lib/observability/operation";

// Runs every start node, then walks edges depth-first, piping each node's output into its targets.
export function useRunFlow() {
  const enhancePrompt = usePromptEnhancer();
  const generateText = useTextGeneration();

  const runFlow = useCallback(async () => {
    const { edges, isRunning, nodes, setActiveEdge, updateNode } =
      useFlowStore.getState();
    if (!nodes.length || isRunning) {
      return;
    }

    useFlowStore.setState({ isRunning: true });
    for (const node of nodes)
      updateNode(node.id, {
        executionError: undefined,
        executionState: undefined,
      });

    const visited = new Set<string>();
    const findNode = (id: string) =>
      useFlowStore.getState().nodes.find((node) => node.id === id);

    const runNode = async (id: string, input?: string): Promise<void> => {
      if (visited.has(id)) {
        return;
      }

      const node = findNode(id);
      if (!node) {
        return;
      }
      visited.add(id);
      updateNode(id, { executionState: "running" });

      let output: string | undefined;

      try {
        output = await observeOperation("node-based-builder.node", async () => {
          switch (node.type) {
            case "prompt": {
              const text = input ?? (node.data as PromptNodeData).text;
              updateNode(id, { text });
              return text;
            }
            case "enhancer": {
              const data = node.data as EnhancerNodeData;
              const prompt = input ?? data.prompt;
              if (!prompt.trim()) {
                throw Object.assign(new Error("Prompt is required"), {
                  status: 422,
                });
              }

              updateNode(id, { enhancedPrompt: "", prompt });
              const { enhancedPrompt } = await enhancePrompt.mutateAsync({
                modelId: data.modelId,
                prompt,
              });
              updateNode(id, { enhancedPrompt });
              return enhancedPrompt;
            }
            case "textGenerator": {
              const data = node.data as TextGeneratorNodeData;
              const prompt = input ?? data.prompt;
              if (!prompt.trim()) {
                throw Object.assign(new Error("Prompt is required"), {
                  status: 422,
                });
              }

              updateNode(id, { generatedText: "", prompt });
              const { text } = await generateText.mutateAsync({
                modelId: data.modelId,
                prompt,
              });
              updateNode(id, { generatedText: text });
              return text;
            }
            default:
              return undefined;
          }
        });
        if (output === undefined) return;
      } catch (error) {
        updateNode(id, {
          executionError:
            error instanceof Error ? error.message : "Failed to run node",
          executionState: undefined,
        });
        return;
      }

      updateNode(id, { executionState: undefined });

      for (const edge of edges.filter((edge) => edge.source === id)) {
        setActiveEdge(edge.id);
        await runNode(edge.target, output);
      }
    };

    const targets = new Set(edges.map((edge) => edge.target));
    const startNodes = nodes.filter((node) => !targets.has(node.id));

    try {
      await observeOperation("node-based-builder.run", async () => {
        for (const node of startNodes.length ? startNodes : nodes)
          await runNode(node.id);
        if (
          useFlowStore.getState().nodes.some((node) => node.data.executionError)
        )
          logWarn("node-based-builder.run.partial-failure");
      });
    } finally {
      setActiveEdge();
      useFlowStore.setState({ isRunning: false });
    }
  }, [enhancePrompt, generateText]);

  return runFlow;
}
