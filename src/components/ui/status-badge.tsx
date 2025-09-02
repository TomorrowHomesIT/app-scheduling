"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EJobTaskStatus } from "@/models/job.model";
import { cn } from "@/lib/utils";
import { CTaskStatusConfig } from "@/models/task.const";

interface StatusBadgeProps {
  status: EJobTaskStatus;
  onClick?: () => void;
  className?: string;
}

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const config = CTaskStatusConfig[status];

  const BadgeContent = () => <span>{config.label}</span>;

  if (onClick) {
    return (
      <Button
        variant="ghost"
        className={cn("h-auto p-0 hover:bg-gray-200 w-full justify-start", className)}
        onClick={onClick}
      >
        <Badge className={cn("gap-1.5 justify-start", config.className)}>
          <BadgeContent />
        </Badge>
      </Button>
    );
  }

  return (
    <Badge className={cn("gap-1.5", config.className, className)}>
      <BadgeContent />
    </Badge>
  );
}
