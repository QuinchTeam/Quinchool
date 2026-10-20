import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { AppIcon } from "@/components/ui/icon";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type EdgeTypes,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const REMOVABLE_EDGE_TYPE = "removable";

function RemovableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {/* A wider invisible path makes thin edges easier to hover. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative mouse-only hover zone; deleting an edge stays keyboard-accessible via select + Delete */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: "stroke" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered && (
        <EdgeLabelRenderer>
          <Button
            // Re-enable pointer events without letting the delete button drag or pan the canvas.
            className="nodrag nopan pointer-events-auto absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            type="button"
            variant="secondary"
            size="icon-xs"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => deleteElements({ edges: [{ id }] })}
          >
            <AppIcon icon={XIcon} />
            <span className="sr-only">Remove connection</span>
          </Button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const edgeTypes: EdgeTypes = {
  [REMOVABLE_EDGE_TYPE]: RemovableEdge,
};
