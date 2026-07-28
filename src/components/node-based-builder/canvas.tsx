"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type ColorMode,
  type Connection,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

import "@xyflow/react/dist/style.css";

import { CanvasMainToolbar } from "./canvas-main-toolbar";
import { CanvasNodeToolbar } from "./canvas-node-toolbar";
import { edgeTypes, REMOVABLE_EDGE_TYPE } from "./edges";
import { usePromptEnhancer } from "@/hooks/use-prompt-enhancer";
import { useTextGeneration } from "@/hooks/use-text-generation";
import {
  createNodeData,
  NODE_DRAG_MIME,
  type NodeCardType,
  nodeTypes,
} from "./nodes";
import type { EnhancerNodeData } from "./nodes/enhancer-node";
import type { PromptNodeData } from "./nodes/prompt-node";
import type { TextGeneratorNodeData } from "./nodes/text-generator-node";

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

// React Flow reads window.matchMedia during render for colorMode="system",
// which would mismatch the server's initial light render during hydration.
function useSsrSafeColorMode(): ColorMode {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted && resolvedTheme === "dark" ? "dark" : "light";
}

function CanvasContent() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const colorMode = useSsrSafeColorMode();
  const enhancePrompt = usePromptEnhancer();
  const generateText = useTextGeneration();

  const spawnNode = useCallback(
    (type: NodeCardType, position: { x: number; y: number }) => {
      const node = {
        id: nextNodeId(),
        type,
        position,
        data: createNodeData(type),
      };

      setNodes((current) => [...current, node]);
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge({ ...connection, type: REMOVABLE_EDGE_TYPE }, current),
      ),
    [setEdges],
  );

  const handleSpawnAtCenter = useCallback(
    (type: NodeCardType) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const center = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: 0, y: 0 };

      spawnNode(type, screenToFlowPosition(center));
    },
    [screenToFlowPosition, spawnNode],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(NODE_DRAG_MIME) as NodeCardType;
      if (!type) {
        return;
      }

      spawnNode(
        type,
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    },
    [screenToFlowPosition, spawnNode],
  );

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setEdges, setNodes]);

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

      let output: string;

      try {
        switch (node.type) {
          case "prompt": {
            output = input ?? (node.data as PromptNodeData).text;
            updateNode(id, { text: output });
            break;
          }
          case "enhancer": {
            const data = node.data as EnhancerNodeData;
            const prompt = input ?? data.prompt;
            if (!prompt.trim()) {
              throw new Error("Prompt is required");
            }

            updateNode(id, { enhancedPrompt: "", prompt });
            const { enhancedPrompt } = await enhancePrompt.mutateAsync({
              modelId: data.modelId,
              prompt,
            });
            output = enhancedPrompt;
            updateNode(id, { enhancedPrompt });
            break;
          }
          case "textGenerator": {
            const data = node.data as TextGeneratorNodeData;
            const prompt = input ?? data.prompt;
            if (!prompt.trim()) {
              throw new Error("Prompt is required");
            }

            updateNode(id, { generatedText: "", prompt });
            const { text } = await generateText.mutateAsync({
              modelId: data.modelId,
              prompt,
            });
            output = text;
            updateNode(id, { generatedText: text });
            break;
          }
          default:
            return;
        }
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
      for (const node of startNodes.length ? startNodes : nodes) {
        await runNode(node.id);
      }
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

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={colorMode}
        proOptions={{ hideAttribution: true }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fitView
      >
        <Panel position="top-right">
          <CanvasNodeToolbar onSpawn={handleSpawnAtCenter} />
        </Panel>
        <Panel position="bottom-center">
          <CanvasMainToolbar
            isRunning={isRunning}
            onClear={clearCanvas}
            onRun={runFlow}
          />
        </Panel>
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          color="var(--muted)"
        />
      </ReactFlow>
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
