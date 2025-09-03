import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-solid border-current border-r-transparent inline-block",
  {
    variants: {
      variant: {
        default: "text-primary",
        accent: "text-primary-foreground",
      },
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        default: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-3",
        xl: "h-12 w-12 border-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface SpinnerProps extends ComponentProps<"div">, VariantProps<typeof spinnerVariants> {}

function Spinner({ className, variant, size, ...props }: SpinnerProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: this is legit
    <div role="status" aria-label="Loading" className={cn(spinnerVariants({ variant, size }), className)} {...props} />
  );
}

export { Spinner, spinnerVariants };
