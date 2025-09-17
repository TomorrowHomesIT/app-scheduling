import { Badge } from "@/components/ui/badge";
import type { EJobTaskProgress } from "@/models/job.model";
import { CTaskProgressConfig } from "@/models/job.const";
import { cn } from "@/lib/utils";
import { ModalTriggerButton } from "@/components/modal-trigger-button";

interface ProgressBadgeButtonProps {
  progress: EJobTaskProgress;
  onClick: () => void;
  className?: string;
}

export function ProgressBadgeButton({ progress, onClick, className }: ProgressBadgeButtonProps) {
  const config = CTaskProgressConfig[progress];
  
  return (
    <ModalTriggerButton hasValue={true} className={cn("hover:bg-transparen", className)} setOpen={onClick}>
      <Badge className={cn("w-full", config.className)}>
        <span>{config.label}</span>
      </Badge>
    </ModalTriggerButton>
  );
}
