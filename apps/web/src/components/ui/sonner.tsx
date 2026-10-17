"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";
import { AppIcon } from "@/components/ui/icon";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <AppIcon icon={CheckCircleIcon} className="size-5" />,
        info: <AppIcon icon={InfoIcon} className="size-5" />,
        warning: <AppIcon icon={WarningIcon} className="size-5" />,
        error: <AppIcon icon={XCircleIcon} className="size-5" />,
        loading: (
          <AppIcon icon={CircleNotchIcon} className="size-5 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
