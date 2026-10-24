"use client";

import type { Edge, Node } from "@xyflow/react";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from "react";

import type { EnhancerNodeData } from "@/features/node-based-builder/components/nodes/enhancer-node";
import type { PromptNodeData } from "@/features/node-based-builder/components/nodes/prompt-node";
import type { TextGeneratorNodeData } from "@/features/node-based-builder/components/nodes/text-generator-node";
import { usePromptEnhancer } from "@/features/node-based-builder/hooks/use-prompt-enhancer";
import { useTextGeneration } from "@/hooks/use-text-generation";
import { logWarn } from "@/lib/observability/logger";
import { observeOperation } from "@/lib/observability/operation";

// Runs every start node, then walks edges depth-first, piping each node's output into its targets.
export function useRunFlow({
  edges,
  nodes,
  setEdges,
  setNodes,
}: {
  edges: Edge[];
  nodes: Node[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setNodes: Dispatch<SetStateAction<Node[]>>;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const enhancePrompt = usePromptEnhancer();
  const generateText = useTextGeneration();

  const runFlow = useCallback(async () => {
    if (!nodes.length || isRunning) {
      return;
    }

    setIsRunning(true);

    const flowNodes = new Map(
      nodes.map((node) => [
        node.id,
        {
          ...node,
          data: {
            ...node.data,
            executionError: undefined,
            executionState: undefined,
          },
        },
      ]),
    );
    const visited = new Set<string>();

    const updateNode = (id: string, data: Record<string, unknown>) => {
      const current = flowNodes.get(id);
      if (!current) {
        return;
      }

      const updated = { ...current, data: { ...current.data, ...data } };
      flowNodes.set(id, updated);
      setNodes((currentNodes) =>
        currentNodes.map((node) => (node.id === id ? updated : node)),
      );
    };

    const setActiveEdge = (id?: string) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => ({ ...edge, animated: edge.id === id })),
      );
    };

    const runNode = async (id: string, input?: string): Promise<void> => {
      if (visited.has(id)) {
        return;
      }

      const node = flowNodes.get(id);
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
        if ([...flowNodes.values()].some((node) => node.data.executionError))
          logWarn("node-based-builder.run.partial-failure");
      });
    } finally {
      setActiveEdge();
      setIsRunning(false);
    }
  }, [
    edges,
    enhancePrompt,
    generateText,
    isRunning,
    nodes,
    setEdges,
    setNodes,
  ]);

  return { isRunning, runFlow };
}
