"use client";

import {
  ComputerIcon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="relative" />}
      >
        <HugeiconsIcon
          icon={Sun01Icon}
          strokeWidth={2}
          className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
        />
        <HugeiconsIcon
          icon={Moon02Icon}
          strokeWidth={2}
          className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ModeToggle };
