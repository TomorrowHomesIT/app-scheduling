import { Badge } from "@/components/ui/badge";
import type { EJobTaskStatus } from "@/models/job.model";
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

  return (
    <ModalTriggerButton hasValue={true} className={cn("hover:bg-transparent", className)} setOpen={onClick}>
      <Badge className={cn("w-full", config.className)}>
        <span>{config.completeLabel}</span>
      </Badge>
    </ModalTriggerButton>
  );
}
