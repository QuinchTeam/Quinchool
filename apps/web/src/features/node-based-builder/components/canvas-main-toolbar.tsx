import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { AppIcon } from "@/components/ui/icon";

import { Button } from "@/components/ui/button";

export function CanvasMainToolbar({
  isRunning,
  onClear,
  onRun,
}: {
  isRunning: boolean;
  onClear: () => void;
  onRun: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
      <Button disabled={isRunning} onClick={onRun} size="sm" type="button">
        <AppIcon icon={PlayIcon} />
        {isRunning ? "Running..." : "Run Flow"}
      </Button>
      <Button
        disabled={isRunning}
        onClick={onClear}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <AppIcon icon={TrashIcon} />
        <span className="sr-only">Clear canvas</span>
      </Button>
    </div>
  );
}
