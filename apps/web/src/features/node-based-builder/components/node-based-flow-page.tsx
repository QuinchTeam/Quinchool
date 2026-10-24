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

import { useRunFlow } from "@/features/node-based-builder/hooks/use-run-flow";
import { CanvasMainToolbar } from "./canvas-main-toolbar";
import { CanvasNodeToolbar } from "./canvas-node-toolbar";
import { edgeTypes, REMOVABLE_EDGE_TYPE } from "./edges";
import {
  createNodeData,
  NODE_DRAG_MIME,
  type NodeCardType,
  nodeTypes,
} from "./nodes";

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

// Wait for hydration before React Flow reads the system color mode.
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
  const { screenToFlowPosition } = useReactFlow();
  const colorMode = useSsrSafeColorMode();

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

  const { isRunning, runFlow } = useRunFlow({
    edges,
    nodes,
    setEdges,
    setNodes,
  });

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

export function NodeBasedFlowPage() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
