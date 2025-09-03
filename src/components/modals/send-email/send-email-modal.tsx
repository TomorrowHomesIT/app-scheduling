"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EJobTaskStatus } from "@/models/job.model";
import { CTaskStatusConfig } from "@/models/job.const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

interface SendEmailModalProps {
  onChange: (status: EJobTaskStatus) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendEmailModal({ onChange, open, onOpenChange }: SendEmailModalProps) {
  const handleStatusSelect = (status: EJobTaskStatus) => {
    onChange(status);
    onOpenChange(false);
  };

  const statusOptions = [EJobTaskStatus.Scheduled, EJobTaskStatus.ReScheduled, EJobTaskStatus.Cancelled];

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
                variant="outline"
                onClick={() => handleStatusSelect(status)}
                className={cn("w-full h-12 px-4 relative", "hover:scale-[1.02] transition-transform duration-150")}
              >
                <div className={cn("absolute left-4 h-3 w-3 rounded-full", config.statusColor)} />
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
  value: EJobTaskStatus;
  onChange: (status: EJobTaskStatus) => void;
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
