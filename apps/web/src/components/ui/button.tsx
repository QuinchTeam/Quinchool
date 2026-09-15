import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-linear-to-b from-white/10 to-black/10 bg-clip-border border-[1.5px] border-primary-light outline-2 outline-solid outline-black text-primary-foreground hover:bg-primary/80 focus-visible:border-background",
        outline:
          "bg-transparent bg-clip-border border-[1.5px] border-border outline-2 outline-solid outline-edge hover:bg-muted hover:text-foreground focus-visible:border-ring aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-secondary dark:aria-expanded:bg-secondary",
        secondary:
          "border-[1.5px] border-border bg-secondary bg-clip-border text-secondary-foreground outline-2 outline-solid outline-edge hover:bg-secondary/80 aria-expanded:bg-secondary/80 aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 bg-clip-border border-[1.5px] border-destructive/30 outline-2 outline-solid outline-destructive-edge text-destructive hover:bg-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-7 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
      rounded: {
        full: "rounded-full",
        sm: "rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "full",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  rounded = "full",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
