"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
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
import { useCallback, useRef } from "react";

import "@xyflow/react/dist/style.css";

import {
  edgeTypes,
  REMOVABLE_EDGE_TYPE,
} from "@/components/node-based-builder/edges";
import {
  createNodeData,
  NODE_DRAG_MIME,
  type NodeCardType,
  nodeTypes,
} from "@/components/node-based-builder/node-cards";
import { NodeToolbar } from "@/components/node-based-builder/node-toolbar";

let nodeCounter = 0;
function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

function FlowCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();

  const spawnNode = useCallback(
    (type: NodeCardType, position: { x: number; y: number }) => {
      setNodes((current) => [
        ...current,
        { id: nextNodeId(), type, position, data: createNodeData(type) },
      ]);
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

  // Click: drop the node at the visible center of the canvas.
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
        colorMode="system"
        proOptions={{ hideAttribution: true }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fitView
      >
        <Panel position="top-right">
          <NodeToolbar onSpawn={handleSpawnAtCenter} />
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

export default function NodeBasedFlowPage() {
  return (
    <div className="flex-1">
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
