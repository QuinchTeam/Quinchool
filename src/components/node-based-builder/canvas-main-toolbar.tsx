import { Delete02Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
        <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
        {isRunning ? "Running..." : "Run Flow"}
      </Button>
      <Button
        disabled={isRunning}
        onClick={onClear}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        <span className="sr-only">Clear canvas</span>
      </Button>
    </div>
  );
}
