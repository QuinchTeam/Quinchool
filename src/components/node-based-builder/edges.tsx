import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

// Node connections are edges. Set this as the edge type so every connection
// carries its own remove button (see the canvas' onConnect).
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
      {/* Transparent wide band over the thin line — the real hover target,
          since BaseEdge only reports pointer events on the visible path. */}
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
            // The edge layer ignores pointer events, so the button re-enables
            // them; nodrag/nopan keep the click from panning the canvas. The
            // inline transform pins it to the edge midpoint (dynamic — can't be
            // a Tailwind class). Its own hover handlers keep the button alive
            // while the cursor moves from the line onto it.
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
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
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
