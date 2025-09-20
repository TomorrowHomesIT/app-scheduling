"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskEditModal, type ITaskEditData, type ITaskEditUpdates } from "../modals/task-edit/task-edit-modal";
import type { IJobTask } from "@/models/job.model";

interface JobTaskEditTriggerProps {
  task: IJobTask;
  onSave: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  onSync: (jobId: number) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function JobTaskEditTrigger({ task, onSave, onSync, children, className }: JobTaskEditTriggerProps) {
  const [open, setOpen] = useState(false);

  // Convert IJobTask to ITaskEditData
  const taskEditData: ITaskEditData = {
    id: task.id,
    name: task.name,
    costCenter: task.costCenter,
    docTags: task.docTags,
    jobId: task.jobId,
  };

  // Wrapper to convert ITaskEditUpdates to Partial<IJobTask>
  const handleSave = async (taskId: number, updates: ITaskEditUpdates) => {
    const jobTaskUpdates: Partial<IJobTask> = {
      name: updates.name,
      costCenter: updates.costCenter,
      docTags: updates.docTags,
    };
    await onSave(taskId, jobTaskUpdates);
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn("text-left p-0 w-full justify-start", className)}
        type="button"
      >
        {children}
      </Button>
      <TaskEditModal
        task={taskEditData}
        onSave={handleSave}
        onSync={onSync}
        open={open}
        onOpenChange={setOpen}
        showSyncButton={true}
      />
    </>
  );
}
