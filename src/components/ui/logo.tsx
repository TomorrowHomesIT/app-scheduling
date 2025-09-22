import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends ComponentProps<"div"> {
  className?: string;
}

function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center p-2 rounded-sm bg-primary">
        <img src="/logos/light-green.svg" alt="Scheduling" width={16} height={16} />
      </div>
      <h2 className="text-lg font-semibold">Scheduling</h2>
    </div>
  );
}

export { Logo };
