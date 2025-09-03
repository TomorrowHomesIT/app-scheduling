import { Badge } from "@/components/ui/badge";
import { EJobTaskProgress } from "@/models/job.model";
import { CTaskProgressConfig } from "@/models/job.const";
import { cn } from "@/lib/utils";
import { ModalTriggerButton } from "@/components/ui/buttons/modal-trigger-button";

interface ProgressBadgeButtonProps {
  progress: EJobTaskProgress;
  onClick: () => void;
  className?: string;
}

export function ProgressBadgeButton({ progress, onClick, className }: ProgressBadgeButtonProps) {
  const config = CTaskProgressConfig[progress];
  const hasValue = progress !== EJobTaskProgress.None;
  const hasValueStyles = hasValue ? "hover:bg-transparent" : "";

  return (
    <ModalTriggerButton hasValue={hasValue} className={cn(hasValueStyles, className)} setOpen={onClick}>
      <Badge className={cn("w-full", config.className)}>
        <span>{config.label}</span>
      </Badge>
    </ModalTriggerButton>
  );
}
