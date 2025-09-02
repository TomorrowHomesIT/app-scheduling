"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ETaskProgress } from "@/models/task.model";
import { CTaskProgressConfig } from "@/models/task.const";
import { cn } from "@/lib/utils";

interface ProgressBadgeProps {
  progress: ETaskProgress;
  onClick?: () => void;
  className?: string;
}

export function ProgressBadge({ progress, onClick, className }: ProgressBadgeProps) {
  const config = CTaskProgressConfig[progress];

  const BadgeContent = () => <span>{config.label}</span>;

  if (onClick) {
    return (
      <Button
        variant="ghost"
        className={cn("h-auto p-0 hover:bg-gray-200 w-full justify-start", className)}
        onClick={onClick}
      >
        <Badge className={config.className}>
          <BadgeContent />
        </Badge>
      </Button>
    );
  }

  return (
    <Badge className={cn(config.className, className)}>
      <BadgeContent />
    </Badge>
  );
}