import { Alert, AlertDescription } from "@/components/ui/alert";
import type { IJobTask } from "@/models";
import { useMemo } from "react";

interface EmailPreviewProps {
  recipientName?: string;
  task: IJobTask;
  location?: string;
  attachmentCount: number;
}

export function EmailPreview({ recipientName, task, location, attachmentCount = 0 }: EmailPreviewProps) {
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";

    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const missingAttachments = useMemo(() => {
    const missing: string[] = [];

    if (!task.purchaseOrderLinks?.length) missing.push("Purchase order");
    if (!task.planLinks?.length) missing.push("Plan");

    return missing;
  }, [task]);

  return (
    <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold">To:</p>
          <p className="text-sm">{recipientName}</p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold">Task:</p>
          <p className="text-sm">{task.name}</p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold">Location:</p>
          <p className="text-sm">{location}</p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold">Start Date:</p>
          <p className="text-sm">{formatDate(task.startDate)}</p>
        </div>
      </div>

      {task.notes && (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-xs font-bold">Notes:</p>
            <p className="text-sm">{task.notes}</p>
          </div>
        </div>
      )}

      {attachmentCount > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            {attachmentCount} document{attachmentCount > 1 ? "s" : ""} will be included
          </p>
        </div>
      )}

      {!attachmentCount && (
        <Alert variant="warning">
          <AlertDescription>
            The email will be sent without a:
            <ul className="mt-2 ml-4 list-disc text-sm">
              {missingAttachments.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
