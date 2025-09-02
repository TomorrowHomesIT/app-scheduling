"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressBadge } from "@/components/ui/progress-badge";
import { ETaskProgress } from "@/models/task.model";
import { CTaskProgressConfig } from "@/models/task.const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressModalProps {
  value: ETaskProgress;
  onChange: (progress: ETaskProgress) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgressModal({ value, onChange, open, onOpenChange }: ProgressModalProps) {
  const [selectedProgress, setSelectedProgress] = useState<ETaskProgress>(value);

  const handleProgressSelect = (progress: ETaskProgress) => {
    setSelectedProgress(progress);
    onChange(progress);
    onOpenChange(false);
  };

  const progressOptions = [
    ETaskProgress.ToCall,
    ETaskProgress.Called,
    ETaskProgress.Confirmed,
    ETaskProgress.Started,
    ETaskProgress.Completed,
    ETaskProgress.NotRequired,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Select Progress</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          {progressOptions.map((progress) => {
            const config = CTaskProgressConfig[progress];
            return (
              <Button
                key={progress}
                variant="outline"
                className={cn(
                  "w-full h-12 px-4 cursor-pointer relative",
                  config.className,
                  "hover:scale-[1.02] transition-transform duration-150",
                )}
                onClick={() => handleProgressSelect(progress)}
              >
                {selectedProgress === progress && (
                  <Check className="absolute left-4 h-5 w-5" />
                )}
                <span className="font-medium">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProgressTriggerProps {
  value: ETaskProgress;
  onChange: (progress: ETaskProgress) => void;
  className?: string;
}

export function ProgressTrigger({ value, onChange, className }: ProgressTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ProgressBadge progress={value} onClick={() => setOpen(true)} className={className} />
      <ProgressModal value={value} onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
