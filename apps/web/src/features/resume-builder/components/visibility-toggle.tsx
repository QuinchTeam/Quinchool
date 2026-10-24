import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";

export function VisibilityToggle({
  hidden,
  label,
  onToggle,
}: {
  hidden: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`${hidden ? "Show" : "Hide"} ${label}`}
      aria-pressed={hidden}
      onClick={onToggle}
    >
      <AppIcon icon={hidden ? EyeSlashIcon : EyeIcon} />
    </Button>
  );
}
