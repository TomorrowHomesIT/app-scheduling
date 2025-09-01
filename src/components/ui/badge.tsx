import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        custom: "bg-gray-100 text-gray-800 border-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  color?: string;
  icon?: LucideIcon;
}

function Badge({ className, variant, asChild = false, color, icon: Icon, children, style, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  const customStyle =
    color && variant === "custom"
      ? {
          backgroundColor: `${color}20`,
          color: color,
          border: `1px solid ${color}40`,
          ...style,
        }
      : style;

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} style={customStyle} {...props}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
