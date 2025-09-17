"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EJobTaskStatus } from "@/models/job.model";
import type { IJobTask } from "@/models";
import { CTaskStatusConfig } from "@/models/job.const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmailStatusButton } from "@/components/modals/send-email/email-status-button";
import useJobStore from "@/store/job/job-store";
import useSupplierStore from "@/store/supplier-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap } from "lucide-react";
import { EmailPreview } from "./email-preview";

interface SendEmailModalProps {
  task: IJobTask;
  onSendEmail: (status: EJobTaskStatus) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendEmailModal({ task, onSendEmail, open, onOpenChange }: SendEmailModalProps) {
  const { currentJob } = useJobStore();
  const { getSupplierById } = useSupplierStore();

  const supplier = task.supplierId ? getSupplierById(task.supplierId) : undefined;
  const attachmentCount = (task.purchaseOrderLinks?.length || 0) + (task.planLinks?.length || 0);

  // Validate required fields for email
  const missingFields = useMemo(() => {
    const missing: string[] = [];

    if (!currentJob?.location) missing.push("Job location");
    if (!task.startDate) missing.push("Start date");
    if (!supplier) missing.push("Supplier");
    if (supplier && !supplier.email) missing.push("Supplier email");

    return missing;
  }, [currentJob, task, supplier]);

  const canSendEmail = missingFields.length === 0;

  const onSelectEmailTemplate = async (status: EJobTaskStatus) => {
    if (!canSendEmail) return;

    onOpenChange(false);
    onSendEmail(status);
  };

  const statusOptions = [EJobTaskStatus.Scheduled, EJobTaskStatus.ReScheduled, EJobTaskStatus.Cancelled];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Schedule</DialogTitle>
          <DialogDescription>{task.name || "Select a template to send an email to the supplier"}</DialogDescription>
        </DialogHeader>
        {/* Can't send email at all */}
        {!canSendEmail && (
          <Alert variant="destructive">
            <AlertTitle>Cannot send email</AlertTitle>
            <AlertDescription>
              The following fields are required, try adding them to the task first:
              <ul className="mt-2 ml-4 list-disc text-sm">
                {missingFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Only display options if email can be sent */}
        {canSendEmail && (
          <div className="flex flex-col sm:flex-row gap-6 py-4">
            <div className="flex-1 space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Email</h3>
              {/* Email Preview Section */}
              {canSendEmail && (
                <EmailPreview
                  recipientName={supplier?.name}
                  task={task}
                  location={currentJob?.location}
                  attachmentCount={attachmentCount}
                />
              )}
            </div>

            {/* Email Template Selection */}
            <div className="flex-1 flex flex-col sm:max-w-[250px] space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Choose Template</h3>

              <div className="space-y-3">
                {statusOptions.map((status) => {
                  const config = CTaskStatusConfig[status];
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      onClick={() => onSelectEmailTemplate(status)}
                      className={cn(
                        "w-full h-12 px-4 relative justify-start",
                        !canSendEmail && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Zap className={cn("absolute left-4 h-5 w-5", config.textColor)} />
                      <span className="ml-8 font-medium">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EmailStatusTriggerProps {
  task: IJobTask;
  value: EJobTaskStatus;
  onSendEmail: (status: EJobTaskStatus) => void;
  className?: string;
}

export function EmailStatusTrigger({ task, value, onSendEmail, className }: EmailStatusTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <EmailStatusButton status={value} onClick={() => setOpen(true)} className={className} />
      <SendEmailModal task={task} onSendEmail={onSendEmail} open={open} onOpenChange={setOpen} />
    </>
  );
}
