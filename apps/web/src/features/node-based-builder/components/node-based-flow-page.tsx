"use client";

import {
  Background,
  BackgroundVariant,
  type ColorMode,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

import "@xyflow/react/dist/style.css";

import { useFlowStore } from "@/features/node-based-builder/store/flow-store";
import { CanvasMainToolbar } from "./canvas-main-toolbar";
import { CanvasNodeToolbar } from "./canvas-node-toolbar";
import { edgeTypes } from "./edges";
import { NODE_DRAG_MIME, type NodeCardType, nodeTypes } from "./nodes";

// Wait for hydration before React Flow reads the system color mode.
function useSsrSafeColorMode(): ColorMode {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted && resolvedTheme === "dark" ? "dark" : "light";
}

function CanvasContent() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const spawnNode = useFlowStore((state) => state.spawnNode);
  const { screenToFlowPosition } = useReactFlow();
  const colorMode = useSsrSafeColorMode();

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
          <CanvasMainToolbar />
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
