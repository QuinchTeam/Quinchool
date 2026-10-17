import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { AppIcon, type AppIconProps } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: Omit<AppIconProps, "icon">) {
  return (
    <AppIcon
      icon={CircleNotchIcon}
      role="status"
      aria-label="Loading"
      className={cn("size-5 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
