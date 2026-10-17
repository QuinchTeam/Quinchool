import type { Icon, IconProps } from "@phosphor-icons/react/lib";

export type AppIconProps = Omit<IconProps, "weight"> & { icon: Icon };

export function AppIcon({ icon: Component, ...props }: AppIconProps) {
  return <Component size={24} {...props} weight="duotone" />;
}
