"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ETaskStatus } from "@/models/task.model";
import { CTaskStatusConfig } from "@/models/task.const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

interface SendEmailModalProps {
  onChange: (status: ETaskStatus) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendEmailModal({ onChange, open, onOpenChange }: SendEmailModalProps) {

  const handleStatusSelect = (status: ETaskStatus) => {
    onChange(status);
    onOpenChange(false);
  };

  const statusOptions = [ETaskStatus.Scheduled, ETaskStatus.ReScheduled, ETaskStatus.Cancelled];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Choose email template</DialogTitle>
          <DialogDescription>Select an email template to send</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {statusOptions.map((status) => {
            const config = CTaskStatusConfig[status];
            return (
              <Button
                key={status}
                variant="ghost"
                onClick={() => handleStatusSelect(status)}
                className={cn(
                  "w-full h-12 px-4",
                  config.className,
                  "hover:scale-[1.02] transition-transform duration-150",
                )}
              >
                <span className="font-medium">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StatusTriggerProps {
  value: ETaskStatus;
  onChange: (status: ETaskStatus) => void;
  className?: string;
}

export function StatusTrigger({ value, onChange, className }: StatusTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <StatusBadge status={value} onClick={() => setOpen(true)} className={className} />
      <SendEmailModal onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
