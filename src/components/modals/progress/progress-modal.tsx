"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressBadgeButton } from "@/components/modals/progress/progress-badge-button";
import { EJobTaskProgress } from "@/models/job.model";
import { CTaskProgressConfig } from "@/models/job.const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressModalProps {
  value: EJobTaskProgress;
  onChange: (progress: EJobTaskProgress) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgressModal({ value, onChange, open, onOpenChange }: ProgressModalProps) {
  const [selectedProgress, setSelectedProgress] = useState<EJobTaskProgress>(value);

  const handleProgressSelect = (progress: EJobTaskProgress) => {
    setSelectedProgress(progress);
    onChange(progress);
    onOpenChange(false);
  };

  const progressOptions = [
    EJobTaskProgress.ToCall,
    EJobTaskProgress.Called,
    EJobTaskProgress.Confirmed,
    EJobTaskProgress.Started,
    EJobTaskProgress.Completed,
    EJobTaskProgress.NotRequired,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Set Progress</DialogTitle>
          <DialogDescription>Select a progress to set for the task</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          {progressOptions.map((progress) => {
            const config = CTaskProgressConfig[progress];
            return (
              <Button
                key={progress}
                variant="outline"
                className={cn("w-full h-12 px-4 relative", "hover:scale-[1.02] transition-transform duration-150")}
                onClick={() => handleProgressSelect(progress)}
              >
                <div className={cn("absolute left-4 h-3 w-3 rounded-full", config.progressColor)} />
                <span className="font-medium">{config.label}</span>
                {selectedProgress === progress && <Check className="absolute right-4 h-5 w-5" />}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProgressTriggerProps {
  value: EJobTaskProgress;
  onChange: (progress: EJobTaskProgress) => void;
  className?: string;
}

export function ProgressTrigger({ value, onChange, className }: ProgressTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ProgressBadgeButton progress={value} onClick={() => setOpen(true)} className={className} />
      <ProgressModal value={value} onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
