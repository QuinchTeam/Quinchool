import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { create } from "zustand";

import { REMOVABLE_EDGE_TYPE } from "@/features/node-based-builder/components/edges";
import {
  createNodeData,
  type NodeCardType,
} from "@/features/node-based-builder/components/nodes";

let nodeCounter = 0;

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  isRunning: boolean;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  spawnNode: (type: NodeCardType, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Record<string, unknown>) => void;
  setActiveEdge: (id?: string) => void;
  clear: () => void;
}

export const useFlowStore = create<FlowState>()((set) => ({
  nodes: [],
  edges: [],
  isRunning: false,
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge({ ...connection, type: REMOVABLE_EDGE_TYPE }, state.edges),
    })),
  spawnNode: (type, position) => {
    nodeCounter += 1;
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: `node-${nodeCounter}`,
          type,
          position,
          data: createNodeData(type),
        },
      ],
    }));
  },
  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    })),
  setActiveEdge: (id) =>
    set((state) => ({
      edges: state.edges.map((edge) => ({ ...edge, animated: edge.id === id })),
    })),
  clear: () => set({ nodes: [], edges: [] }),
}));
