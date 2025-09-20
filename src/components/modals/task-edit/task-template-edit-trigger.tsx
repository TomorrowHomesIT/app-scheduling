"use client";

import { useState } from "react";
import { TaskEditModal, type ITaskEditData, type ITaskEditUpdates } from "./task-edit-modal";
import { Button } from "@/components/ui/button";
import useTaskStore from "@/store/task-store";
import type { ITask } from "@/models/task.model";

interface TaskTemplateEditTriggerProps {
  task: ITask;
  children: React.ReactNode;
  className?: string;
}

export function TaskTemplateEditTrigger({ task, children, className }: TaskTemplateEditTriggerProps) {
  const [open, setOpen] = useState(false);

  // Convert TaskWithStage to ITaskEditData
  const taskEditData: ITaskEditData = {
    id: task.id,
    name: task.name,
    costCenter: task.costCenter,
    docTags: task.docTags,
  };

  const handleSave = async (taskId: number, updates: ITaskEditUpdates) => {
    const { updateTask } = useTaskStore.getState();
    await updateTask(taskId, {
      name: updates.name,
      costCenter: updates.costCenter ?? undefined,
      docTags: updates.docTags ?? undefined,
    });
  };

  return (
    <>
      <Button variant="ghost" className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <TaskEditModal
        task={taskEditData}
        onSave={handleSave}
        open={open}
        onOpenChange={setOpen}
        showSyncButton={false}
      />
    </>
  );
}
