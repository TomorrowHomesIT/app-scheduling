"use client";

import { Badge } from "@/components/ui/badge";
import { EJobTaskStatus } from "@/models/job.model";
import { cn } from "@/lib/utils";
import { CTaskStatusConfig } from "@/models/job.const";
import { ModalTriggerButton } from "@/components/modal-trigger-button";

interface EmailStatusButtonProps {
  status: EJobTaskStatus;
  onClick: () => void;
  className?: string;
}

export function EmailStatusButton({ status, onClick, className }: EmailStatusButtonProps) {
  const config = CTaskStatusConfig[status];
  const hasValue = status !== EJobTaskStatus.None;
  const hasValueStyles = hasValue ? "hover:bg-transparent" : "";

  return (
    <ModalTriggerButton hasValue={hasValue} className={cn(hasValueStyles, className)} setOpen={onClick}>
      <Badge className={cn("w-full", config.className)}>
        <span>{config.label}</span>
      </Badge>
    </ModalTriggerButton>
  );
}
