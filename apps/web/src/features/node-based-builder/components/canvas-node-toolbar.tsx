import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { AppIcon } from "@/components/ui/icon";
import {
  NODE_CARDS,
  NODE_DRAG_MIME,
  type NodeCardType,
} from "@/features/node-based-builder/components/nodes";
import { Button } from "@/components/ui/button";

// Each entry both clicks (spawn at canvas center) and drags (spawn at drop
// point). The canvas owns the actual spawn; the toolbar only reports intent.
export function CanvasNodeToolbar({
  onSpawn,
}: {
  onSpawn: (type: NodeCardType) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm">
      <header className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <AppIcon icon={SquaresFourIcon} size={14} />
        Nodes
      </header>
      {NODE_CARDS.map((card) => (
        <Button
          key={card.type}
          type="button"
          variant="outline"
          size="sm"
          className="justify-start"
          draggable
          onClick={() => onSpawn(card.type)}
          onDragStart={(event) => {
            event.dataTransfer.setData(NODE_DRAG_MIME, card.type);
            event.dataTransfer.effectAllowed = "move";
          }}
        >
          <AppIcon icon={card.icon} />
          {card.label}
        </Button>
      ))}
    </div>
  );
}
